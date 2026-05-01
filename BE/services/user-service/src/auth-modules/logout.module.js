const express = require("express");
const router = express.Router();
const { sql, connectDB } = require("../config/db");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
require("dotenv").config();


// ================== HASH TOKEN ==================
const hashToken = (token) => {
  return crypto.createHash("sha256").update(token).digest("hex");
};


// ================== VERIFY TOKEN ==================
const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({
      message: "No token provided",
    });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    req.user = decoded; // { userId: ... }
    next();
  } catch (err) {
    return res.status(401).json({
      message: "Invalid or expired token",
    });
  }
};


// ================== LOGOUT ==================
router.put("/", verifyToken, async (req, res) => {
  const refreshToken = req.cookies?.refreshToken;

  if (!refreshToken) {
    return res.status(400).json({
      message: "Không tìm thấy refresh token!",
    });
  }

  const refreshTokenHash = hashToken(refreshToken);
  const pool = await connectDB();
  const tx = new sql.Transaction(pool);

  try {
    await tx.begin();

    await new sql.Request(tx)
      .input("userId", req.user.userId)
      .input("refreshTokenHash", refreshTokenHash)
      .query(`
        UPDATE User_Sessions WITH (UPDLOCK)
        SET 
          session_is_revoked = 1,
          session_revoked_at = GETDATE()
        WHERE session_user_id = @userId
          AND session_refresh_token_hash = @refreshTokenHash
          AND session_is_revoked = 0;
      `);

    await tx.commit();

    // clear cookie phía server
    res.clearCookie("refreshToken");

    return res.status(200).json({
      message: "Đăng xuất thành công!",
    });

  } catch (err) {
    await tx.rollback();
    console.error(err);

    return res.status(500).json({
      message: "Internal Server Error",
      error: err.message,
    });
  }
});


module.exports = router;