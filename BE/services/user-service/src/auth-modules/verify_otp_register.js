const express = require("express");
const router = express.Router();
const { connectDB } = require("../config/db");
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

// CALL API
// const createCustomer = async (userId) => {
//   try {
//     await axios.post("http://localhost:3001/customers/create-customer", {
//       customer_user_id: userId
//     });
//   } catch (err) {
//     console.error("Create customer failed:", err.message);
//   }
// };

const createCustomer = async (userId) => {
  const res = await axios.post(
    "http://localhost:3001/customers/create-customer",
    {
      customer_user_id: userId
    }
  );

  return res.data;
};


// ================== SERVICE ==================

const verifyOTPService = async ({ name, phone, email, password, otp }) => {
  const record = await getLatestOTP(email);

  if (!record) return { error: "OTP_NOT_FOUND" };

  // đã dùng rồi
  if (record.otp_status !== "ACTIVE") {
    return { error: "OTP_ALREADY_USED" };
  }

  // hết hạn
  if (new Date() > record.otp_expired_at) {
    await updateOTPStatus(record.otp_id, "EXPIRED");
    return { error: "OTP_EXPIRED" };
  }

  // vượt quá số lần thử (3 lần)
  if (record.otp_attempt_count >= 3) {
    await updateOTPStatus(record.otp_id, "BLOCKED");
    return { error: "OTP_BLOCKED" };
  }

  // sai OTP
  const isMatch = await bcrypt.compare(otp, record.otp_code_hash);
  if (!isMatch) {
    await increaseAttempt(record.otp_id);
    return { error: "OTP_INVALID" };
  }

  // await updateOTPStatus(record.otp_id, "VERIFIED");

  // await createUser(name, phone, email, password);

  // const userId = await getUserIdByEmail(email)

  // await createCustomer(userId);

  try {
    await updateOTPStatus(record.otp_id, "VERIFIED");

    await createUser(name, phone, email, password);
    const userId = await getUserIdByEmail(email)

    await createCustomer(userId);
  } catch (err) {
    const deleted = await deleteUser(email);

    if (deleted > 0) {
      console.log("ROLLBACK SUCCESS: user deleted");
    } else {
      console.log("ROLLBACK FAIL: user not found");
    }

    throw err;
  }

  return { message: "OTP_VALID" };
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