require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./src/config/db");
const usageRoutes = require("./src/routes/usageRoutes");

const app = express();

app.use(cors());
app.use(express.json());

// Connect DB
connectDB();

// Routes
app.use("/api/usage", usageRoutes);

const PORT = process.env.PORT || 5003;

app.listen(PORT, () => {
  console.log(`Usage Service running on port ${PORT}`);
});