// const express = require("express");
// const router = express.Router();
// const { connectDB } = require("../config/db");
// const bcrypt = require("bcrypt");
// const { generateOTP, sendOTPEmail } = require("../utils/send_otp_register");

// // ================== REPOSITORY ==================
// const checkEmailExistence = async (email) => {
//   const pool = await connectDB();
//   const result = await pool.request()
//     .input("email", email)
//     .query("SELECT 1 FROM Users WHERE user_email = @email");

//   return result.recordset[0];
// };

// const insertOTP = async ({ email, otpHash }) => {
//   const pool = await connectDB();

//   await pool.request()
//     .input("email", email)
//     .input("otp", otpHash)
//     .query(`
//       DECLARE @expiredAt DATETIME = DATEADD(MINUTE, 2, GETDATE());

//       INSERT INTO User_Otps (otp_user_id, otp_user_email, otp_code_hash, otp_expired_at, otp_purpose)
//       SELECT user_id, @email , @otp, @expiredAt, 'FORGOT_PASSWORD'
//       FROM Users
//       WHERE user_email = @email
//     `);
// };

// // ================== SERVICE ==================

// const forgotPasswordService = async (data) => {
//   const existingEmail = await checkEmailExistence(data.email);
//   if (!existingEmail) return { error: "EMAIL_INVALID" };

//   const otp = generateOTP();
//   const otpHash = await bcrypt.hash(otp, 10);

//     await insertOTP({
//       email: data.email,
//       otpHash
//     });

//     await sendOTPEmail(data.email, otp, "Mã OTP xác nhận quên mật khẩu");

//   const expiresAt = new Date(Date.now() + 2 * 60 * 1000).toISOString();
//   return { message: "EMAIL_VALID", expiresAt };
// };

// // ================== CONTROLLER ==================

// router.post("/", async (req, res) => { // 
//   try 
//   {
//     const result = await forgotPasswordService(req.body);

//     if (result.error === "EMAIL_INVALID") {
//       return res.status(400).json({ message: "Email không tồn tại trong hệ thống!" });
//     }

//     return res.status(200).json({ 
//       message: "Xác nhận OTP được gửi qua email để tiến hành thay đổi mật khẩu!",
//       expiresAt: result.expiresAt
//     });

//   } catch (err) {
//     console.error(err);
//     return res.status(500).json({
//       message: "Internal Server Error",
//       error: err.message,
//     });
//   }
// });

// module.exports = router;

const express = require("express");
const router = express.Router();
const { connectDB } = require("../config/db");
const bcrypt = require("bcrypt");
const sql = require("mssql");

const { generateOTP, sendOTPEmail } = require("../utils/send_otp_register");

// ================== SERVICE ==================

const forgotPasswordService = async (data) => {
  const pool = await connectDB();
  const tx = new sql.Transaction(pool);

  try {
    await tx.begin();

    // 1. Check email tồn tại
    const emailCheck = await new sql.Request(tx)
      .input("email", data.email)
      .query(`
        SELECT user_id
        FROM Users WITH (UPDLOCK, HOLDLOCK)
        WHERE user_email = @email
      `);

    if (!emailCheck.recordset[0]) {
      await tx.rollback();
      return { error: "EMAIL_INVALID" };
    }

    // 2. Check OTP ACTIVE
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

    // 3. Generate OTP
    const otp = generateOTP();
    const otpHash = await bcrypt.hash(otp, 10);

    // 4. UPDATE → INSERT
    await new sql.Request(tx)
      .input("email", data.email)
      .input("otp", otpHash)
      .query(`
        DECLARE @expiredAt DATETIME = DATEADD(MINUTE, 2, GETDATE());

        -- UPDATE nếu có OTP cũ đã hết hạn
        UPDATE User_Otps
        SET otp_code_hash = @otp,
            otp_created_at = GETDATE(),
            otp_expired_at = @expiredAt,
            otp_status = 'ACTIVE'
        WHERE otp_user_email = @email
          AND otp_purpose = 'FORGOT_PASSWORD'
          AND otp_status = 'ACTIVE'
          AND otp_expired_at < GETDATE();

        -- nếu không update được thì INSERT
        IF @@ROWCOUNT = 0
        BEGIN
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
        END
      `);

    const expiresAt = new Date(Date.now() + 2 * 60 * 1000).toISOString();

    await tx.commit();

    await sendOTPEmail(data.email, otp, "Mã OTP xác nhận quên mật khẩu");

    return {
      message: "OTP_SENT",
      expiresAt
    };

  } catch (err) {
    await tx.rollback();

    // duplicate key (race condition fallback)
    if (err.number === 2601 || err.number === 2627) {
      return { error: "OTP_IN_PROGRESS" };
    }

    throw err;
  }
};

// ================== CONTROLLER ==================

router.post("/", async (req, res) => {
  try {
    const result = await forgotPasswordService(req.body);

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

    return res.status(200).json({
      message: "OTP đã được gửi để xác nhận đổi mật khẩu!",
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