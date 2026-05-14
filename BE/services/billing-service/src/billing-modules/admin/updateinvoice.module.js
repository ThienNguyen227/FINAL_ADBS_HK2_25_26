const express = require("express");

const router = express.Router();

const { sql, connectDB } = require("../../config/db");

router.put("/", async (req, res) => {

  let transaction;

  try {

    const {
      invoice_id,
      invoice_status
    } = req.body;

    if (!invoice_id) {
      return res.status(400).json({
        message: "invoice_id is required"
      });
    }

    const pool = await connectDB();

    transaction = new sql.Transaction(pool);

    await transaction.begin(
      sql.ISOLATION_LEVEL.REPEATABLE_READ
    );

    await new sql.Request(transaction)
      .input("invoice_id", invoice_id)
      .query(`
        SELECT 1
        FROM Invoices WITH (
          UPDLOCK,
          HOLDLOCK,
          NOWAIT
        )
        WHERE invoice_id = @invoice_id
      `);

    // =====================================
    // SIMULATE RACE CONDITION
    // =====================================
    await new Promise(resolve =>
      setTimeout(resolve, 5000)
    );

    await new sql.Request(transaction)
      .input("invoice_id", invoice_id)
      .input("invoice_status", invoice_status)
      .query(`
        UPDATE Invoices
        SET
          invoice_status = @invoice_status,
          invoice_updated_at = GETDATE()
        WHERE invoice_id = @invoice_id
      `);


    await transaction.commit();

    return res.status(200).json({
      message: "Cập nhật hóa đơn thành công"
    });

  } catch (err) {

    if (transaction) {
      try {
        await transaction.rollback();
      } catch (_) {}
    }

    // =====================================
    // LOCK CONFLICT
    // =====================================
    if (err.number === 1222) {
      return res.status(409).json({
        message:
          "Hóa đơn đang được cập nhật ở nơi khác"
      });
    }

    return res.status(500).json({
      message: "Internal Server Error",
      error: err.message
    });

  }

});

module.exports = router;