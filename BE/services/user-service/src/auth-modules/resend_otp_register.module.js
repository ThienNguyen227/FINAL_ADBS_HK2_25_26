const express = require("express");
const router = express.Router();
const { connectDB } = require("../config/db");
const bcrypt = require("bcrypt");
const sql = require("mssql");

const { generateOTP, sendOTPEmail } = require("../utils/send_otp_register");





// ================== SERVICE ==================
const resendOTPRegisterService = async (data) => {
  const pool = await connectDB();

  // 1. Check user đã tồn tại chưa
  const user = await pool.request()
    .input("email", data.email)
    .query("SELECT 1 FROM Users WHERE user_email = @email");

  if (user.recordset[0]) {
    return { error: "ACCOUNT_ALREADY_CREATED" };
  }

  // 2. Check OTP ACTIVE
  const activeOtp = await pool.request()
    .input("email", data.email)
    .query(`
      SELECT 1
      FROM Registration_Otps
      WHERE otp_user_email = @email
        AND otp_status = 'ACTIVE'
        AND otp_expired_at > GETDATE()
    `);

  if (activeOtp.recordset[0]) {
    return { error: "OTP_IN_PROGRESS" };
  }

  // 3. Expire OTP cũ (nếu có)
  await pool.request()
    .input("email", data.email)
    .query(`
      UPDATE Registration_Otps
      SET otp_status = 'EXPIRED'
      WHERE otp_user_email = @email
        AND otp_status = 'ACTIVE'
    `);

  // 4. Tạo OTP mới
  const otp = generateOTP();
  const otpHash = await bcrypt.hash(otp, 10);

  await pool.request()
    .input("email", data.email)
    .input("otp", otpHash)
    .query(`
      INSERT INTO Registration_Otps (otp_user_email, otp_code_hash, otp_expired_at)
      VALUES (@email, @otp, DATEADD(MINUTE, 2, GETDATE()))
    `);

  await sendOTPEmail(data.email, otp, "Gửi lại OTP xác nhận đăng ký");

  return { message: "OTP_SENT" };
};


// ================== CONTROLLER ==================

router.post("/", async (req, res) => {
  try 
  {
    const result = await resendOTPRegisterService(req.body);

    if (result.error === "ACCOUNT_ALREADY_CREATED") {
      return res.status(400).json({ message: "Tài khoản đã được đăng ký ở nơi khác!" });
    }

    if (result.error === "OTP_IN_PROGRESS") {
      return res.status(400).json({ message: "Tài khoản đăng được đăng ký ở nới khác!" });
    }

    return res.status(200).json({ message: "OTP được gửi lại qua email thành công!" });

  } catch (err) {
    console.error(err);
    return res.status(500).json({
      message: "Internal Server Error",
      error: err.message,
    });
  }
});

module.exports = router;