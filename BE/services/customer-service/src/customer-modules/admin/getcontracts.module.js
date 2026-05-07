const express = require("express");
const router = express.Router();
const { connectDB } = require("../../config/db");

router.get("/", async (req, res) => {
  try {
    const { search = "" } = req.query;

    const pool = await connectDB();

    // const result = await pool.request()
    //   .input("search", `%${search}%`)
    //   .query(`
    //     SELECT 
    //       contract_id,
    //       contract_customer_id,
    //       contract_customer_fullname,
    //       contract_customer_address,
    //       contract_customer_phone,
    //       contract_customer_email,
    //       contract_type_id,
    //       contract_rate,
    //       contract_start_date,
    //       contract_end_date,
    //       contract_status,
    //       contract_created_at,
    //       contract_updated_at
    //     FROM Contracts
    //     WHERE 
    //       contract_customer_id LIKE @search OR
    //       contract_customer_fullname LIKE @search OR
    //       contract_customer_phone LIKE @search OR
    //       contract_customer_email LIKE @search OR
    //       contract_status LIKE @search
    //     ORDER BY contract_created_at DESC
    //   `);
    const result = await pool.request()
      .input("search", `%${search}%`)
      .query(`
        SELECT 
          c.contract_id,
          c.contract_customer_id,
          c.contract_customer_fullname,
          c.contract_customer_address,
          c.contract_customer_phone,
          c.contract_customer_email,
          c.contract_type_id,
          ct.contract_type_name,
          c.contract_rate,
          c.contract_start_date,
          c.contract_end_date,
          c.contract_status,
          c.contract_created_at,
          c.contract_updated_at
        FROM Contracts c
        JOIN ContractTypes ct
          ON c.contract_type_id = ct.contract_type_id
        WHERE 
          CAST(c.contract_customer_id AS VARCHAR) LIKE @search OR
          c.contract_customer_fullname LIKE @search OR
          c.contract_customer_phone LIKE @search OR
          c.contract_customer_email LIKE @search OR
          c.contract_status LIKE @search
        ORDER BY c.contract_created_at DESC
      `);

    return res.status(200).json({
      message: "Lấy danh sách hợp đồng thành công",
      contracts: result.recordset
    });

  } catch (err) {
    return res.status(500).json({
      message: "Internal Server Error",
      error: err.message
    });
  }
});

module.exports = router;