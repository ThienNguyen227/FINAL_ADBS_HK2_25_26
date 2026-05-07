const express = require("express");
const router = express.Router();
const { connectDB } = require("../../config/db");

router.get("/", async (req, res) => {
  try {
    const { search = "" } = req.query;

    const pool = await connectDB();

    const result = await pool.request()
      .input("search", `%${search}%`)
      .query(`
        SELECT 
          customer_id,
          customer_user_id,
          customer_fullname,
          customer_address,
          customer_priority,
          customer_created_at,
          customer_updated_at
        FROM Customers
        WHERE 
          customer_id LIKE @search OR
          customer_fullname LIKE @search OR
          customer_address LIKE @search OR
          customer_priority LIKE @search
        ORDER BY customer_created_at DESC
      `);

    return res.status(200).json({
      message: "Lấy danh sách khách hàng thành công",
      customers: result.recordset
    });

  } catch (err) {
    return res.status(500).json({
      message: "Internal Server Error",
      error: err.message
    });
  }
});

module.exports = router;