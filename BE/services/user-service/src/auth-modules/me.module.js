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
      message: "No token provided"
    });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    req.user = decoded; // { userId: ... }
    next();
  } catch (err) {
    return res.status(401).json({
      message: "Invalid or expired token"
    });
  }
};

// ================== GET ME ==================

router.get("/", verifyToken, async (req, res) => {
  try {
    const pool = await connectDB();

    const result = await pool.request()
      .input("userId", req.user.userId)
      .query(`
        SELECT 
          user_id,
          user_name,
          user_phone,
          user_role_id
        FROM Users
        WHERE user_id = @userId
      `);

    const user = result.recordset[0];

    console.log("USER FROM DB:", user);

    if (!user) {
      return res.status(404).json({
        message: "User not found"
      });
    }

    return res.status(200).json({
      user
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({
      message: "Internal Server Error",
      error: err.message
    });
  }
});

module.exports = router;