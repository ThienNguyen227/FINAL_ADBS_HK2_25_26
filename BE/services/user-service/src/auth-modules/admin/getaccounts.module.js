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
          u.user_id,
          u.user_name,
          u.user_phone,
          u.user_email,
          u.user_status,
          u.user_failed_login_attempts,
          u.user_last_login_at,
          u.user_created_at,
          u.user_role_id,
          r.role_name
        FROM Users u
        JOIN User_Roles r ON u.user_role_id = r.role_id
        WHERE 
          u.user_id LIKE @search OR
          u.user_name LIKE @search OR
          u.user_email LIKE @search OR
          u.user_phone LIKE @search
        ORDER BY u.user_created_at DESC
      `);

    res.status(200).json({
      message: "Lấy danh sách account thành công",
      accounts: result.recordset
    });

  } catch (err) {
    res.status(500).json({
      message: "Internal Server Error",
      error: err.message
    });
  }
});

module.exports = router;