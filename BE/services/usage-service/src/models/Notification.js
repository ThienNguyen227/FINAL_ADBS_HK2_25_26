const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
  meter_id: { type: String, required: true },
  neighborhood_id: { type: String, required: true },
  type: { type: String, enum: ["HARD_RULE", "Z_SCORE_ANOMALY", "MACRO_EVENT"], required: true },
  status: { type: String, enum: ["PENDING", "SUPPRESSED", "DELIVERED", "WATCHLIST", "RESOLVED"], required: true },
  z_score: { type: Number },
  usage: { type: Number },
  message: { type: String },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

notificationSchema.index({ neighborhood_id: 1, created_at: -1, status: 1 });
notificationSchema.index({ meter_id: 1, status: 1 });

const Notification = mongoose.model("Notification", notificationSchema);

module.exports = Notification;
