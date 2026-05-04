const cron = require("node-cron");
const UsageReading = require("../models/UsageReading");
const MonthlyUsageSummary = require("../models/MonthlyUsageSummary");

/**
 * Hàm thực hiện Aggregation Pipeline để tổng hợp dữ liệu tháng.
 * Sử dụng toán tử $merge để cập nhật Materialized View một cách hiệu quả.
 */
async function aggregateMonthlyUsage() {
  try {
    console.log("[Cron] Bắt đầu tổng hợp dữ liệu tiêu thụ tháng...");

    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    // Aggregation Pipeline
    const pipeline = [
      {
        // 1. Gom nhóm theo meter_id và tháng (Bỏ lọc $match tháng hiện tại để tính tất cả lịch sử)
        $group: {
          _id: {
            meter_id: "$meter_id",
            month: { $dateToString: { format: "%Y-%m", date: "$day" } }
          },
          neighborhood_id: { $first: "$neighborhood_id" },
          total_monthly_usage: { $sum: "$total_daily_usage" }
        }
      },
      {
        // 3. Chuẩn hóa format để khớp với MonthlyUsageSummary schema
        $project: {
          _id: 0,
          meter_id: "$_id.meter_id",
          month: "$_id.month",
          neighborhood_id: 1,
          total_monthly_usage: { $round: ["$total_monthly_usage", 2] },
          last_updated: "$$NOW"
        }
      },
      {
        // 4. Kỹ thuật Materialized View: MERGE vào collection đích
        // Nếu trùng meter_id + month thì UPDATE, nếu chưa có thì INSERT
        $merge: {
          into: "monthlyusagesummaries",
          on: ["meter_id", "month"],
          whenMatched: "replace",
          whenNotMatched: "insert"
        }
      }
    ];

    await UsageReading.aggregate(pipeline);
    console.log(`[Cron] Đã cập nhật Materialized View cho tháng ${currentMonth} thành công.`);

  } catch (err) {
    console.error("[Cron] Lỗi khi tổng hợp dữ liệu tháng:", err.message);
  }
}

// ==========================================
// LỚP 2: Luồng Batch Job & Macro Anomaly (Luồng Ban Đêm)
// ==========================================
async function calculateMeterBaselines() {
  try {
    console.log("[Cron] Bắt đầu tính toán Baseline (mu, sigma) cho các đồng hồ...");
    
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const pipeline = [
      {
        $match: { day: { $gte: thirtyDaysAgo } }
      },
      {
        // Tách các giá trị tiêu thụ chi tiết để tính độ lệch chuẩn chính xác
        $unwind: "$readings"
      },
      {
        $group: {
          _id: "$meter_id",
          mu: { $avg: "$readings.usage" },
          sigma: { $stdDevPop: "$readings.usage" }
        }
      },
      {
        $project: {
          _id: 0,
          meter_id: "$_id",
          mu: { $round: ["$mu", 4] },
          // Đảm bảo sigma không bằng 0 để tránh lỗi chia cho 0 khi tính Z-Score
          sigma: { $cond: [{ $eq: ["$sigma", 0] }, 0.01, { $round: ["$sigma", 4] }] },
          last_updated: "$$NOW"
        }
      },
      {
        // Kỹ thuật Materialized View: Lưu đè vào bảng meterbaselines
        $merge: {
          into: "meterbaselines",
          on: "meter_id",
          whenMatched: "replace",
          whenNotMatched: "insert"
        }
      }
    ];

    await UsageReading.aggregate(pipeline);

    // Nạp dữ liệu từ MongoDB vào In-Memory Cache (thay thế cho việc đẩy vào Redis)
    const MeterBaseline = require("../models/MeterBaseline");
    const { baselineCache } = require("./memoryCache");
    
    const baselines = await MeterBaseline.find({});
    baselineCache.clear();
    baselines.forEach(b => {
      baselineCache.set(b.meter_id, { mu: b.mu, sigma: b.sigma });
    });

    console.log(`[Cron] Đã tính toán xong và Cache thành công Baseline cho ${baselines.length} đồng hồ.`);
  } catch (err) {
    console.error("[Cron] Lỗi khi tính toán Baseline:", err.message);
  }
}

// Thiết lập Cron Job: Chạy vào lúc 00:05 mỗi đêm
function startCronJobs() {
  // Chạy 1 lần ngay khi khởi động server để đảm bảo dữ liệu luôn mới nhất
  aggregateMonthlyUsage();
  calculateMeterBaselines();

  // Schedule chạy định kỳ (Monthly Summary) lúc 00:05
  cron.schedule("5 0 * * *", () => {
    aggregateMonthlyUsage();
  });

  // Schedule chạy tính toán Baseline lúc 02:00 sáng (Theo đúng yêu cầu Layer 2)
  cron.schedule("0 2 * * *", () => {
    calculateMeterBaselines();
  });
  
  console.log("[Cron] Hệ thống Background Jobs đã được kích hoạt.");
}


module.exports = { startCronJobs, aggregateMonthlyUsage, calculateMeterBaselines };
