const mongoose = require("mongoose");

const usageReadingSchema = new mongoose.Schema({
  meter_id: { type: String, required: true, index: true },
  neighborhood_id: { type: String, required: true },
  day: { type: Date, required: true },
  readings: [
    {
      timestamp: { type: Date },
      usage: { type: Number }, // Tiêu thụ tính bằng kWh
    },
  ],
  total_daily_usage: { type: Number, default: 0 },
  reading_count: { type: Number, default: 0 },
});

// Tối ưu hoá truy vấn
usageReadingSchema.index({ day: -1, neighborhood_id: 1 });
usageReadingSchema.index({ meter_id: 1, day: -1 });

const UsageReading = mongoose.model("UsageReading", usageReadingSchema);

module.exports = UsageReading;
