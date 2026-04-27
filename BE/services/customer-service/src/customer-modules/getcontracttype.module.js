const express = require("express");
const router = express.Router();
const { connectDB } = require("../config/db");
const jwt = require("jsonwebtoken");
require("dotenv").config();

// ================== VERIFY TOKEN ==================

const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({
      message: "No token provided",
    });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({
      message: "Invalid or expired token",
    });
  }
};

// ================== GET CONTRACT TYPES ==================

router.get("/", verifyToken, async (req, res) => {
  try {
    const pool = await connectDB();

    const result = await pool.request().query(`
      SELECT 
        contract_type_id,
        contract_type_name,
        contract_type_rate
      FROM ContractTypes
      ORDER BY contract_type_id ASC
    `);

    const contractTypes = result.recordset;

    return res.status(200).json({
      message: "Get contract types successfully",
      contracttype: contractTypes,
    });
  } catch (err) {
    console.error("GET CONTRACT TYPE ERROR:", err);

    return res.status(500).json({
      message: "Internal Server Error",
      error: err.message,
    });
  }
});

module.exports = router;