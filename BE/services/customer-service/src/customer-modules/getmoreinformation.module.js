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
    req.user = decoded; // { userId: ... }
    next();
  } catch (err) {
    return res.status(401).json({
      message: "Invalid or expired token",
    });
  }
};

// ================== GET MORE INFORMATION ==================
router.get("/", verifyToken, async (req, res) => {
  try {
    const pool = await connectDB();

    const userId = req.query.user_id || req.user.userId;

    const result = await pool.request()
      .input("userId", userId)
      .query(`
        SELECT TOP 1
          c.customer_id,
          c.customer_user_id,
          c.customer_fullname,
          c.customer_address,
          c.customer_priority,
          con.contract_rate,
          con.contract_type_id
        FROM Customers c
        LEFT JOIN Contracts con ON c.customer_id = con.contract_customer_id
        WHERE c.customer_user_id = @userId
        ORDER BY con.contract_created_at DESC
      `);

    const customer = result.recordset[0];

    if (!customer) {
      return res.status(404).json({
        message: "Customer not found",
      });
    }

    return res.status(200).json({
      customer,
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({
      message: "Internal Server Error",
      error: err.message,
    });
  }
});

module.exports = router;