const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const { connectDB } = require("../../config/db");

router.post("/", async (req, res) => {
  try {
    const {
      user_name,
      user_phone,
      user_email,
      password,
      user_role_id
    } = req.body;

    const hash = await bcrypt.hash(password, 10);

    const pool = await connectDB();

    await pool.request()
      .input("name", user_name)
      .input("phone", user_phone)
      .input("email", user_email)
      .input("password", hash)
      .input("role", user_role_id)
      .query(`
        INSERT INTO Users
        (
          user_name,
          user_phone,
          user_email,
          user_password_hash,
          user_role_id
        )
        VALUES
        (
          @name,
          @phone,
          @email,
          @password,
          @role
        )
      `);

    res.status(201).json({
      message: "Tạo tài khoản thành công"
    });

  } catch (err) {
    res.status(500).json({
      message: err.message
    });
  }
});

module.exports = router;