const express = require("express");
const router = express.Router();
const { sql, connectDB } = require("../config/db");
const jwt = require("jsonwebtoken");

const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({
      message: "No token provided"
    });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({
      message: "Invalid or expired token"
    });
  }
};

router.post("/", verifyToken, async (req, res) => {
  console.log("IPN CALLED");
  console.log(req.body);

  const { orderId, resultCode } = req.body;

  const pool = await connectDB();
  const tx = new sql.Transaction(pool);

  let transactionStarted = false;

  try {
    await tx.begin(sql.ISOLATION_LEVEL.READ_COMMITTED);
    transactionStarted = true;

    // 1. lock payment row
    const paymentResult = await new sql.Request(tx)
      .input("orderId", orderId)
      .query(`
        SELECT payment_invoice_id
        FROM Payments WITH (UPDLOCK, HOLDLOCK)
        WHERE payment_transaction_id = @orderId
      `);

    if (!paymentResult.recordset.length) {
      await tx.rollback();
      return res.status(404).json({ message: "Payment not found" });
    }

    const invoiceId = paymentResult.recordset[0].payment_invoice_id;

    if (resultCode === 0) {
      // SUCCESS PAYMENT
      await new sql.Request(tx)
        .input("orderId", orderId)
        .query(`
          UPDATE Payments
          SET payment_status = 'SUCCESS',
              payment_paid_at = GETDATE()
          WHERE payment_transaction_id = @orderId
        `);

      await new sql.Request(tx)
        .input("invoiceId", invoiceId)
        .query(`
          UPDATE Invoices
          SET invoice_status = 'PAID'
          WHERE invoice_id = @invoiceId
        `);

    } else {
      // FAILED PAYMENT
      await new sql.Request(tx)
        .input("orderId", orderId)
        .query(`
          UPDATE Payments
          SET payment_status = 'FAILED',
              payment_updated_at = GETDATE()
          WHERE payment_transaction_id = @orderId
        `);
    }

    await tx.commit();

    return res.json({ message: "OK" });

  } catch (err) {
    console.error(err);

    if (transactionStarted) {
      await tx.rollback();
    }

    return res.status(500).json({ message: "IPN error" });
  }
});

module.exports = router;