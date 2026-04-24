const express = require("express");
const router = express.Router();
const { connectDB } = require("../config/db");
const bcrypt = require("bcrypt");
const { generateOTP, sendOTPEmail } = require("../utils/send_otp_register");

// ================== REPOSITORY ==================
const checkEmailExistence = async (email) => {
  const pool = await connectDB();
  const result = await pool.request()
    .input("email", email)
    .query("SELECT 1 FROM Users WHERE user_email = @email");

  return result.recordset[0];
};

const insertOTP = async ({ email, otpHash }) => {
  const pool = await connectDB();

  await pool.request()
    .input("email", email)
    .input("otp", otpHash)
    .input("expiredAt", new Date(Date.now() + 2 * 60 * 1000))
    .query(`
      INSERT INTO User_Otps (otp_user_id, otp_user_email, otp_code_hash, otp_expired_at, otp_purpose)
      SELECT user_id, @email , @otp, @expiredAt, 'FORGOT_PASSWORD'
      FROM Users
      WHERE user_email = @email
    `);
};

// ================== SERVICE ==================

const forgotPasswordService = async (data) => {
  const existingEmail = await checkEmailExistence(data.email);
  if (!existingEmail) return { error: "EMAIL_INVALID" };

  const otp = generateOTP();
  const otpHash = await bcrypt.hash(otp, 10);

    await insertOTP({
      email: data.email,
      otpHash
    });
  
    // gửi email thật
    await sendOTPEmail(data.email, otp, "Mã OTP xác nhận quên mật khẩu");

  return { message: "EMAIL_VALID" };
};

// ================== CONTROLLER ==================

router.post("/", async (req, res) => { // 
  try 
  {
    const result = await forgotPasswordService(req.body);

    if (result.error === "EMAIL_INVALID") {
      return res.status(400).json({ message: "Email không tồn tại trong hệ thống!" });
    }

    return res.status(200).json({ message: "Xác nhận OTP được gửi qua email để tiến hành thay đổi mật khẩu!" });

  } catch (err) {
    console.error(err);
    return res.status(500).json({
      message: "Internal Server Error",
      error: err.message,
    });
  }
});

module.exports = router;