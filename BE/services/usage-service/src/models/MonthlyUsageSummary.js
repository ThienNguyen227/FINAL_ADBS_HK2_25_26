const mongoose = require("mongoose");

const monthlyUsageSummarySchema = new mongoose.Schema({
  meter_id: { type: String, required: true },
  month: { type: String, required: true }, // Định dạng "YYYY-MM"
  neighborhood_id: { type: String, required: true },
  total_monthly_usage: { type: Number, default: 0 },
  last_updated: { type: Date, default: Date.now }
});

// Đánh index để truy vấn hóa đơn siêu tốc
monthlyUsageSummarySchema.index({ meter_id: 1, month: 1 }, { unique: true });

const MonthlyUsageSummary = mongoose.model("MonthlyUsageSummary", monthlyUsageSummarySchema);

module.exports = MonthlyUsageSummary;
