const express = require("express");
const router = express.Router();
const { sql, connectDB } = require("../config/db");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
require("dotenv").config();


// ================== REPOSITORY ==================

const getUserByPhone = async (phone) => {
  const pool = await connectDB();

  const result = await pool.request()
    .input("phone", phone)
    .query(`
      SELECT 
        user_id,
        user_phone,
        user_password_hash,
        user_role_id,
        user_status,
        user_failed_login_attempts,
        user_locked_until
      FROM Users 
      WHERE user_phone = @phone
    `);

  return result.recordset[0];
};


// ================== LOGIN TRACKING ==================

const handleLoginFail = async (phone) => {
  const pool = await connectDB();

  await pool.request()
    .input("phone", phone)
    .query(`
      UPDATE Users
      SET 
        user_failed_login_attempts = user_failed_login_attempts + 1,

        user_locked_until = CASE 
          WHEN user_failed_login_attempts + 1 >= 5 
               AND user_failed_login_attempts + 1 < 10
          THEN DATEADD(MINUTE, 5, GETDATE())
          ELSE user_locked_until
        END,

        user_status = CASE 
          WHEN user_failed_login_attempts + 1 >= 10 
          THEN 'LOCKED'
          ELSE user_status
        END
      WHERE user_phone = @phone;
    `);
};


const handleLoginSuccess = async (phone) => {
  const pool = await connectDB();

  await pool.request()
    .input("phone", phone)
    .query(`
      UPDATE Users
      SET 
        user_failed_login_attempts = 0,
        user_locked_until = NULL,
        user_last_login_at = GETDATE()
      WHERE user_phone = @phone;
    `);
};


// ================== SESSION ==================

const hashToken = (token) => {
  return crypto.createHash("sha256").update(token).digest("hex");
};


const upsertSession = async ({ userId, refreshToken, device, ip }) => {
  const pool = await connectDB();
  const transaction = pool.transaction();

  const refreshTokenHash = hashToken(refreshToken);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  try {
    await transaction.begin();

    const request = transaction.request()
      .input("userId", userId)
      .input("device", device)
      .input("refreshTokenHash", refreshTokenHash)
      .input("ip", ip)
      .input("expiresAt", expiresAt);

    const result = await request.query(`
      UPDATE User_Sessions WITH (UPDLOCK, HOLDLOCK)
      SET 
        session_refresh_token_hash = @refreshTokenHash,
        session_ip_address = @ip,
        session_expires_at = @expiresAt,
        session_is_revoked = 0
      WHERE session_user_id = @userId
        AND session_device_info = @device;

      SELECT @@ROWCOUNT AS affected;
    `);

    // TEST LOCK (giữ để debug race condition)
    await new Promise(resolve => setTimeout(resolve, 5000));

    if (result.recordset[0].affected === 0) {
      await transaction.request()
        .input("userId", userId)
        .input("device", device)
        .input("refreshTokenHash", refreshTokenHash)
        .input("ip", ip)
        .input("expiresAt", expiresAt)
        .query(`
          INSERT INTO User_Sessions 
          (
            session_user_id,
            session_refresh_token_hash,
            session_device_info,
            session_ip_address,
            session_expires_at
          )
          VALUES 
          (
            @userId,
            @refreshTokenHash,
            @device,
            @ip,
            @expiresAt
          );
        `);
    }

    await transaction.commit();

  } catch (err) {
    await transaction.rollback();
    throw err;
  }
};


// ================== LOGIN SERVICE ==================

const loginService = async (phone, password) => {

  const user = await getUserByPhone(phone);

  // 1. user không tồn tại
  if (!user) {
    return { error: "USER_NOT_EXIST" };
  }

  // 2. check lock cứng
  if (user.user_status === "LOCKED") {
    return { error: "ACCOUNT_LOCKED" };
  }

  // 3. check lock tạm
  const lockUntil = new Date(user.user_locked_until).getTime();
  const fixedLock = lockUntil - 7 * 60 * 60 * 1000;
  const now = Date.now();
  if (now < fixedLock) {
    return { error: "TEMP_LOCKED" };
  }

  // 4. so sánh password (PLAIN TEXT theo yêu cầu)
  const isMatch = password === user.user_password_hash;

  // sai password
  if (!isMatch) {
    await handleLoginFail(phone);

    return { error: "WRONG_PASSWORD" };
  }

  // đúng password
  await handleLoginSuccess(phone);

  // generate token
  const accessToken = jwt.sign(
    { userId: user.user_id },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: "30m" }
  );

  const refreshToken = jwt.sign(
    { userId: user.user_id },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: "7d" }
  );

  return {
    userId: user.user_id,
    accessToken,
    refreshToken
  };
};


// ================== CONTROLLER ==================

router.post("/", async (req, res) => {
  try {
    const { phone, password } = req.body;

    const result = await loginService(phone, password);

    if (result.error === "USER_NOT_EXIST") {
      return res.status(400).json({ message: "Sai thông tin tài khoản!" });
    }

    if (result.error === "ACCOUNT_LOCKED") {
      return res.status(400).json({ message: "Tài khoản đã bị khóa!" });
    }

    if (result.error === "TEMP_LOCKED") {
      return res.status(400).json({ message: "Tài khoản bị khóa tạm thời!" });
    }

    if (result.error === "WRONG_PASSWORD") {
      return res.status(400).json({ message: "Sai mật khẩu!" });
    }

    // session
    await upsertSession({
      userId: result.userId,
      refreshToken: result.refreshToken,
      device: req.headers["user-agent"],
      ip: req.ip,
    });

    // cookie
    res.cookie("refreshToken", result.refreshToken, {
      httpOnly: true,
      secure: false,
      // sameSite: "Strict",
      sameSite: "Lax", // FIX
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({
      message: "Đăng nhập thành công!",
      accessToken: result.accessToken
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