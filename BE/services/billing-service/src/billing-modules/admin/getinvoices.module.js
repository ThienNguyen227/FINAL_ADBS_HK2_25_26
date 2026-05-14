const express = require("express");

const router = express.Router();

const { connectDB } = require("../../config/db");

router.get("/", async (req, res) => {

  try {

    const { search = "" } = req.query;

    const pool = await connectDB();

    const result = await pool.request()
      .input("search", `%${search}%`)
      .query(`
        SELECT
          invoice_id,
          invoice_month,
          invoice_total_usage,
          invoice_rate,
          invoice_total_amount,
          invoice_status,
          invoice_created_at,
          invoice_updated_at,
          invoice_customer_id,
          invoice_contract_id
        FROM Invoices
        WHERE
          CAST(invoice_id AS NVARCHAR) LIKE @search
          OR CAST(invoice_customer_id AS NVARCHAR) LIKE @search
          OR invoice_status LIKE @search
        ORDER BY invoice_created_at DESC
      `);

    return res.status(200).json({
      invoices: result.recordset
    });

  } catch (err) {

    return res.status(500).json({
      message: "Internal Server Error",
      error: err.message
    });

  }

});

module.exports = router;