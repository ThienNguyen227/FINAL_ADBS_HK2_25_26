// const express = require("express");
// const router = express.Router();
// const { connectDB } = require("../config/db");
// const bcrypt = require("bcrypt");

// // ================== REPOSITORY ==================

// const getLatestOTP = async (email) => {
//   const pool = await connectDB();

//   const result = await pool.request()
//     .input("email", email)
//     .query(`
//       SELECT TOP 1 *
//       FROM User_Otps
//       WHERE otp_user_email = @email
//       ORDER BY otp_created_at DESC
//     `);

//   return result.recordset[0];
// };

// const updateOTPStatus = async (otp_id, status) => {
//   const pool = await connectDB();

//   await pool.request()
//     .input("otp_id", otp_id)
//     .input("status", status)
//     .query(`
//       UPDATE User_Otps
//       SET otp_status = @status,
//           otp_used_at = CASE WHEN @status = 'VERIFIED' THEN GETDATE() ELSE otp_used_at END
//       WHERE otp_id = @otp_id
//     `);
// };

// const increaseAttempt = async (otp_id) => {
//   const pool = await connectDB();

//   await pool.request()
//     .input("otp_id", otp_id)
//     .query(`
//       UPDATE User_Otps
//       SET otp_attempt_count = otp_attempt_count + 1
//       WHERE otp_id = @otp_id
//     `);
// };

// // ================== SERVICE ==================

// const verifyOTPService = async ({ email, otp }) => {
//   const record = await getLatestOTP(email);

//   if (!record) return { error: "OTP_NOT_FOUND" };

//   // đã dùng rồi
//   if (record.otp_status !== "ACTIVE") {
//     return { error: "OTP_ALREADY_USED" };
//   }

//   // hết hạn
//   if (new Date() > record.otp_expired_at) {
//     await updateOTPStatus(record.otp_id, "EXPIRED");
//     return { error: "OTP_EXPIRED" };
//   }

//   // vượt quá số lần thử (3 lần)
//   if (record.otp_attempt_count >= 3) {
//     await updateOTPStatus(record.otp_id, "BLOCKED");
//     return { error: "OTP_BLOCKED" };
//   }

//   // sai OTP
//   const isMatch = await bcrypt.compare(otp, record.otp_code_hash);
//   if (!isMatch) {
//     await increaseAttempt(record.otp_id);
//     return { error: "OTP_INVALID" };
//   }

//   await updateOTPStatus(record.otp_id, "VERIFIED");

//   return { message: "OTP_VALID" };
// };

// // ================== CONTROLLER ==================

// router.post("/", async (req, res) => {
//   try {
//     const result = await verifyOTPService(req.body); // => email

//     if (result.error === "OTP_NOT_FOUND") {
//       return res.status(400).json({ message: "Không tìm thấy OTP!" });
//     }

//     if (result.error === "OTP_ALREADY_USED") {
//       return res.status(400).json({ message: "OTP đã được sử dụng!" });
//     }

//     if (result.error === "OTP_EXPIRED") {
//       return res.status(400).json({ message: "OTP đã hết hạn!" });
//     }

//     if (result.error === "OTP_BLOCKED") {
//       return res.status(400).json({ message: "OTP đã bị khóa do nhập sai nhiều lần!" });
//     }

//     if (result.error === "OTP_INVALID") {
//       return res.status(400).json({ message: "OTP không đúng!" });
//     }

//     return res.status(200).json({ message: "Xác nhận OTP thành công!" });

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
const { sql, connectDB } = require("../config/db");
const bcrypt = require("bcrypt");

// ================== SERVICE ==================

const verifyOTPService = async ({ email, newPassword, otp }) => {
  const pool = await connectDB();
  const tx = new sql.Transaction(pool);

  try {
    await tx.begin();

    const userLock = await new sql.Request(tx)
      .input("email", email)
      .query(`
        SELECT user_id
        FROM Users WITH (UPDLOCK, HOLDLOCK)
        WHERE user_email = @email
      `);

    if (!userLock.recordset[0]) {
      await tx.rollback();
      return { error: "USER_NOT_FOUND" };
    }

    // 1. Lấy OTP + lock
    const result = await new sql.Request(tx)
      .input("email", email)
      .query(`
        SELECT TOP 1 *
        FROM User_Otps WITH (UPDLOCK, HOLDLOCK)
        WHERE otp_user_email = @email
        ORDER BY otp_created_at DESC
      `);

    const record = result.recordset[0];

    if (!record) {
      await tx.rollback();
      return { error: "OTP_NOT_FOUND" };
    }

    if (record.otp_status !== "ACTIVE") {
      await tx.rollback();
      return { error: "OTP_ALREADY_USED" };
    }

    if (new Date() > record.otp_expired_at) {
      await new sql.Request(tx)
        .input("id", record.otp_id)
        .query(`
          UPDATE User_Otps
          SET otp_status = 'EXPIRED'
          WHERE otp_id = @id
        `);

      await tx.rollback();
      return { error: "OTP_EXPIRED" };
    }

    if (record.otp_attempt_count >= 3) {
      await new sql.Request(tx)
        .input("id", record.otp_id)
        .query(`
          UPDATE User_Otps
          SET otp_status = 'BLOCKED'
          WHERE otp_id = @id
        `);

      await tx.rollback();
      return { error: "OTP_BLOCKED" };
    }

    // 2. Check OTP
    const isMatch = await bcrypt.compare(otp, record.otp_code_hash);

    if (!isMatch) {
      await new sql.Request(tx)
        .input("id", record.otp_id)
        .query(`
          UPDATE User_Otps
          SET otp_attempt_count = otp_attempt_count + 1
          WHERE otp_id = @id
        `);

      await tx.commit();
      return { error: "OTP_INVALID" };
    }

    // 3. Mark VERIFIED
    await new sql.Request(tx)
      .input("id", record.otp_id)
      .query(`
        UPDATE User_Otps
        SET otp_status = 'VERIFIED',
            otp_used_at = GETDATE()
        WHERE otp_id = @id
      `);

    // 5. Update password user
    const updateResult = await new sql.Request(tx)
      .input("email", email)
      .input("password", newPassword)
      .query(`
        UPDATE Users
        SET user_password_hash = @password
        WHERE user_email = @email
      `);

    if (updateResult.rowsAffected[0] === 0) {
      await tx.rollback();
      return { error: "USER_NOT_FOUND" };
    }

    await tx.commit();

    return { message: "OTP_VALID" };

  } catch (err) {
    try {
      await tx.rollback();
    } catch {}

    throw err;
  }
};

// ================== CONTROLLER ==================

router.post("/", async (req, res) => {
  try {
    const result = await verifyOTPService(req.body);

    if (result.error === "OTP_NOT_FOUND") {
      return res.status(400).json({ message: "Không tìm thấy OTP!" });
    }

    if (result.error === "OTP_ALREADY_USED") {
      return res.status(400).json({ message: "OTP đã được sử dụng!" });
    }

    if (result.error === "OTP_EXPIRED") {
      return res.status(400).json({ message: "OTP đã hết hạn!" });
    }

    if (result.error === "OTP_BLOCKED") {
      return res.status(400).json({
        message: "OTP đã bị khóa do nhập sai nhiều lần!"
      });
    }

    if (result.error === "OTP_INVALID") {
      return res.status(400).json({ message: "OTP không đúng!" });
    }

    if (result.error === "USER_NOT_FOUND") {
      return res.status(400).json({ message: "Không tìm thấy tài khoản!" });
    }

    return res.status(200).json({
      message: "Đổi mật khẩu thành công!"
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