const express = require("express");
const router = express.Router();
const { connectDB } = require("../config/db");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({
      message: "No token provided"
    });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({
      message: "Invalid or expired token"
    });
  }
};

router.get("/", verifyToken, async (req, res) => {
  const { customer_id } = req.query;

  if (!customer_id) {
    return res.status(400).json({
      message: "Missing customer_id"
    });
  }

  try {
    const pool = await connectDB();

    const result = await pool.request()
      .input("customerId", customer_id)
      .query(`
        SELECT
          i.invoice_id,
          i.invoice_month,
          i.invoice_total_usage,
          i.invoice_rate,
          i.invoice_total_amount,
          i.invoice_status,
          i.invoice_contract_id
        FROM Invoices i
        WHERE i.invoice_customer_id = @customerId
        ORDER BY i.invoice_month DESC
      `);

    return res.status(200).json({
      message: "Lấy danh sách hóa đơn thành công",
      invoices: result.recordset
    });

  } catch (err) {
    console.error("GET INVOICES ERROR:", err);

    return res.status(500).json({
      message: "Internal Server Error",
      error: err.message
    });
  }
});

module.exports = router;