const express = require("express");
const router = express.Router();
const { connectDB } = require("../config/db");
const bcrypt = require("bcrypt");
const sql = require("mssql");

const { generateOTP, sendOTPEmail } = require("../utils/send_otp_register");

// ================== SERVICE ==================

const resendOTPForgotPasswordService = async (data) => {
  const pool = await connectDB();
  const tx = new sql.Transaction(pool);

  try {
    await tx.begin();

    // 1. Check email tồn tại
    const user = await new sql.Request(tx)
      .input("email", data.email)
      .query(`
        SELECT user_id 
        FROM Users WITH (UPDLOCK, HOLDLOCK)
        WHERE user_email = @email
      `);

    if (!user.recordset[0]) {
      await tx.rollback();
      return { error: "EMAIL_INVALID" };
    }

    const latestOtp = await new sql.Request(tx)
      .input("email", data.email)
      .query(`
        SELECT TOP 1 otp_status
        FROM User_Otps WITH (UPDLOCK, HOLDLOCK)
        WHERE otp_user_email = @email
          AND otp_purpose = 'FORGOT_PASSWORD'
        ORDER BY otp_created_at DESC
      `);

    if (latestOtp.recordset[0]?.otp_status === 'VERIFIED') {
      await tx.rollback();
      return { error: "PASSWORD_ALREADY_CHANGED" };
    }

    // 2. Check OTP đang ACTIVE
    const activeOtp = await new sql.Request(tx)
      .input("email", data.email)
      .query(`
        SELECT 1
        FROM User_Otps WITH (UPDLOCK, HOLDLOCK)
        WHERE otp_user_email = @email
          AND otp_status = 'ACTIVE'
          AND otp_expired_at > GETDATE()
          AND otp_purpose = 'FORGOT_PASSWORD'
      `);

    if (activeOtp.recordset[0]) {
      await tx.rollback();
      return { error: "OTP_IN_PROGRESS" };
    }

    // 3. Expire OTP cũ
    await new sql.Request(tx)
      .input("email", data.email)
      .query(`
        UPDATE User_Otps
        SET otp_status = 'EXPIRED'
        WHERE otp_user_email = @email
          AND otp_status = 'ACTIVE'
          AND otp_expired_at < GETDATE()
          AND otp_purpose = 'FORGOT_PASSWORD'
      `);

    // 4. Tạo OTP mới
    const otp = generateOTP();
    const otpHash = await bcrypt.hash(otp, 10);

    await new sql.Request(tx)
      .input("email", data.email)
      .input("otp", otpHash)
      .query(`
        DECLARE @expiredAt DATETIME = DATEADD(MINUTE, 2, GETDATE());

        INSERT INTO User_Otps (
          otp_user_id,
          otp_user_email,
          otp_code_hash,
          otp_expired_at,
          otp_purpose
        )
        SELECT user_id, @email, @otp, @expiredAt, 'FORGOT_PASSWORD'
        FROM Users
        WHERE user_email = @email;
      `);

    const expiresAt = new Date(Date.now() + 2 * 60 * 1000).toISOString();

    await tx.commit();

    await sendOTPEmail(data.email, otp, "Gửi lại OTP quên mật khẩu");

    return {
      message: "OTP_SENT",
      expiresAt
    };

  } catch (err) {
    await tx.rollback();

    // UNIQUE constraint (race condition fallback)
    if (err.number === 2601 || err.number === 2627) {
      return { error: "OTP_IN_PROGRESS" };
    }

    throw err;
  }
};

// ================== CONTROLLER ==================

router.post("/", async (req, res) => {
  try {
    const result = await resendOTPForgotPasswordService(req.body);

    if (result.error === "EMAIL_INVALID") {
      return res.status(400).json({
        message: "Email không tồn tại trong hệ thống!"
      });
    }

    if (result.error === "OTP_IN_PROGRESS") {
      return res.status(400).json({
        message: "Yêu cầu OTP đang được xử lý ở nơi khác!"
      });
    }

    if (result.error === "PASSWORD_ALREADY_CHANGED") {
      return res.status(400).json({
        message: "Mật khẩu đã được đổi ở phiên khác. Vui lòng thực hiện quên mật khẩu lại!"
      });
    }

    return res.status(200).json({
      message: "OTP đã được gửi lại để tiếp tục đổi mật khẩu!",
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