const express = require("express");
const router = express.Router();
const { sql, connectDB } = require("../config/db");
const jwt = require("jsonwebtoken");
require("dotenv").config();

// router.post("/", async (req, res) => {
//   const {invoice_month, invoice_total_usage, invoice_rate, invoice_customer_id, invoice_contract_id} = req.body;

//   if (!invoice_month ||invoice_total_usage == null || !invoice_rate || !invoice_customer_id || !invoice_contract_id) {
//     return res.status(400).json({
//       message: "Missing required fields"
//     });
//   }

//   const pool = await connectDB();
//   const tx = new sql.Transaction(pool);

//   let transactionStarted = false;

//   try {
//     await tx.begin(sql.ISOLATION_LEVEL.SERIALIZABLE);
//     transactionStarted = true;

//     const total_amount = Number(invoice_total_usage) * Number(invoice_rate);

//     // CHECK EXISTING (LOCK ROW)
//     const existing = await new sql.Request(tx)
//       .input("customerId", invoice_customer_id)
//       .input("month", invoice_month)
//       .query(`
//         SELECT TOP 1 *
//         FROM Invoices 
//         WHERE invoice_customer_id = @customerId
//           AND invoice_month = @month
//         ORDER BY invoice_id DESC
//       `);

//     let result;

//     if (existing.recordset.length > 0) {
//       const inv = existing.recordset[0];

//       // CASE 1: PAID → SKIP
//       if (inv.invoice_status === "PAID") {
//         await tx.rollback();
//       }

//       // CASE 2: UNPAID → UPDATE
//       else {
//         result = await new sql.Request(tx)
//           .input("month", invoice_month)
//           .input("usage", invoice_total_usage)
//           .input("rate", invoice_rate)
//           .input("amount", total_amount)
//           .input("customerId", invoice_customer_id)
//           .query(`
//             UPDATE Invoices
//             SET
//               invoice_total_usage = @usage,
//               invoice_total_amount = @amount,
//               invoice_rate = @rate,
//               invoice_updated_at = GETDATE()
//             OUTPUT INSERTED.invoice_id
//             WHERE invoice_customer_id = @customerId
//               AND invoice_month = @month
//               AND invoice_status = 'UNPAID'
//           `);
//       }
//     } else {
//       // CASE 3: NOT EXISTS → INSERT
//       result = await new sql.Request(tx)
//         .input("month", invoice_month)
//         .input("usage", invoice_total_usage)
//         .input("rate", invoice_rate)
//         .input("amount", total_amount)
//         .input("customerId", invoice_customer_id)
//         .input("contractId", invoice_contract_id)
//         .query(`
//           INSERT INTO Invoices (
//             invoice_month,
//             invoice_total_usage,
//             invoice_rate,
//             invoice_total_amount,
//             invoice_status,
//             invoice_customer_id,
//             invoice_contract_id
//           )
//           OUTPUT INSERTED.invoice_id
//           VALUES (
//             @month,
//             @usage,
//             @rate,
//             @amount,
//             'UNPAID',
//             @customerId,
//             @contractId
//           )
//         `);
//     }

//     await tx.commit();
//     transactionStarted = false;

//     return res.status(200).json({
//       message: "Invoice upsert success",
//       invoice_id: result.recordset[0].invoice_id,
//       invoice_total_amount: total_amount
//     });

//   } catch (err) {
//     console.error("GENERATE INVOICE ERROR:", err);

//     if (transactionStarted) {
//       await tx.rollback();
//     }

//     return res.status(500).json({
//       message: "Internal Server Error",
//       error: err.message
//     });
//   }
// });

// module.exports = router;

router.post("/", async (req, res) => {
  const {invoice_month, invoice_total_usage, invoice_rate, invoice_customer_id, invoice_contract_id} = req.body;

  if (!invoice_month ||invoice_total_usage == null || !invoice_rate || !invoice_customer_id || !invoice_contract_id) {
    return res.status(400).json({
      message: "Missing required fields"
    });
  }

  const pool = await connectDB();
  const tx = new sql.Transaction(pool);

  let transactionStarted = false;

  try {
    await tx.begin(sql.ISOLATION_LEVEL.READ_COMMITTED);
    transactionStarted = true;

    const total_amount = Number(invoice_total_usage) * Number(invoice_rate);

    // CHECK EXISTING (LOCK ROW)
    const existing = await new sql.Request(tx)
      .input("customerId", invoice_customer_id)
      .input("month", invoice_month)
      .query(`
        SELECT TOP 1 *
        FROM Invoices WITH (UPDLOCK, HOLDLOCK)
        WHERE invoice_customer_id = @customerId
          AND invoice_month = @month
        ORDER BY invoice_id DESC
      `);

    let result;

    if (existing.recordset.length > 0) {
      const inv = existing.recordset[0];

      // CASE 1: PAID → SKIP
      if (inv.invoice_status === "PAID") {
        await tx.rollback();
      }

      // CASE 2: UNPAID → UPDATE
      else {
        result = await new sql.Request(tx)
          .input("month", invoice_month)
          .input("usage", invoice_total_usage)
          .input("rate", invoice_rate)
          .input("amount", total_amount)
          .input("customerId", invoice_customer_id)
          .query(`
            UPDATE Invoices
            SET
              invoice_total_usage = @usage,
              invoice_total_amount = @amount,
              invoice_rate = @rate,
              invoice_updated_at = GETDATE()
            OUTPUT INSERTED.invoice_id
            WHERE invoice_customer_id = @customerId
              AND invoice_month = @month
              AND invoice_status = 'UNPAID'
          `);
      }
    } else {

      // await new Promise(resolve => setTimeout(resolve, 5000));
      // CASE 3: NOT EXISTS → INSERT
      result = await new sql.Request(tx)
        .input("month", invoice_month)
        .input("usage", invoice_total_usage)
        .input("rate", invoice_rate)
        .input("amount", total_amount)
        .input("customerId", invoice_customer_id)
        .input("contractId", invoice_contract_id)
        .query(`
          INSERT INTO Invoices (
            invoice_month,
            invoice_total_usage,
            invoice_rate,
            invoice_total_amount,
            invoice_status,
            invoice_customer_id,
            invoice_contract_id
          )
          OUTPUT INSERTED.invoice_id
          VALUES (
            @month,
            @usage,
            @rate,
            @amount,
            'UNPAID',
            @customerId,
            @contractId
          )
        `);
    }

    await tx.commit();
    transactionStarted = false;

    return res.status(200).json({
      message: "Invoice upsert success",
      invoice_id: result.recordset[0].invoice_id,
      invoice_total_amount: total_amount
    });

  } catch (err) {
    console.error("GENERATE INVOICE ERROR:", err);

    if (transactionStarted) {
      await tx.rollback();
    }

    return res.status(500).json({
      message: "Internal Server Error",
      error: err.message
    });
  }
});

module.exports = router;