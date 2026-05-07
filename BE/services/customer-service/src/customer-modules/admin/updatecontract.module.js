const express = require("express");
const router = express.Router();
const { sql, connectDB } = require("../../config/db");

router.put("/", async (req, res) => {
  let transaction;

  try {
    const {
      contract_id,
      contract_rate,
      contract_start_date,
      contract_end_date,
      contract_status
    } = req.body;

    if (!contract_id) {
      return res.status(400).json({
        message: "contract_id is required"
      });
    }

    const pool = await connectDB();
    transaction = new sql.Transaction(pool);

    await transaction.begin(sql.ISOLATION_LEVEL.REPEATABLE_READ);

    // 🔥 LOCK ROW
    await new sql.Request(transaction)
      .input("contract_id", contract_id)
      .query(`
        SELECT 1
        FROM Contracts WITH (UPDLOCK, HOLDLOCK, NOWAIT)
        WHERE contract_id = @contract_id;
      `);

    // 🔥 simulate race condition
    await new Promise(resolve => setTimeout(resolve, 5000));

    // 🔥 UPDATE
    const result = await new sql.Request(transaction)
      .input("contract_id", contract_id)
      .input("contract_rate", contract_rate)
      .input("contract_start_date", contract_start_date)
      .input("contract_end_date", contract_end_date)
      .input("contract_status", contract_status)
      .query(`
        UPDATE Contracts
        SET 
          contract_rate = @contract_rate,
          contract_start_date = @contract_start_date,
          contract_end_date = @contract_end_date,
          contract_status = @contract_status,
          contract_updated_at = GETDATE()
        WHERE contract_id = @contract_id;

        SELECT * FROM Contracts WHERE contract_id = @contract_id;
      `);

    await transaction.commit();

    return res.status(200).json({
      message: "Cập nhật hợp đồng thành công",
      contract: result.recordset[0]
    });

  } catch (err) {
    if (transaction) {
      try {
        await transaction.rollback();
      } catch (_) {}
    }

    if (err.number === 1222) {
      return res.status(409).json({
        message: "Hợp đồng đang được chỉnh sửa ở nơi khác"
      });
    }

    return res.status(500).json({
      message: "Internal Server Error",
      error: err.message
    });
  }
});

module.exports = router;