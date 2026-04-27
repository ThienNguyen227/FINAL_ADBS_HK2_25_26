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
        SELECT 
          customer_id,
          customer_user_id,
          customer_fullname,
          customer_address,
          customer_priority
        FROM Customers
        WHERE customer_user_id = @userId
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