const express = require("express");
const router = express.Router();
const { sql, connectDB } = require("../config/db");
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

// ================== UPDATE CUSTOMER ==================
router.put("/", verifyToken, async (req, res) => {
  const pool = await connectDB();
  const transaction = new sql.Transaction(pool);

  try {
    const userId = req.query.user_id || req.user.userId;
    const { customer_fullname, customer_address } = req.body;

    // ===== VALIDATE =====
    if (!customer_fullname || customer_fullname.trim() === "") {
      return res.status(400).json({
        message: "Full name is required",
      });
    }

    // ===== START TRANSACTION =====
    await transaction.begin(sql.ISOLATION_LEVEL.REPEATABLE_READ);

    // ===== LOCK ROW (FAIL FAST IF BEING EDITED) =====
    const customerCheck = await new sql.Request(transaction)
      .input("userId", sql.Int, userId)
      .query(`
        SELECT customer_id
        FROM Customers WITH (UPDLOCK, HOLDLOCK, NOWAIT)
        WHERE customer_user_id = @userId
      `);

    if (!customerCheck.recordset[0]) {
      await transaction.rollback();
      return res.status(404).json({
        message: "Customer not found",
      });
    }

    await new Promise(resolve => setTimeout(resolve, 5000));

    // ===== UPDATE CUSTOMER =====
    await new sql.Request(transaction)
      .input("userId", sql.Int, userId)
      .input("fullname", sql.NVarChar, customer_fullname.trim())
      .input("address", sql.NVarChar, customer_address || "")
      .query(`
        UPDATE Customers
        SET
          customer_fullname = @fullname,
          customer_address = @address
        WHERE customer_user_id = @userId
      `);

    // ===== GET UPDATED DATA =====
    const result = await new sql.Request(transaction)
      .input("userId", sql.Int, userId)
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

    await transaction.commit();

    return res.status(200).json({
      message: "Cập nhật thông tin thành công!",
      customer: result.recordset[0],
    });

  } catch (err) {
    if (transaction && !transaction._aborted) {
      await transaction.rollback();
    }

    console.error("Update Customer Error:", err);

    // ===== LOCK CONFLICT =====
    if (err.number === 1222) {
      return res.status(409).json({
        message:
          "Thông tin khách hàng đang được chỉnh sửa ở nơi khác. Vui lòng thử lại sau.",
      });
    }

    return res.status(500).json({
      message: "Internal Server Error",
      error: err.message,
    });
  }
});

module.exports = router;

