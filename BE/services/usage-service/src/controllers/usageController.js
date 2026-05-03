const UsageReading = require("../models/UsageReading");
const MonthlyUsageSummary = require("../models/MonthlyUsageSummary");

// 1. Lấy danh sách bất thường (Anomaly Detection via Aggregation Pipeline)
exports.getAnomalies = async (req, res) => {
  try {
    const targetDate = req.query.date ? new Date(req.query.date) : new Date(new Date().setHours(0, 0, 0, 0));
    const thresholdPercent = req.query.threshold ? Number(req.query.threshold) : 200;

    const anomalies = await UsageReading.aggregate([
      { $match: { day: targetDate } },
      {
        $group: {
          _id: "$neighborhood_id",
          avg_neighborhood_usage: { $avg: "$total_daily_usage" },
          meters: { $push: { meter_id: "$meter_id", total_usage: "$total_daily_usage", readings: "$readings" } },
        },
      },
      { $unwind: "$meters" },
      {
        $project: {
          _id: 0,
          neighborhood_id: "$_id",
          meter_id: "$meters.meter_id",
          total_usage: "$meters.total_usage",
          readings: "$meters.readings",
          avg_neighborhood_usage: { $round: ["$avg_neighborhood_usage", 2] },
          usage_ratio_percent: {
            $round: [
              { $multiply: [ { $divide: [ "$meters.total_usage", { $cond: [ { $eq: ["$avg_neighborhood_usage", 0] }, 1, "$avg_neighborhood_usage" ] } ] }, 100 ] },
              2,
            ],
          },
        },
      },
      { $match: { usage_ratio_percent: { $gt: thresholdPercent } } },
      { $sort: { usage_ratio_percent: -1 } },
    ]);

    res.status(200).json({ success: true, count: anomalies.length, data: anomalies });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// 2. NHẬN DỮ LIỆU ĐO LƯỜNG TỪ SMART METER MỖI 15 PHÚT (Áp dụng Bucket Pattern)
exports.recordUsage = async (req, res) => {
  try {
    const { meter_id, neighborhood_id, usage, timestamp, longitude, latitude } = req.body;
    
    const readingTime = new Date(timestamp || Date.now());
    const startOfDay = new Date(readingTime.getFullYear(), readingTime.getMonth(), readingTime.getDate());

    // Tạo đối tượng cập nhật
    const updateObj = {
      $setOnInsert: { neighborhood_id: neighborhood_id },
      $push: { readings: { timestamp: readingTime, usage: Number(usage) } },
      $inc: { total_daily_usage: Number(usage), reading_count: 1 }
    };

    // Nếu có tọa độ, lưu vào GeoJSON location
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

    // ================== ĐỒNG BỘ HÓA DỮ LIỆU HÀNG XÓM (REAL-TIME SIMULATION) ==================
    // Mỗi khi người dùng thật gửi 1 bản ghi, tự động cập nhật 10 hàng xóm ảo trong cùng khu vực
    const bgOps = [];
    const baseLng = longitude ? Number(longitude) : 106.7009;
    const baseLat = latitude ? Number(latitude) : 10.7769;

    for (let i = 2; i <= 11; i++) {
      const bgMeterId = `METER_BG_${i}_${neighborhood_id}`;
      const bgUsage = parseFloat((Math.random() * 0.25 + 0.1).toFixed(2)); // Tiêu thụ ảo ngẫu nhiên

      // Sinh tọa độ ngẫu nhiên nếu là lần đầu tạo đồng hồ này (upsert)
      const offsetLng = (Math.random() - 0.5) * 0.02;
      const offsetLat = (Math.random() - 0.5) * 0.02;

      bgOps.push({
        updateOne: {
          filter: { meter_id: bgMeterId, day: startOfDay },
          update: {
            $setOnInsert: { 
              neighborhood_id: neighborhood_id,
              location: {
                type: "Point",
                coordinates: [baseLng + offsetLng, baseLat + offsetLat]
              }
            },
            $push: { readings: { timestamp: readingTime, usage: bgUsage } },
            $inc: { total_daily_usage: bgUsage, reading_count: 1 }
          },
          upsert: true
        }
      });
    }

    // Thực hiện cập nhật đồng loạt hàng xóm ảo
    await UsageReading.bulkWrite(bgOps);

    res.status(200).json({ success: true, message: "Reading recorded successfully", current_count: result.reading_count });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// 6. TRIGGER THỦ CÔNG VIỆC TỔNG HỢP DỮ LIỆU THÁNG (Materialized View)
exports.triggerAggregation = async (req, res) => {
  try {
    const { aggregateMonthlyUsage } = require("../utils/aggregationWorker");
    await aggregateMonthlyUsage();
    res.status(200).json({ success: true, message: "Đã kích hoạt tổng hợp dữ liệu tháng thành công!" });
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

