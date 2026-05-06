const express = require("express");
const router = express.Router();
const notificationController = require("../controllers/notificationController");

router.get("/", notificationController.getNotifications);
router.post("/process-event", notificationController.processEvent);
router.post("/mark-read", notificationController.markAsRead);
router.post("/remote-disconnect", notificationController.remoteDisconnect);
router.delete("/clear-all", notificationController.clearAll);
router.delete("/delete-latest", notificationController.deleteLatest);

module.exports = router;
