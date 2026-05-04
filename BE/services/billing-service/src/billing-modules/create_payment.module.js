const express = require("express");
const router = express.Router();
const axios = require("axios");
const crypto = require("crypto");
const { sql, connectDB } = require("../config/db");
const jwt = require("jsonwebtoken");
require("dotenv").config();

// const verifyToken = (req, res, next) => {
//   const authHeader = req.headers.authorization;

//   if (!authHeader) {
//     return res.status(401).json({
//       message: "No token provided"
//     });
//   }

//   const token = authHeader.split(" ")[1];

//   try {
//     const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
//     req.user = decoded;
//     next();
//   } catch (err) {
//     return res.status(401).json({
//       message: "Invalid or expired token"
//     });
//   }
// };

router.post("/", async (req, res) => {
  const { invoice_id } = req.body;

  const pool = await connectDB();
  const tx = new sql.Transaction(pool);

  let transactionStarted = false;
  let orderId;
  let invoice;

  try {
    await tx.begin(sql.ISOLATION_LEVEL.SERIALIZABLE);
    transactionStarted = true;

    const invoiceResult = await new sql.Request(tx)
      .input("invoiceId", invoice_id)
      .query(`
        SELECT *
        FROM Invoices WITH (UPDLOCK, HOLDLOCK)
        WHERE invoice_id = @invoiceId
      `);

    if (!invoiceResult.recordset.length) {
      await tx.rollback();
      transactionStarted = false;

      return res.status(404).json({
        message: "Không tìm thấy hóa đơn!"
      });
    }

    invoice = invoiceResult.recordset[0];

    if (invoice.invoice_status === "PAID") {
      await tx.rollback();
      transactionStarted = false;

      return res.status(400).json({
        message: "Hóa đơn đã được thanh toán!"
      });
    }

    const existingPayment = await new sql.Request(tx)
      .input("invoiceId", invoice_id)
      .query(`
        SELECT TOP 1 *
        FROM Payments WITH (UPDLOCK, HOLDLOCK)
        WHERE payment_invoice_id = @invoiceId
          AND payment_status = 'PENDING'
      `);

    if (existingPayment.recordset.length) {
      await tx.rollback();
      transactionStarted = false;

      return res.status(400).json({
        message: "Hóa đơn đang được thanh toán ở nơi khác!"
      });
    }

    orderId = `${Date.now()}`;

    await new sql.Request(tx)
      .input("invoiceId", invoice_id)
      .input("transactionId", orderId)
      .query(`
        INSERT INTO Payments (
          payment_method,
          payment_status,
          payment_transaction_id,
          payment_invoice_id
        )
        VALUES (
          'MOMO',
          'PENDING',
          @transactionId,
          @invoiceId
        )
      `);

    await tx.commit();
    transactionStarted = false;

    // ===== CALL MOMO AFTER COMMIT =====
    const accessKey = process.env.MOMO_ACCESS_KEY;
    const secretKey = process.env.MOMO_SECRET_KEY;
    const partnerCode = process.env.MOMO_PARTNER_CODE;

    const requestId = orderId;
    const amount = invoice.invoice_total_amount.toString();
    const orderInfo = `Thanh toan hoa don ${invoice_id}`;
    const redirectUrl = process.env.MOMO_REDIRECT_URL;
    const ipnUrl = process.env.MOMO_IPN_URL;
    const requestType = "captureWallet";
    // const requestType = "payWithCC";
    // const requestType = "payWithCC";

    const rawSignature =
      `accessKey=${accessKey}&amount=${amount}&extraData=&ipnUrl=${ipnUrl}&orderId=${orderId}&orderInfo=${orderInfo}&partnerCode=${partnerCode}&redirectUrl=${redirectUrl}&requestId=${requestId}&requestType=${requestType}`;

    const signature = crypto
      .createHmac("sha256", secretKey)
      .update(rawSignature)
      .digest("hex");

    const momoRes = await axios.post(
      "https://test-payment.momo.vn/v2/gateway/api/create",
      {
        partnerCode,
        requestId,
        amount,
        orderId,
        orderInfo,
        redirectUrl,
        ipnUrl,
        requestType,
        extraData: "",
        signature,
        lang: "vi"
      }
    );

    console.log("MoMo response:", momoRes.data);

    return res.status(200).json({
      payUrl: momoRes.data.payUrl
    });

  } catch (err) {
    if (transactionStarted) {
      await tx.rollback();
    }

    console.error("CREATE PAYMENT ERROR:", err);

    // nếu gọi momo fail thì update payment failed
    if (orderId) {
      await pool.request()
        .input("orderId", orderId)
        .query(`
          UPDATE Payments
          SET payment_status = 'FAILED'
          WHERE payment_transaction_id = @orderId
        `);
    }

    return res.status(500).json({
      message: "Create payment failed"
    });
  }
});

module.exports = router;