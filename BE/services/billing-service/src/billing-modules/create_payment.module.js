const express = require("express");
const router = express.Router();
const axios = require("axios");
const crypto = require("crypto");
const { sql, connectDB } = require("../config/db");
const jwt = require("jsonwebtoken");
const qs = require("qs");
require("dotenv").config();

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
  const { invoice_id, method } = req.body;

  if (!["momo", "vnpay"].includes(method)) {
    return res.status(400).json({
      message: "Phương thức thanh toán không hợp lệ"
    });
  }

  const pool = await connectDB();
  const tx = new sql.Transaction(pool);
  const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  let transactionStarted = false;
  let orderId;
  let invoice;

  try {
    // await tx.begin(sql.ISOLATION_LEVEL.SERIALIZABLE);
    // transactionStarted = true;

    // const invoiceResult = await new sql.Request(tx)
    //   .input("invoiceId", invoice_id)
    //   .query(`
    //     SELECT *
    //     FROM Invoices 
    //     WHERE invoice_id = @invoiceId
    //   `);

    // if (!invoiceResult.recordset.length) {
    //   await tx.rollback();
    //   transactionStarted = false;

    //   return res.status(404).json({
    //     message: "Không tìm thấy hóa đơn!"
    //   });
    // }

    // invoice = invoiceResult.recordset[0];

    // if (invoice.invoice_status === "PAID") {
    //   await tx.rollback();
    //   transactionStarted = false;

    //   return res.status(400).json({
    //     message: "Hóa đơn đã được thanh toán!"
    //   });
    // }

    // const existingPayment = await new sql.Request(tx)
    //   .input("invoiceId", invoice_id)
    //   .query(`
    //     SELECT TOP 1 *
    //     FROM Payments 
    //     WHERE payment_invoice_id = @invoiceId
    //       AND payment_status = 'PENDING'
    //   `);

    // if (existingPayment.recordset.length) {
    //   await tx.rollback();
    //   transactionStarted = false;

    //   return res.status(400).json({
    //     message: "Hóa đơn đang được thanh toán ở nơi khác!"
    //   });
    // }

    // await sleep(5000);

    // orderId = `${Date.now()}`;

    // await new sql.Request(tx)
    //   .input("invoiceId", invoice_id)
    //   .input("transactionId", orderId)
    //   .input("method", method.toUpperCase())
    //   .query(`
    //     INSERT INTO Payments (
    //       payment_method,
    //       payment_status,
    //       payment_transaction_id,
    //       payment_invoice_id
    //     )
    //     VALUES (
    //       @method,
    //       'PENDING',
    //       @transactionId,
    //       @invoiceId
    //     )
    //   `);

    // await tx.commit();
    // transactionStarted = false;
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
      .input("method", method.toUpperCase())
      .query(`
        INSERT INTO Payments (
          payment_method,
          payment_status,
          payment_transaction_id,
          payment_invoice_id
        )
        VALUES (
          @method,
          'PENDING',
          @transactionId,
          @invoiceId
        )
      `);

    await tx.commit();
    transactionStarted = false;

    // ================= MOMO =================
    if (method === "momo") {
      const accessKey = process.env.MOMO_ACCESS_KEY;
      const secretKey = process.env.MOMO_SECRET_KEY;
      const partnerCode = process.env.MOMO_PARTNER_CODE;

      const requestId = orderId;
      const amount = invoice.invoice_total_amount.toString();
      const orderInfo = `Thanh toan hoa don ${invoice_id}`;
      const redirectUrl = process.env.MOMO_REDIRECT_URL;
      const ipnUrl = process.env.MOMO_IPN_URL;
      const requestType = "payWithATM";

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

      return res.status(200).json({
        payUrl: momoRes.data.payUrl
      });
    }

    function sortObject(obj) {
      let sorted = {};
      let str = [];
      let key;

      for (key in obj) {
        if (obj.hasOwnProperty(key)) {
          str.push(encodeURIComponent(key));
        }
      }

      str.sort();

      for (key = 0; key < str.length; key++) {
        sorted[str[key]] = encodeURIComponent(obj[str[key]]).replace(/%20/g, "+");
      }

      return sorted;
    }

    // ================= VNPAY =================
    if (method === "vnpay") {
      const tmnCode = process.env.VNP_TMNCODE;
      const secretKey = process.env.VNP_HASHSECRET;
      const vnpUrl = process.env.VNP_URL;
      const returnUrl = process.env.VNP_RETURN_URL;

      const date = new Date();

      const createDate =
        date.getFullYear().toString() +
        String(date.getMonth() + 1).padStart(2, "0") +
        String(date.getDate()).padStart(2, "0") +
        String(date.getHours()).padStart(2, "0") +
        String(date.getMinutes()).padStart(2, "0") +
        String(date.getSeconds()).padStart(2, "0");

      const amount = invoice.invoice_total_amount * 100;

      let vnp_Params = {
        vnp_Version: "2.1.0",
        vnp_Command: "pay",
        vnp_TmnCode: tmnCode,
        vnp_Locale: "vn",
        vnp_CurrCode: "VND",
        vnp_TxnRef: orderId,
        vnp_OrderInfo: `Thanh toan hoa don ${invoice_id}`,
        vnp_OrderType: "other",
        vnp_Amount: amount,
        vnp_ReturnUrl: returnUrl,
        vnp_IpAddr: "127.0.0.1",
        vnp_CreateDate: createDate
      };

      vnp_Params = sortObject(vnp_Params);

      const signData = qs.stringify(vnp_Params, {
        encode: false
      });

      const secureHash = crypto
        .createHmac("sha512", secretKey)
        .update(signData, "utf-8")
        .digest("hex");

      vnp_Params["vnp_SecureHash"] = secureHash;

      const payUrl =
        vnpUrl + "?" + qs.stringify(vnp_Params, { encode: false });

      return res.status(200).json({ payUrl });
    }

  } catch (err) {
    if (transactionStarted) {
      await tx.rollback();
    }

    console.error("CREATE PAYMENT ERROR:", err);

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