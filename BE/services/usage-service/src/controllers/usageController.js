const UsageReading = require("../models/UsageReading");
const MonthlyUsageSummary = require("../models/MonthlyUsageSummary");
const MeterBaseline = require("../models/MeterBaseline");
const { baselineCache, alertBuffer } = require("../utils/memoryCache");


// 1. Lấy danh sách bất thường (Tier 1 & Tier 2 Integration - Z-Score Analysis)
exports.getAnomalies = async (req, res) => {
  try {
    let targetDate;
    if (req.query.date) {
      const [year, month, day] = req.query.date.split('-').map(Number);
      targetDate = new Date(year, month - 1, day);
    } else {
      targetDate = new Date();
      targetDate.setHours(0, 0, 0, 0);
    }
    const interval = req.query.interval !== undefined ? Number(req.query.interval) : -1;

    // Sử dụng Aggregation Pipeline để tính Z-Score dựa trên Baseline đã lưu
    const anomalies = await UsageReading.aggregate([
      { $match: { day: targetDate } },
      {
        // Join với bảng MeterBaseline để lấy mu và sigma
        $lookup: {
          from: "meterbaselines",
          localField: "meter_id",
          foreignField: "meter_id",
          as: "baseline_info"
        }
      },
      { $unwind: { path: "$baseline_info", preserveNullAndEmptyArrays: false } },
      {
        $project: {
          meter_id: 1,
          neighborhood_id: 1,
          total_daily_usage: 1,
          reading_count: 1,
          readings: 1, // Bổ sung để vẽ biểu đồ
          current_usage: { $arrayElemAt: ["$readings.usage", interval] },
          avg_usage_now: { $divide: ["$total_daily_usage", "$reading_count"] },
          mu: "$baseline_info.mu",
          sigma: "$baseline_info.sigma"
        }
      },
      {
        $addFields: {
          z_score: {
            $round: [
              {
                $divide: [
                  { $subtract: ["$current_usage", "$mu"] },
                  "$sigma"
                ]
              },
              2
            ]
          }
        }
      },
      {
        // Lọc các bản ghi có Z-Score vượt ngưỡng (bất thường mạnh)
        $match: {
          $or: [
            { z_score: { $gt: 3 } },
            { z_score: { $lt: -3 } }
          ]
        }
      },
      { $sort: { z_score: -1 } }
    ]);

    // Tìm mốc interval gần nhất của toàn bộ hệ thống
    const globalLatestDoc = await UsageReading.findOne({ day: targetDate }).sort({ reading_count: -1 });
    let latestInterval = globalLatestDoc ? globalLatestDoc.reading_count - 1 : 0;
    if (latestInterval > 95) latestInterval = 95;

    res.status(200).json({
      success: true,
      count: anomalies.length,
      latest_interval: latestInterval >= 0 ? latestInterval : 0,
      data: anomalies,
      method: "Z-Score Analysis (Tiered Model)"
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Lấy trạng thái toàn bộ đồng hồ (Tất cả chỉ số: Sigma, Mu, Z-Score, Lần bấm giả lập cuối cùng)
exports.getAllMetersStatus = async (req, res) => {
  try {
    let targetDate;
    if (req.query.date) {
      const [year, month, day] = req.query.date.split('-').map(Number);
      targetDate = new Date(year, month - 1, day);
    } else {
      targetDate = new Date();
      targetDate.setHours(0, 0, 0, 0);
    }
    const interval = req.query.interval !== undefined ? Number(req.query.interval) : -1;

    const meters = await UsageReading.aggregate([
      { $match: { day: targetDate } },
      {
        $lookup: {
          from: "meterbaselines",
          localField: "meter_id",
          foreignField: "meter_id",
          as: "baseline_info"
        }
      },
      { $unwind: { path: "$baseline_info", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          meter_id: 1,
          neighborhood_id: 1,
          total_daily_usage: 1,
          reading_count: 1,
          readings: 1,
          // Lấy mức tiêu thụ tại thời điểm được chọn (interval)
          current_usage: { $arrayElemAt: ["$readings.usage", interval] },
          avg_usage_now: { $divide: ["$total_daily_usage", { $cond: [{ $eq: ["$reading_count", 0] }, 1, "$reading_count"] }] },
          mu: { $ifNull: ["$baseline_info.mu", 0] },
          sigma: { $ifNull: ["$baseline_info.sigma", 0.01] } // Mặc định 0.01 để tránh chia cho 0
        }
      },
      {
        $addFields: {
          z_score: {
            $round: [
              {
                $divide: [
                  { $subtract: ["$current_usage", "$mu"] }, // Dùng current_usage tại interval đó
                  { $cond: [{ $eq: ["$sigma", 0] }, 0.01, "$sigma"] }
                ]
              },
              2
            ]
          }
        }
      },
      { $sort: { z_score: -1 } }
    ]);

    // Tính toán mốc interval gần nhất dựa trên số lượng bản ghi thực tế, giới hạn tối đa 95
    let latestInterval = meters.length > 0 ? Math.max(...meters.map(m => m.reading_count)) - 1 : 0;
    if (latestInterval > 95) latestInterval = 95;

    res.status(200).json({
      success: true,
      count: meters.length,
      latest_interval: latestInterval >= 0 ? latestInterval : 0,
      data: meters
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// 2. LỚP 1: Luồng Real-time Ingestion & Micro Anomaly (Luồng Ban Ngày)
exports.recordUsage = async (req, res) => {
  try {
    const { meter_id, neighborhood_id, usage, timestamp, longitude, latitude, simulation_mode } = req.body;

    const readingTime = new Date(timestamp || Date.now());
    const startOfDay = new Date(readingTime.getFullYear(), readingTime.getMonth(), readingTime.getDate());

    let X = Number(usage);
    const simMode = Number(simulation_mode) || 1;

    // Ghi đè lượng tiêu thụ của đồng hồ gốc nếu đang chọn chế độ sinh lỗi
    if (simMode === 2 || simMode === 3) {
      X = parseFloat((Math.random() * (9.0 - 6.0) + 6.0).toFixed(2)); // Cố tình bơm số điện siêu cao để chắc chắn Z > 3
    } else if (simMode === 4 || simMode === 5) {
      X = 0; // Mất điện: Tiêu thụ về 0
    }

    // ==========================================
    // ANOMALY DETECTION THỜI GIAN THỰC (LỚP 1)
    // ==========================================
    // Lấy baseline từ In-Memory Cache (thay thế cho Redis)
    let baseline = baselineCache.get(meter_id);
    if (!baseline) {
      // Fallback: Nếu không có trên cache, thử tìm trong DB
      const dbBaseline = await MeterBaseline.findOne({ meter_id });
      if (dbBaseline) {
        baseline = { mu: dbBaseline.mu, sigma: dbBaseline.sigma };
        baselineCache.set(meter_id, baseline);
      }
    }

    let isAnomaly = false;
    let zScore = 0;

    if (baseline && baseline.sigma > 0) {
      zScore = (X - baseline.mu) / baseline.sigma;

      if (X === 0 || zScore > 3 || zScore < -3) {
        isAnomaly = true;
        console.log(`[Anomaly Detected] Gửi sự kiện sang Notification Service: ${meter_id} (Usage: ${X}, Z-Score: ${zScore.toFixed(2)})`);
        
        try {
          fetch("http://localhost:3005/api/notifications/process-event", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ meter_id, neighborhood_id, usage: X, z_score: zScore })
          }).catch(err => console.error("Error calling notification service:", err.message));
        } catch (e) {
          console.error(e);
        }
      } else {
        // Clear watchlist if it returns to normal
        try {
          fetch("http://localhost:3005/api/notifications/clear-watchlist", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ meter_id })
          }).catch(e => {});
        } catch (e) {}
      }
    } else if (X === 0) {
      // Hard rule even if no baseline
      isAnomaly = true;
      try {
        fetch("http://localhost:3005/api/notifications/process-event", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ meter_id, neighborhood_id, usage: X, z_score: 0 })
        }).catch(e => {});
      } catch (e) {}
    }

    // ==========================================
    // LƯU TRỮ VÀO MONGODB (Single-Document Atomicity)
    // ==========================================
    const updateObj = {
      $setOnInsert: { neighborhood_id: neighborhood_id },
      $push: { readings: { timestamp: readingTime, usage: X } },
      $inc: { total_daily_usage: X, reading_count: 1 }
    };

    if (longitude && latitude) {
      updateObj.$set = {
        location: {
          type: "Point",
          coordinates: [Number(longitude), Number(latitude)]
        }
      };
    }

    const result = await UsageReading.findOneAndUpdate(
      { meter_id: meter_id, day: startOfDay },
      updateObj,
      { upsert: true, new: true }
    );

    // ==========================================
    // ĐỒNG BỘ HÓA DỮ LIỆU HÀNG XÓM (REAL-TIME SIMULATION)
    // ==========================================
    const bgOps = [];
    const baseLng = longitude ? Number(longitude) : 106.7009;
    const baseLat = latitude ? Number(latitude) : 10.7769;

    for (let i = 2; i <= 11; i++) {
      const bgMeterId = `METER_BG_${i}_${neighborhood_id}`;
      let bgUsage = parseFloat((Math.random() * 0.25 + 0.1).toFixed(2));

      // Điều khiển lỗi hàng xóm theo chế độ (Mode)
      if (simMode === 2) {
        // Chế độ 2: Micro Anomaly (Dưới 5 hộ). Ta cho 2 hàng xóm (i=2,3) bị lỗi theo.
        if (i <= 3) {
          bgUsage = X;
        }
      } else if (simMode === 3) {
        // Chế độ 3: Macro Anomaly (Từ 5 hộ trở lên). Ta cho 7 hàng xóm (i=2..8) bị lỗi theo.
        if (i <= 8) {
          bgUsage = X;
        }
      } else if (simMode === 5) {
        // Chế độ 5: Mất điện toàn khu. Tất cả hàng xóm cũng về 0.
        bgUsage = 0;
      }

      const offsetLng = (Math.random() - 0.5) * 0.02;
      const offsetLat = (Math.random() - 0.5) * 0.02;

      bgOps.push({
        updateOne: {
          filter: { meter_id: bgMeterId, day: startOfDay },
          update: {
            $setOnInsert: {
              neighborhood_id: neighborhood_id,
              location: { type: "Point", coordinates: [baseLng + offsetLng, baseLat + offsetLat] }
            },
            $push: { readings: { timestamp: readingTime, usage: bgUsage } },
            $inc: { total_daily_usage: bgUsage, reading_count: 1 }
          },
          upsert: true
        }
      });
    }

    await UsageReading.bulkWrite(bgOps);

    // ==========================================
    // TỰ ĐỘNG KÍCH HOẠT LỚP 2 (BATCH JOB) KHI HẾT NGÀY (96/96)
    // ==========================================
    // if (result.reading_count >= 96) {
    //   console.log(`[Batch Job - AUTO] Đồng hồ ${meter_id} đã đủ 96 chỉ số. Kích hoạt tính toán lại Baseline và Tổng hợp tháng...`);
    //   const { calculateMeterBaselines, aggregateMonthlyUsage } = require("../utils/aggregationWorker");

    //   // Chạy cả 2 tác vụ bất đồng bộ
    //   Promise.all([
    //     calculateMeterBaselines(),
    //     aggregateMonthlyUsage()
    //   ]).then(() => {
    //     console.log("[Batch Job - AUTO] Đã hoàn thành cập nhật Baseline và Monthly Summary.");
    //   }).catch(err => {
    //     console.error("[Batch Job - AUTO] Lỗi khi chạy tác vụ tự động:", err);
    //   });
    // }
    if (result.reading_count >= 96) {
      console.log(`[Batch Job - AUTO] Đồng hồ ${meter_id} đã đủ 96 chỉ số. Kích hoạt tính toán lại Baseline và Tổng hợp tháng...`);
      const { calculateMeterBaselines, aggregateMonthlyUsage } = require("../utils/aggregationWorker");

      // Chạy cả 2 tác vụ bất đồng bộ
      Promise.all([
        calculateMeterBaselines(),
        aggregateMonthlyUsage()
      ]).then(async () => {

        console.log("[Batch Job] Aggregation done → CALL MONTHLY API");

        try {
          // ==========================================
          // 1. LẤY DATA QUA API (đúng kiến trúc bạn đã build)
          // ==========================================
          const monthStr = startOfDay.toISOString().slice(0, 7);

          const usageRes = await fetch(
            `http://localhost:3004/api/usage/monthly-summary?meter_id=${meter_id}&month=${monthStr}`
          );

          const usageJson = await usageRes.json();

          if (!usageJson.success || !usageJson.data?.length) {
            console.log("No monthly data found");
            return;
          }

          const monthlyData = usageJson.data[0];

          // Lấy customer_id và contract_id
          const userId = Number(meter_id.split("_")[1]); // 33
          const customerRes = await fetch(
            `http://localhost:3001/customer/customer-contract-id?user_id=${userId}`
          );
          const customerJson = await customerRes.json();

          if (!customerJson.customer_id || !customerJson.contract_id) {
            throw new Error("Cannot get customer-contract info");
          }

          const customer_id = customerJson.customer_id;
          const contract_id = customerJson.contract_id;
          const contract_rate = customerJson.contract_rate;
          // ==========================================
          // 2. CALL BILLING SERVICE
          // ==========================================

          const billingRes = await fetch("http://localhost:3003/billing/generates", {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              invoice_month: monthlyData.month + "-01",
              invoice_total_usage: monthlyData.total_monthly_usage,
              invoice_rate: contract_rate,
              invoice_customer_id: customer_id,
              invoice_contract_id: contract_id
            })
          });

          const billingData = await billingRes.json();

          console.log("🔥 BILLING RESPONSE:", billingData);

          if (!billingRes.ok) {
            console.error("❌ Billing FAILED:", billingData);
          } else {
            console.log("✅ Billing SUCCESS:", billingData);
          }

        } catch (err) {
          console.error("[Billing ERROR]", err);
        }

      }).catch(err => {
        console.error("[Batch Job ERROR]", err);
      });
    }

    // Thêm log để mô phỏng Alert nếu có
    res.status(200).json({
      success: true,
      message: "Reading recorded successfully",
      current_count: result.reading_count,
      anomaly_detected: isAnomaly,
      z_score: zScore
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// 6. TRIGGER THỦ CÔNG VIỆC TỔNG HỢP DỮ LIỆU THÁNG & BASELINE
exports.triggerAggregation = async (req, res) => {
  try {
    const { aggregateMonthlyUsage, calculateMeterBaselines } = require("../utils/aggregationWorker");
    await aggregateMonthlyUsage();
    await calculateMeterBaselines();
    res.status(200).json({ success: true, message: "Đã kích hoạt tổng hợp dữ liệu tháng và tính toán Baseline thành công!" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// 3. XEM LỊCH SỬ TIÊU THỤ CỦA 1 KHÁCH HÀNG
exports.getUsageHistory = async (req, res) => {
  try {
    const { meter_id } = req.params;
    const history = await UsageReading.find({ meter_id: meter_id })
      .sort({ day: -1 })
      .limit(7)
      .select('day total_daily_usage reading_count readings');

    res.status(200).json({ success: true, data: history });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// 4. TRUY VẤN KHÔNG GIAN - TÌM TẤT CẢ ĐỒNG HỒ TRONG BÁN KÍNH (Geospatial Query)
exports.geoSearch = async (req, res) => {
  try {
    const { longitude, latitude, radiusKm, date } = req.query;

    if (!longitude || !latitude) {
      return res.status(400).json({ success: false, message: "Vui lòng cung cấp tọa độ (longitude, latitude)" });
    }

    const lng = Number(longitude);
    const lat = Number(latitude);
    const radius = Number(radiusKm || 2);
    const targetDate = date ? new Date(date) : new Date(new Date().setHours(0, 0, 0, 0));

    // Sử dụng $geoNear Aggregation Pipeline (yêu cầu 2dsphere index)
    const results = await UsageReading.aggregate([
      {
        $geoNear: {
          near: { type: "Point", coordinates: [lng, lat] },
          distanceField: "distance_meters",
          maxDistance: radius * 1000, // Chuyển km sang mét
          spherical: true,
          query: { day: targetDate }
        }
      },
      {
        $project: {
          _id: 0,
          meter_id: 1,
          neighborhood_id: 1,
          total_daily_usage: 1,
          reading_count: 1,
          location: 1,
          distance_meters: { $round: ["$distance_meters", 0] },
          distance_km: { $round: [{ $divide: ["$distance_meters", 1000] }, 2] }
        }
      },
      { $sort: { distance_meters: 1 } }
    ]);

    // Thống kê tổng hợp
    const totalMeters = results.length;
    const totalUsage = results.reduce((sum, r) => sum + (r.total_daily_usage || 0), 0);
    const avgUsage = totalMeters > 0 ? totalUsage / totalMeters : 0;

    // Phát hiện đồng hồ bất thường trong vùng (tiêu thụ > 2x trung bình)
    const stressMeters = results.filter(r => r.total_daily_usage > avgUsage * 2);

    res.status(200).json({
      success: true,
      query: {
        center: { longitude: lng, latitude: lat },
        radius_km: radius,
        date: targetDate
      },
      summary: {
        total_meters: totalMeters,
        total_usage_kwh: parseFloat(totalUsage.toFixed(2)),
        avg_usage_kwh: parseFloat(avgUsage.toFixed(2)),
        stress_meter_count: stressMeters.length
      },
      stress_meters: stressMeters,
      all_meters: results
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// 5. LẤY DANH SÁCH TRẠM BIẾN ÁP (Substations) - Dữ liệu mẫu HCM
exports.getSubstations = async (req, res) => {
  const substations = [
    { id: "SUB_01", name: "Trạm Quận 1 - Bến Thành", longitude: 106.6981, latitude: 10.7726, area: "Quận 1" },
    { id: "SUB_02", name: "Trạm Quận 3 - Võ Văn Tần", longitude: 106.6880, latitude: 10.7842, area: "Quận 3" },
    { id: "SUB_03", name: "Trạm Quận 7 - Phú Mỹ Hưng", longitude: 106.7218, latitude: 10.7340, area: "Quận 7" },
    { id: "SUB_04", name: "Trạm Bình Thạnh", longitude: 106.7132, latitude: 10.8006, area: "Bình Thạnh" },
    { id: "SUB_05", name: "Trạm Thủ Đức", longitude: 106.7520, latitude: 10.8490, area: "TP. Thủ Đức" },
    { id: "SUB_06", name: "Trạm Tân Bình", longitude: 106.6529, latitude: 10.8012, area: "Tân Bình" },
  ];
  res.status(200).json({ success: true, data: substations });
};

// 6. LẤY TỔNG HỢP TIÊU THỤ THÁNG (Sử dụng Materialized View)
exports.getMonthlySummary = async (req, res) => {
  try {
    const { month } = req.query; // Ví dụ: "2026-05"
    const { meter_id } = req.query;

    let query = {};
    if (month) query.month = month;
    if (meter_id) query.meter_id = meter_id;

    const data = await MonthlyUsageSummary.find(query).sort({ month: -1 });

    res.status(200).json({
      success: true,
      message: "Lấy dữ liệu tổng hợp tháng thành công",
      count: data.length,
      data
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

