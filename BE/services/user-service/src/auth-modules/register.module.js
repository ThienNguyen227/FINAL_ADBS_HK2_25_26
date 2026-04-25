const express = require("express");
const router = express.Router();
const { connectDB } = require("../config/db");
const bcrypt = require("bcrypt");
const sql = require("mssql");

const { generateOTP, sendOTPEmail } = require("../utils/send_otp_register");

// ================== REPOSITORY ==================

const registerService = async (data) => {
  const pool = await connectDB();
  const tx = new sql.Transaction(pool);

  try {
    await tx.begin();

    // 1. Check phone
    const phoneCheck = await new sql.Request(tx)
      .input("phone", data.phone)
      .query("SELECT 1 FROM Users WHERE user_phone = @phone");

    if (phoneCheck.recordset[0]) {
      await tx.rollback();
      return { error: "PHONE_EXIST" };
    }

    // 2. Check email
    const emailCheck = await new sql.Request(tx)
      .input("email", data.email)
      .query("SELECT 1 FROM Users WHERE user_email = @email");

    if (emailCheck.recordset[0]) {
      await tx.rollback();
      return { error: "EMAIL_EXIST" };
    }

    // 3. Check OTP ACTIVE
    const activeOtp = await new sql.Request(tx)
      .input("email", data.email)
      .query(`
        SELECT 1
        FROM Registration_Otps
        WHERE otp_user_email = @email
          AND otp_status = 'ACTIVE'
          AND otp_expired_at > GETDATE()
      `);

    if (activeOtp.recordset[0]) {
      await tx.rollback();
      return { error: "OTP_IN_PROGRESS" };
    }

    // 4. Insert OTP
    const otp = generateOTP();
    const otpHash = await bcrypt.hash(otp, 10);

    const resultInsert = await new sql.Request(tx)
      .input("email", data.email)
      .input("otp", otpHash)
      .query(`
        DECLARE @expiredAt DATETIME = DATEADD(MINUTE, 2, GETDATE());

        INSERT INTO Registration_Otps (otp_user_email, otp_code_hash, otp_expired_at)
        VALUES (@email, @otp, @expiredAt);

        SELECT @expiredAt AS expiresAt;
      `);

    const expiresAt = resultInsert.recordset[0].expiresAt;

    await tx.commit();

    await sendOTPEmail(data.email, otp, "Mã OTP xác nhận đăng ký");

    return { 
      message: "OTP_SENT",
      expiresAt
    };

  } catch (err) {
    await tx.rollback();

    if (err.number === 2601 || err.number === 2627) {
      return { error: "OTP_IN_PROGRESS" };
    }

    throw err;
  }
};


// ================== CONTROLLER ==================

router.post("/", async (req, res) => {
  try 
  {
    const result = await registerService(req.body);

    if (result.error === "PHONE_EXIST") {
      return res.status(400).json({ message: "Số điện thoại đã tồn tại!" });
    }

    if (result.error === "EMAIL_EXIST") {
      return res.status(400).json({ message: "Email đã tồn tại!" });
    }

    if (result.error === "OTP_IN_PROGRESS") {
      return res.status(400).json({ message: "Tài khoản đang thực hiện đăng ký ở nơi khác!" });
    }

    return res.status(200).json({
      message: "Xác nhận OTP được gửi qua email để hoàn tất quá trình đăng ký!",
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