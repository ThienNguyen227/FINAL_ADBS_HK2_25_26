const express = require("express");
const cors = require("cors");
const customerRoutes = require("./customer.routes");

const app = express();

app.use(cors({
  origin: "http://localhost:5173", 
  credentials: true
}));

app.use(express.json());

app.use("/customers", customerRoutes);

module.exports = app;