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

  // GeoJSON - Tọa độ địa lý của Smart Meter (Geospatial Indexing)
  location: {
    type: {
      type: String,
      enum: ["Point"],
      default: "Point",
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      default: [0, 0],
    },
  },
});

// Tối ưu hoá truy vấn
usageReadingSchema.index({ day: -1, neighborhood_id: 1 });
usageReadingSchema.index({ meter_id: 1, day: -1 });

// 2dsphere index cho truy vấn không gian (Geospatial Queries)
usageReadingSchema.index({ location: "2dsphere" });

const UsageReading = mongoose.model("UsageReading", usageReadingSchema);

module.exports = UsageReading;
