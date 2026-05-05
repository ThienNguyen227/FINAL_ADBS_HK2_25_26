const express = require("express");
const router = express.Router();
const notificationController = require("../controllers/notificationController");

router.post("/process-event", notificationController.processEvent);
router.post("/clear-watchlist", notificationController.clearWatchlist);
router.get("/", notificationController.getNotifications);
router.post("/mark-read", notificationController.markAsRead);
router.post("/remote-disconnect", notificationController.remoteDisconnect);

module.exports = router;
