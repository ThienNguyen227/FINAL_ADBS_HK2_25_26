const express = require("express");
const router = express.Router();
const { connectDB } = require("../config/db");
const bcrypt = require("bcrypt");
const sql = require("mssql");

const { generateOTP, sendOTPEmail } = require("../utils/send_otp_register");

// ================== SERVICE ==================
const resendOTPRegisterService = async (data) => {
  const pool = await connectDB();
  const tx = new sql.Transaction(pool);

  try {
    await tx.begin();

    // 1. Check user đã tồn tại chưa
    const user = await new sql.Request(tx)
      .input("email", data.email)
      .query(`
        SELECT 1 
        FROM Users 
        WHERE user_email = @email
      `);

    if (user.recordset[0]) {
      await tx.rollback();
      return { error: "ACCOUNT_ALREADY_CREATED" };
    }

    const activeOtp = await new sql.Request(tx)
      .input("email", data.email)
      .query(`
        SELECT 1
        FROM Registration_Otps WITH (UPDLOCK, HOLDLOCK)
        WHERE otp_user_email = @email
          AND otp_status = 'ACTIVE'
          AND otp_expired_at > GETDATE()
      `);

    if (activeOtp.recordset[0]) {
      await tx.rollback(); 
      return { error: "OTP_IN_PROGRESS" };
    }

    // 2. Expire OTP cũ
    await new sql.Request(tx)
      .input("email", data.email)
      .query(`
        UPDATE Registration_Otps
        SET otp_status = 'EXPIRED'
        WHERE otp_user_email = @email
          AND otp_status = 'ACTIVE'
          AND otp_expired_at < GETDATE()
      `);

    // 3. Tạo OTP mới 
    const otp = generateOTP();
    const otpHash = await bcrypt.hash(otp, 10);

    await new sql.Request(tx)
      .input("email", data.email)
      .input("otp", otpHash)
      .query(`
        DECLARE @expiredAt DATETIME = DATEADD(MINUTE, 2, GETDATE());

        INSERT INTO Registration_Otps (
          otp_user_email,
          otp_code_hash,
          otp_expired_at
        )
        VALUES (@email, @otp, @expiredAt);
      `);

    const expiresAt = new Date(Date.now() + 2 * 60 * 1000).toISOString();

    await tx.commit();

    await sendOTPEmail(data.email, otp, "Gửi lại OTP xác nhận đăng ký");

    return {
      message: "OTP_SENT",
      expiresAt
    };

  } catch (err) {
    await tx.rollback();

    // UNIQUE INDEX
    if (err.number === 2601 || err.number === 2627) {
      return { error: "OTP_IN_PROGRESS" };
    }

    throw err;
  }
};
// ================== CONTROLLER ==================

router.post("/", async (req, res) => {
  try {
    const result = await resendOTPRegisterService(req.body);

    if (result.error === "ACCOUNT_ALREADY_CREATED") {
      return res.status(400).json({ message: "Tài khoản đã được đăng ký ở nơi khác!" });
    }

    if (result.error === "OTP_IN_PROGRESS") {
      return res.status(400).json({ message: "Tài khoản đang được đăng ký ở nơi khác!" });
    }

    return res.status(200).json({
      message: "OTP đã được gửi lại qua email thành công!",
      expiresAt: result.expiresAt
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