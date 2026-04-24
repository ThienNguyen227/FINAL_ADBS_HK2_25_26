const express = require("express");
const router = express.Router();
const { connectDB } = require("../config/db");
const bcrypt = require("bcrypt");

// ================== REPOSITORY ==================

const checkPasswordExistence = async (email) => {
  const pool = await connectDB();
  const result = await pool.request()
    .input("email", email)
    .query("SELECT user_password_hash FROM Users WHERE user_email = @email");

  return result.recordset[0];
};

const resetPassword = async ({ email, password }) => {
  const pool = await connectDB();

  await pool.request()
    .input("email", email)
    .input("password", password)
    .query(`
      UPDATE Users
      SET user_password_hash = @password
      WHERE user_email = @email
    `);
};

// ================== SERVICE ==================

const resetPasswordService = async (data) => {
    
  const existingPassword = await checkPasswordExistence(data.email);

  if (!existingPassword) {return { error: "PASSWORD_NOT_FOUND" };}

  if (existingPassword.user_password_hash === data.password) return { error: "PASSWORD_EXIST" };


  await resetPassword({
    email: data.email,
    password: data.password,
  });

  return { message: "SUCCESSFUL" };
};

// ================== CONTROLLER ==================

router.post("/", async (req, res) => { 
  try 
  {
    const result = await resetPasswordService(req.body);

    if (result.error === "PASSWORD_NOT_FOUND") {
      return res.status(400).json({ message: "Không tìm thấy mật khẩu!" });
    }

    if (result.error === "PASSWORD_EXIST") {
      return res.status(400).json({ message: "Đây là mật khẩu cũ! Vui lòng đổi mật khác!" });
    }

    return res.status(200).json({ message: "Đổi mật khẩu thành công!" });

  } catch (err) {
    console.error(err);
    return res.status(500).json({
      message: "Internal Server Error",
      error: err.message,
    });
  }
});

module.exports = router;























