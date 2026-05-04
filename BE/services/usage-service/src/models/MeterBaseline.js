const mongoose = require("mongoose");

const meterBaselineSchema = new mongoose.Schema({
  meter_id: { type: String, required: true, unique: true },
  mu: { type: Number, required: true },
  sigma: { type: Number, required: true },
  last_updated: { type: Date, default: Date.now }
});

module.exports = mongoose.model("MeterBaseline", meterBaselineSchema);
