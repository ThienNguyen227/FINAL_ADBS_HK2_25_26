const express = require("express");
const router = express.Router();
const usageController = require("../controllers/usageController");

router.get("/anomalies", usageController.getAnomalies);
router.post("/record", usageController.recordUsage);
router.get("/history/:meter_id", usageController.getUsageHistory);

module.exports = router;
