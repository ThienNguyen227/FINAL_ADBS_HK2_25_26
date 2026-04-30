const express = require("express");
const router = express.Router();
const { sql, connectDB } = require("../config/db");
const bcrypt = require("bcrypt");
const axios = require("axios");

// ================== REPOSITORY ==================

const getLatestOTP = async (email) => {
  const pool = await connectDB();
  const result = await pool.request()
    .input("email", email)
    .query(`
      SELECT TOP 1 *
      FROM Registration_Otps
      WHERE otp_user_email = @email
      ORDER BY otp_created_at DESC
    `);
  return result.recordset[0];
};

const updateOTPStatus = async (otp_id, status) => {
  const pool = await connectDB();

  await pool.request()
    .input("otp_id", otp_id)
    .input("status", status)
    .query(`
      UPDATE Registration_Otps
      SET otp_status = @status,
          otp_used_at = CASE WHEN @status = 'VERIFIED' THEN GETDATE() ELSE otp_used_at END
      WHERE otp_id = @otp_id
    `);
};

const increaseAttempt = async (otp_id) => {
  const pool = await connectDB();

  await pool.request()
    .input("otp_id", otp_id)
    .query(`
      UPDATE Registration_Otps
      SET otp_attempt_count = otp_attempt_count + 1
      WHERE otp_id = @otp_id
    `);
};

const createUser = async (name, phone, email, password) => {
  const pool = await connectDB();

  await pool.request()
    .input("name", name)
    .input("phone", phone)
    .input("email", email)
    .input("password", password)
    .query(`
      INSERT INTO Users (user_name, user_phone, user_email, user_password_hash, user_role_id)
      VALUES (@name, @phone, @email, @password, 4)
    `);
};

const deleteUser = async (email) => {
  const pool = await connectDB();

  const result = await pool.request()
    .input("email", email)
    .query(`
      DELETE FROM Users
      WHERE user_email = @email
    `);

  return result.rowsAffected[0];
};

const getUserIdByEmail = async (email) => {
  const pool = await connectDB();

  const result = await pool.request()
    .input("email", email)
    .query(`
      SELECT user_id
      FROM Users
      WHERE user_email = @email
    `);
  return result.recordset[0];
};

const createCustomer = async (userId) => {
  const res = await axios.post(
    "http://localhost:3001/customer/create-customer",
    {
      customer_user_id: userId
    }
  );

  return res.data;
};


// ================== SERVICE ==================

// const verifyOTPService = async ({ name, phone, email, password, otp }) => {
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

//   try {
//     await updateOTPStatus(record.otp_id, "VERIFIED");

//     await createUser(name, phone, email, password);
//     const userId = await getUserIdByEmail(email)

//     await createCustomer(userId);
//   } catch (err) {
//     const deleted = await deleteUser(email);

//     if (deleted > 0) {
//       console.log("ROLLBACK SUCCESS: user deleted");
//     } else {
//       console.log("ROLLBACK FAIL: user not found");
//     }

//     throw err;
//   }

//   return { message: "OTP_VALID" };
// };

const verifyOTPService = async ({ name, phone, email, password, otp }) => {
  const pool = await connectDB();
  const tx = new sql.Transaction(pool);

  try {
    await tx.begin();

    // 🔥 1. Lấy OTP + lock
    const result = await new sql.Request(tx)
      .input("email", email)
      .query(`
        SELECT TOP 1 *
        FROM Registration_Otps WITH (UPDLOCK, HOLDLOCK)
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
          UPDATE Registration_Otps
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
          UPDATE Registration_Otps
          SET otp_status = 'BLOCKED'
          WHERE otp_id = @id
        `);

      await tx.rollback();
      return { error: "OTP_BLOCKED" };
    }

    // 🔥 check OTP
    const isMatch = await bcrypt.compare(otp, record.otp_code_hash);
    if (!isMatch) {
      await new sql.Request(tx)
        .input("id", record.otp_id)
        .query(`
          UPDATE Registration_Otps
          SET otp_attempt_count = otp_attempt_count + 1
          WHERE otp_id = @id
        `);

      // await tx.rollback();
      await tx.commit();
      return { error: "OTP_INVALID" };
    }

    // 🔥 2. VERIFIED OTP
    await new sql.Request(tx)
      .input("id", record.otp_id)
      .query(`
        UPDATE Registration_Otps
        SET otp_status = 'VERIFIED',
            otp_used_at = GETDATE()
        WHERE otp_id = @id
      `);

    // 🔥 3. Tạo user
    const userInsert = await new sql.Request(tx)
      .input("name", name)
      .input("phone", phone)
      .input("email", email)
      .input("password", password)
      .query(`
        INSERT INTO Users (user_name, user_phone, user_email, user_password_hash, user_role_id)
        OUTPUT INSERTED.user_id
        VALUES (@name, @phone, @email, @password, 4)
      `);

    const userId = userInsert.recordset[0].user_id;
    console.log("USER ID:", userId);


    const customerRes = await createCustomer(userId);

    if (!customerRes || customerRes.error) {
      await tx.rollback();
      return { error: "NOT_SERVICE" };
    }

    await tx.commit();


    return { message: "OTP_VALID" };

  } catch (err) {
    try { await tx.rollback(); } catch {}

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
      return res.status(400).json({ message: "OTP đã bị khóa do nhập sai nhiều lần!" });
    }

    if (result.error === "OTP_INVALID") {
      return res.status(400).json({ message: "OTP không đúng!" });
    }

    if (result.error === "NOT_SERVICE") {
      return res.status(400).json({ message: "FIAL" });
    }

    return res.status(200).json({ message: "Xác nhận OTP thành công!" });

  } catch (err) {
    console.error(err);
    return res.status(500).json({
      message: "Internal Server Error",
      error: err.message,
    });
  }
});

module.exports = router;