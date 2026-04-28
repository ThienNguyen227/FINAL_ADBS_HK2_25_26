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

// ================== GET CONTRACTS ==================
router.get("/", verifyToken, async (req, res) => {
  const { customer_id } = req.query;

  if (!customer_id) {
    return res.status(400).json({
      message: "Missing customer_id",
    });
  }

  try {
    const pool = await connectDB();

    const result = await pool.request()
      .input("customerId", customer_id)
      .query(`
        SELECT 
          c.contract_id,
          ct.contract_type_name,
          c.contract_customer_fullname,
          c.contract_customer_address,
          c.contract_customer_phone,
          c.contract_customer_email,
          c.contract_rate,
          c.contract_start_date,
          c.contract_end_date,
          c.contract_status
        FROM Contracts c
        JOIN ContractTypes ct 
          ON c.contract_type_id = ct.contract_type_id
        WHERE c.contract_customer_id = @customerId
        ORDER BY c.contract_created_at DESC
      `);

    return res.status(200).json({
      message: "Lấy danh sách hợp đồng thành công",
      contracts: result.recordset,
    });

  } catch (err) {
    console.error("GET CONTRACT ERROR:", err);

    return res.status(500).json({
      message: "Internal Server Error",
      error: err.message,
    });
  }
});

module.exports = router;