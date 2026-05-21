const express = require("express");
const router = express.Router();
const { connectDB } = require("../config/db");

// API lấy thông tin người dùng từ meter_id (Dùng cho Notification Service)
router.get("/:meter_id", async (req, res) => {
  try {
    const { meter_id } = req.params;
    const pool = await connectDB();

    const result = await pool.request()
      .input("meter_id", meter_id)
      .query(`
        SELECT TOP 1 
            u.user_id,
            u.user_name,
            u.user_email,
            c.customer_fullname
        FROM Users u
        JOIN Customers c ON u.user_id = c.customer_user_id
        WHERE c.meter_id = @meter_id
      `);

    const customer = result.recordset[0];

    if (!customer) {
      return res.status(404).json({ success: false, message: "Customer not found" });
    }

    // Kiểm tra nếu là người dùng thật (Có email và không phải placeholder)
    const isRealUser = customer.user_email && 
                       !customer.user_email.includes("example.com") && 
                       !customer.user_email.includes("test.com");

    return res.status(200).json({
      success: true,
      data: {
        userId: customer.user_id,
        name: customer.customer_fullname || customer.user_name,
        email: customer.user_email,
        isRealUser
      }
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
