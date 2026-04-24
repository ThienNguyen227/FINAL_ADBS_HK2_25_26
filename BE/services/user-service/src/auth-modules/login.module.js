const express = require("express");
const router = express.Router();
const { connectDB } = require("../config/db");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
require("dotenv").config();


// ================== REPOSITORY ==================

const checkUserExistence = async (phone, password) => {
  const pool = await connectDB();
  const result = await pool.request()
    .input("phone", phone)
    .input("password", password)
    .query("SELECT user_phone, user_password_hash FROM Users WHERE user_phone = @phone and user_password_hash = @password");

  return result.recordset[0];
};

const getUserByPhone = async (phone) => {
  const pool = await connectDB();

  const result = await pool.request()
    .input("phone", phone)
    .query(`
      SELECT user_id, user_role_id
      FROM Users 
      WHERE user_phone = @phone
    `);

  return result.recordset[0];
};

const hashToken = (token) => {
  return crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");
};

const insertSession = async ({ userId, refreshToken, device, ip }) => {
  const pool = await connectDB();

  const refreshTokenHash = hashToken(refreshToken);

  await pool.request()
    .input("userId", userId)
    .input("refreshTokenHash", refreshTokenHash)
    .input("device", device)
    .input("ip", ip)
    .input(
      "expiresAt",
      new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    )
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
      )
    `);
};

// ================== SERVICE ==================
const jwt = require("jsonwebtoken");

const loginService = async (data) => {
  const existingUser = await checkUserExistence(data.phone, data.password);

  if (!existingUser) return { error: "USER_NOT_EXIST" };

  const user = await getUserByPhone(data.phone);

  console.log("USER:", user);

  // 👉 Access token (5 phút)
  const accessToken = jwt.sign(
    { userId: user.user_id },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: "5m" }
  );

  // 👉 Refresh token (7 ngày)
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
    const result = await loginService(req.body);

    if (result.error === "USER_NOT_EXIST") {
      return res.status(400).json({
        message: "Số điện thoại hoặc mật khẩu không chính xác!"
      });
    }

    // 👉 lưu session (chỉ lưu refresh token)
    await insertSession({
      userId: result.userId,
      refreshToken: result.refreshToken,
      device: req.headers["user-agent"],
      ip: req.ip,
    });

    // 👉 set cookie refresh token
    res.cookie("refreshToken", result.refreshToken, {
      httpOnly: true,
      secure: false,
      sameSite: "Strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    // 👉 trả access token cho FE
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