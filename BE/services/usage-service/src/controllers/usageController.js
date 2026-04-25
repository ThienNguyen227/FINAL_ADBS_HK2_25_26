const UsageReading = require("../models/UsageReading");

// 1. Lấy danh sách bất thường (Đã làm)
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
    const { meter_id, neighborhood_id, usage, timestamp } = req.body;
    
    // Chuẩn hoá ngày về 00:00:00 để làm khóa (Bucket Key) cho ngày đó
    const readingTime = new Date(timestamp || Date.now());
    const startOfDay = new Date(readingTime.getFullYear(), readingTime.getMonth(), readingTime.getDate());

    // CẬP NHẬT (Hoặc Tạo mới nếu chưa có) document của ngày đó
    // Đây là cốt lõi của Bucket Pattern: Gom nhiều log vào 1 array
    const result = await UsageReading.findOneAndUpdate(
      { 
        meter_id: meter_id, 
        day: startOfDay // Tim Document của ngày hôm nay
      },
      {
        $setOnInsert: { neighborhood_id: neighborhood_id }, // Chỉ set khi tạo mới
        $push: { 
          readings: { timestamp: readingTime, usage: Number(usage) } 
        },
        $inc: { 
          total_daily_usage: Number(usage), // Cộng dồn luôn tổng ngày, sau này Aggregate khỏi tính lại
          reading_count: 1 // Tăng bộ đếm
        }
      },
      { upsert: true, new: true } // Upsert = true: Không có thì tự tạo document mới
    );

    res.status(200).json({ success: true, message: "Reading recorded successfully", current_count: result.reading_count });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// 3. XEM LỊCH SỬ TIÊU THỤ CỦA 1 KHÁCH HÀNG (Yêu cầu: Consumers want to see hourly usage history)
exports.getUsageHistory = async (req, res) => {
  try {
    const { meter_id } = req.params;
    
    // Lấy lịch sử 7 ngày gần nhất
    const history = await UsageReading.find({ meter_id: meter_id })
      .sort({ day: -1 })
      .limit(7)
      .select('day total_daily_usage reading_count readings');

    res.status(200).json({ success: true, data: history });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
