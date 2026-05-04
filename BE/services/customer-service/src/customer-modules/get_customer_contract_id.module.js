const express = require("express");
const router = express.Router();
const { connectDB } = require("../config/db");
const jwt = require("jsonwebtoken");
require("dotenv").config();

// ================== GET CUSTOMER + CONTRACT ID ==================
router.get("/", async (req, res) => {
  const { user_id } = req.query;

  if (!user_id) {
    return res.status(400).json({
      message: "Missing user_id"
    });
  }

  try {
    const pool = await connectDB();

    // ==========================================
    // 1. GET CUSTOMER
    // ==========================================
    const customerResult = await pool.request()
      .input("userId", user_id)
      .query(`
        SELECT TOP 1 customer_id
        FROM Customers
        WHERE customer_user_id = @userId
      `);

    if (customerResult.recordset.length === 0) {
      return res.status(404).json({
        message: "Customer not found"
      });
    }

    const customerId = customerResult.recordset[0].customer_id;

    // ==========================================
    // 2. GET CONTRACT
    // ==========================================
    const contractResult = await pool.request()
      .input("customerId", customerId)
      .query(`
        SELECT TOP 1 contract_id, contract_rate
        FROM Contracts
        WHERE contract_customer_id = @customerId
          AND contract_status = 'ACTIVE'
        ORDER BY contract_start_date DESC
      `);

    if (contractResult.recordset.length === 0) {
      return res.status(404).json({
        message: "Contract not found"
      });
    }

    const contractId = contractResult.recordset[0].contract_id;
    const contractRate = contractResult.recordset[0].contract_rate;

    // ==========================================
    // 3. RESPONSE
    // ==========================================
    return res.status(200).json({
      customer_id: customerId,
      contract_id: contractId,
      contract_rate: contractRate
    });

  } catch (err) {
    console.error("GET CUSTOMER CONTRACT ERROR:", err);

    return res.status(500).json({
      message: "Internal Server Error",
      error: err.message
    });
  }
});

module.exports = router;