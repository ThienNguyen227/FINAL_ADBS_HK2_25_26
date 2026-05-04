const express = require("express");
const router = express.Router();
const { connectDB } = require("../config/db");

router.get("/", async (req, res) => {
  const { user_id } = req.query;

  if (!user_id) {
    return res.status(400).json({
      message: "Missing user_id"
    });
  }

  try {
    const pool = await connectDB();

    const result = await pool.request()
      .input("userId", user_id)
      .query(`
        SELECT TOP 1 c.contract_id
        FROM Customers cu
        INNER JOIN Contracts c
          ON cu.customer_id = c.contract_customer_id
        WHERE cu.customer_user_id = @userId
          AND c.contract_status = 'ACTIVE'
        ORDER BY c.contract_start_date DESC
      `);

    return res.status(200).json({
      hasContract: result.recordset.length > 0
    });

  } catch (err) {
    console.error("CHECK CONTRACT ERROR:", err);

    return res.status(500).json({
      message: "Internal Server Error"
    });
  }
});

module.exports = router;