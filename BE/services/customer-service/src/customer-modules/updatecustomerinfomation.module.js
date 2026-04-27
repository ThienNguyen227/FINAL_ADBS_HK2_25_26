const express = require("express");
const router = express.Router();
const { connectDB } = require("../config/db");
const jwt = require("jsonwebtoken");
require("dotenv").config();

// ================== VERIFY TOKEN ==================
const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) 
  {
    return res.status(401).json({message: "No token provided",});
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

// ================== UPDATE CUSTOMER INFORMATION ==================
router.put("/", verifyToken, async (req, res) => {
  try {
    console.log("Query:", req.query);
    console.log("Body:", req.body);
    console.log("User từ token:", req.user);
    const pool = await connectDB();

    // 🔥 lấy user_id từ query hoặc token
    const userId = req.query.user_id || req.user.userId;

    const { customer_fullname, customer_address } = req.body;

    // ===== VALIDATE =====
    if (!customer_fullname || customer_fullname.trim() === "") {
      return res.status(400).json({
        message: "Full name is required",
      });
    }

    // ===== UPDATE =====
    await pool.request()
      .input("userId", userId)
      .input("fullname", customer_fullname)
      .input("address", customer_address || "")
      .query(`
        UPDATE Customers
        SET 
          customer_fullname = @fullname,
          customer_address = @address
        WHERE customer_user_id = @userId
      `);

    // ===== GET UPDATED DATA =====
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
    console.log("Raw result:", result);
    console.log("Recordset:", result.recordset);
    console.log("First row:", result.recordset[0]);
    
    const customer = result.recordset[0];

    return res.status(200).json({
      message: "Update successful",
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