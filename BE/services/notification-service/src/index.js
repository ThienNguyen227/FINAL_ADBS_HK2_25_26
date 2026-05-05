require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const notificationRoutes = require("./routes/notificationRoutes");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/notifications", notificationRoutes);

const PORT = process.env.PORT || 3005;
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/adbs_evn";

mongoose.connect(MONGO_URI)
  .then(() => {
    console.log("✅ Notification Service connected to MongoDB");
    app.listen(PORT, () => console.log(`🚀 Notification Service running on port ${PORT}`));
  })
  .catch(err => console.error("MongoDB connection error:", err));
