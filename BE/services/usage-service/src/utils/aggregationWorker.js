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

// Thiết lập Cron Job: Chạy vào lúc 00:05 mỗi đêm
function startCronJobs() {
  // Chạy 1 lần ngay khi khởi động server để đảm bảo dữ liệu luôn mới nhất
  aggregateMonthlyUsage();

  // Schedule chạy định kỳ
  cron.schedule("5 0 * * *", () => {
    aggregateMonthlyUsage();
  });
  
  console.log("[Cron] Hệ thống Background Jobs đã được kích hoạt (00:05 hàng đêm).");
}

module.exports = { startCronJobs, aggregateMonthlyUsage };
