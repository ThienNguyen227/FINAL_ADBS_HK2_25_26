const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { connectDB } = require("../config/db");
require("dotenv").config();

const hashToken = (token) => {
  return crypto.createHash("sha256").update(token).digest("hex");
};

router.post("/", async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({
        message: "Không có refresh token"
      });
    }

    let decoded;

    try {
      decoded = jwt.verify(
        refreshToken,
        process.env.JWT_REFRESH_SECRET
      );
    } catch {
      return res.status(401).json({
        message: "Refresh token không hợp lệ"
      });
    }

    const tokenHash = hashToken(refreshToken);

    const pool = await connectDB();

    const result = await pool.request()
      .input("userId", decoded.userId)
      .input("tokenHash", tokenHash)
      .query(`
        SELECT
          u.user_id,
          u.user_status,
          u.user_role_id,
          s.session_is_revoked,
          s.session_expires_at
        FROM User_Sessions s
        JOIN Users u
          ON s.session_user_id = u.user_id
        WHERE
          s.session_user_id = @userId
          AND s.session_refresh_token_hash = @tokenHash
      `);

    if (result.recordset.length === 0) {
      return res.status(401).json({
        message: "Session không tồn tại"
      });
    }

    const session = result.recordset[0];

    if (session.session_is_revoked) {
      return res.status(401).json({
        message: "Session đã bị revoke"
      });
    }

    if (new Date(session.session_expires_at) < new Date()) {
      return res.status(401).json({
        message: "Refresh token hết hạn"
      });
    }

    if (session.user_status !== "ACTIVE") {
      return res.status(403).json({
        message: "Tài khoản đã bị khóa"
      });
    }

    const newAccessToken = jwt.sign(
      {
        userId: session.user_id
      },
      process.env.JWT_ACCESS_SECRET,
      {
        expiresIn: "2h"
      }
    );

    await pool.request()
      .input("userId", session.user_id)
      .input("tokenHash", tokenHash)
      .query(`
        UPDATE User_Sessions
        SET session_last_activity = GETDATE()
        WHERE
          session_user_id = @userId
          AND session_refresh_token_hash = @tokenHash
      `);

    return res.status(200).json({
      accessToken: newAccessToken
    });

  } catch (err) {
    console.error(err);

    return res.status(500).json({
      message: "Internal Server Error"
    });
  }
});

module.exports = router;