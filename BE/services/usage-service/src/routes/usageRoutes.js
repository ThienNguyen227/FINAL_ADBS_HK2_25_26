const express = require("express");
const router = express.Router();
const usageController = require("../controllers/usageController");

router.get("/anomalies", usageController.getAnomalies);
router.post("/record", usageController.recordUsage);
router.delete("/clear-data", usageController.clearAllData);
router.delete("/delete-latest", usageController.deleteLatestReading);
router.get("/history/:meter_id", usageController.getUsageHistory);
router.get("/geo-search", usageController.geoSearch);
router.get("/substations", usageController.getSubstations);
router.get("/monthly-summary", usageController.getMonthlySummary);
router.get("/trigger-aggregation", usageController.triggerAggregation);
router.get("/all-status", usageController.getAllMetersStatus);
router.get("/system-stats", usageController.getSystemStats);
router.get("/system-history", usageController.getSystemHistory);

module.exports = router;

