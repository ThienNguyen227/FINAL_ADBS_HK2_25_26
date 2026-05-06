const express = require("express");
const router = express.Router();
const sql = require("mssql");
const { connectDB } = require("../../config/db");

router.put("/", async (req, res) => {
  let tx;

  try {
    const { user_id, status } = req.body;

    if (!["ACTIVE", "LOCKED"].includes(status)) {
      return res.status(400).json({
        message: "Trạng thái không hợp lệ"
      });
    }

    const pool = await connectDB();
    tx = new sql.Transaction(pool);

    await tx.begin(sql.ISOLATION_LEVEL.READ_COMMITTED);

    // 1. update user status
    const updateUser = await new sql.Request(tx)
      .input("id", user_id)
      .input("status", status)
      .query(`
        UPDATE Users
        SET
          user_status = @status,
          user_updated_at = GETDATE()
        WHERE user_id = @id
      `);

    if (updateUser.rowsAffected[0] === 0) {
      await tx.rollback();

      return res.status(404).json({
        message: "Không tìm thấy tài khoản"
      });
    }

    // 2. nếu lock thì revoke toàn bộ session
    if (status === "LOCKED") {
      await new sql.Request(tx)
        .input("id", user_id)
        .query(`
          UPDATE User_Sessions
          SET
            session_is_revoked = 1,
            session_revoked_at = GETDATE()
          WHERE session_user_id = @id
            AND session_is_revoked = 0
        `);
    }

    await tx.commit();

    res.status(200).json({
      message:
        status === "LOCKED"
          ? "Khóa tài khoản thành công"
          : "Mở khóa tài khoản thành công"
    });

  } catch (err) {
    if (tx) await tx.rollback();

    res.status(500).json({
      message: err.message
    });
  }
});

module.exports = router;