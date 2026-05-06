const express = require("express");
const router = express.Router();
const sql = require("mssql");
const { connectDB } = require("../../config/db");

router.put("/", async (req, res) => {
  let tx;

  try {
    const {
      user_id,
      user_name,
      user_phone,
      user_email,
      user_role_id
    } = req.body;

    const pool = await connectDB();
    tx = new sql.Transaction(pool);

    await tx.begin(sql.ISOLATION_LEVEL.READ_COMMITTED);

    // lock bản ghi cần sửa
    const userLock = await new sql.Request(tx)
      .input("id", user_id)
      .query(`
        SELECT user_id
        FROM Users WITH (UPDLOCK, HOLDLOCK, NOWAIT)
        WHERE user_id = @id
      `);

    if (userLock.recordset.length === 0) {
      await tx.rollback();

      return res.status(404).json({
        message: "Không tìm thấy user"
      });
    }

    // kiểm tra email trùng
    const emailCheck = await new sql.Request(tx)
      .input("email", user_email)
      .input("id", user_id)
      .query(`
        SELECT user_id
        FROM Users WITH (UPDLOCK, HOLDLOCK)
        WHERE user_email = @email
          AND user_id <> @id
      `);

    if (emailCheck.recordset.length > 0) {
      await tx.rollback();

      return res.status(400).json({
        message: "Email đã tồn tại"
      });
    }

    // kiểm tra số điện thoại trùng
    const phoneCheck = await new sql.Request(tx)
      .input("phone", user_phone)
      .input("id", user_id)
      .query(`
        SELECT user_id
        FROM Users WITH (UPDLOCK, HOLDLOCK)
        WHERE user_phone = @phone
          AND user_id <> @id
      `);

    if (phoneCheck.recordset.length > 0) {
      await tx.rollback();

      return res.status(400).json({
        message: "Số điện thoại đã tồn tại"
      });
    }

    // test race condition
    await new Promise(resolve => setTimeout(resolve, 5000));

    const result = await new sql.Request(tx)
      .input("id", user_id)
      .input("name", user_name)
      .input("phone", user_phone)
      .input("email", user_email)
      .input("role", user_role_id)
      .query(`
        UPDATE Users
        SET
          user_name = @name,
          user_phone = @phone,
          user_email = @email,
          user_role_id = @role,
          user_updated_at = GETDATE()
        WHERE user_id = @id
      `);

    if (result.rowsAffected[0] === 0) {
      await tx.rollback();

      return res.status(404).json({
        message: "Không tìm thấy user"
      });
    }

    await tx.commit();

    return res.status(200).json({
      message: "Cập nhật thành công"
    });

  } catch (err) {
    if (tx) {
      try {
        await tx.rollback();
      } catch (_) {}
    }

    // record đang bị transaction khác lock
    if (err.number === 1222) {
      return res.status(409).json({
        message: "Thông tin đang được chỉnh sửa ở nơi khác"
      });
    }

    return res.status(500).json({
      message: err.message
    });
  }
});

module.exports = router;