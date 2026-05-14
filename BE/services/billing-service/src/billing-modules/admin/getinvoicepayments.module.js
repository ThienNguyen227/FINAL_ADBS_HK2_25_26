const express = require("express");

const router = express.Router();

const { connectDB } = require("../../config/db");

router.get("/:invoiceId", async (req, res) => {

  try {

    const { invoiceId } = req.params;

    const pool = await connectDB();

    const result = await pool.request()
      .input("invoiceId", invoiceId)
      .query(`
        SELECT *
        FROM Payments
        WHERE payment_invoice_id = @invoiceId
        ORDER BY payment_created_at DESC
      `);

    return res.status(200).json({
      payments: result.recordset
    });

  } catch (err) {

    return res.status(500).json({
      message: "Internal Server Error",
      error: err.message
    });

  }

});

module.exports = router;