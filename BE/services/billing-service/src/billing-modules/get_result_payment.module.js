const express = require("express");
const router = express.Router();
const { connectDB } = require("../config/db");

router.post("/", async (req, res) => {
  console.log("IPN CALLED");
  console.log(req.body);
  const { orderId, resultCode } = req.body;

  try {
    const pool = await connectDB();

    // 1. update payment trước
    const paymentResult = await pool.request()
      .input("orderId", orderId)
      .query(`
        SELECT payment_invoice_id
        FROM Payments
        WHERE payment_transaction_id = @orderId
      `);

    if (!paymentResult.recordset.length) {
      return res.status(404).json({ message: "Payment not found" });
    }

    const invoiceId = paymentResult.recordset[0].payment_invoice_id;

    if (resultCode === 0) {
      await pool.request()
        .input("orderId", orderId)
        .query(`
          UPDATE Payments
          SET payment_status = 'SUCCESS',
              payment_paid_at = GETDATE()
          WHERE payment_transaction_id = @orderId
        `);

      await pool.request()
        .input("invoiceId", invoiceId)
        .query(`
          UPDATE Invoices
          SET invoice_status = 'PAID'
          WHERE invoice_id = @invoiceId
        `);

    } else {
      await pool.request()
        .input("orderId", orderId)
        .query(`
          UPDATE Payments
          SET payment_status = 'FAILED',
              payment_updated_at = GETDATE()
          WHERE payment_transaction_id = @orderId
        `);
    }

    return res.json({ message: "OK" });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "IPN error" });
  }
});

module.exports = router;