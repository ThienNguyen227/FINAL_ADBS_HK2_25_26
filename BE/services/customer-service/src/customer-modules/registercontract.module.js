const express = require("express");
const router = express.Router();
const { sql,  connectDB } = require("../config/db");

const jwt = require("jsonwebtoken");
require("dotenv").config();

// ================== VERIFY TOKEN ==================
const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ message: "No token provided" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

// ================== REGISTER CONTRACT ==================
// router.post("/", verifyToken, async (req, res) => {
//   const {userId, userPhone, userEmail, customerId, contractTypeId, } = req.body;

//   if (!userId || !customerId || !contractTypeId) {
//     return res.status(400).json({
//       message: "Missing required fields",
//     });
//   }

//   try {
//     const pool = await connectDB();

//     // ================== 1. CHECK ACTIVE CONTRACT ==================
//     const existingContract = await pool.request()
//       .input("customerId", customerId)
//       .query(`
//         SELECT TOP 1 *
//         FROM Contracts
//         WHERE contract_customer_id = @customerId
//           AND contract_status = 'ACTIVE'
//           AND contract_end_date >= GETDATE()
//       `);

//     await new Promise(resolve => setTimeout(resolve, 5000));

//     if (existingContract.recordset.length > 0) {
//       return res.status(409).json({
//         message: "Hợp đồng cũ vẫn còn hiệu lực!",
//       });
//     }

//     // ================== 2. GET CONTRACT TYPE ==================
//     const contractType = await pool.request()
//       .input("contractTypeId", contractTypeId)
//       .query(`
//         SELECT contract_type_rate
//         FROM ContractTypes
//         WHERE contract_type_id = @contractTypeId
//       `);

//     if (contractType.recordset.length === 0) {
//       return res.status(404).json({
//         message: "Contract type not found",
//       });
//     }

//     const rate = contractType.recordset[0].contract_type_rate;

//     // ================== 3. GET CUSTOMER INFO ==================
//     const customer = await pool.request()
//       .input("customerId", customerId)
//       .query(`
//         SELECT customer_fullname, customer_address
//         FROM Customers
//         WHERE customer_id = @customerId
//       `);

//     if (customer.recordset.length === 0) {
//       return res.status(404).json({
//         message: "Customer not found",
//       });
//     }

//     const c = customer.recordset[0];


//     // ================== 4. INSERT CONTRACT ==================
//     await pool.request()
//       .input("customerId", customerId)
//       .input("fullname", c.customer_fullname)
//       .input("address", c.customer_address)
//       .input("phone", userPhone)
//       .input("email", userEmail)
//       .input("contractTypeId", contractTypeId)
//       .input("rate", rate)
//       .query(`
//         INSERT INTO Contracts (
//           contract_customer_id,
//           contract_customer_fullname,
//           contract_customer_address,
//           contract_customer_phone,
//           contract_customer_email,
//           contract_type_id,
//           contract_rate,
//           contract_start_date,
//           contract_end_date,
//           contract_status
//         )
//         VALUES (
//           @customerId,
//           @fullname,
//           @address,
//           @phone,
//           @email,
//           @contractTypeId,
//           @rate,
//           GETDATE(),
//           DATEADD(YEAR, 1, GETDATE()),
//           'ACTIVE'
//         )
//       `);

//     return res.status(201).json({
//       message: "Đăng ký hợp đồng thành công!",
//     });

//   } catch (err) {
//     console.error("REGISTER CONTRACT ERROR:", err);

//     return res.status(500).json({
//       message: "Internal Server Error",
//       error: err.message,
//     });
//   }
// });

router.post("/", verifyToken, async (req, res) => {
  const { userId, userPhone, userEmail, customerId, contractTypeId } = req.body;

  if (!userId || !customerId || !contractTypeId) {
    return res.status(400).json({
      message: "Missing required fields",
    });
  }

  let transaction;

  try {
    const pool = await connectDB();

    transaction = new sql.Transaction(pool);
    await transaction.begin(sql.ISOLATION_LEVEL.SERIALIZABLE);

    // ================== 1. CHECK ACTIVE CONTRACT ==================
    const existingContract = await transaction.request()
      .input("customerId", customerId)
      .query(`
        SELECT TOP 1 *
        FROM Contracts WITH (UPDLOCK, HOLDLOCK)
        WHERE contract_customer_id = @customerId
          AND contract_status = 'ACTIVE'
          AND contract_end_date >= GETDATE()
      `);

    // SLOW
    await new Promise(resolve => setTimeout(resolve, 5000));

    if (existingContract.recordset.length > 0) {
      await transaction.rollback();
      return res.status(409).json({
        message: "Hợp đồng đã được đăng ký ở nơi khác! Hợp đồng cũ vẫn còn hiệu lực!",
      });
    }

    // ================== 2. GET CONTRACT TYPE ==================
    const contractType = await transaction.request()
      .input("contractTypeId", contractTypeId)
      .query(`
        SELECT contract_type_rate
        FROM ContractTypes
        WHERE contract_type_id = @contractTypeId
      `);

    if (!contractType.recordset.length) {
      await transaction.rollback();
      return res.status(404).json({
        message: "Contract type not found",
      });
    }

    const rate = contractType.recordset[0].contract_type_rate;

    // ================== 3. GET CUSTOMER ==================
    const customer = await transaction.request()
      .input("customerId", customerId)
      .query(`
        SELECT customer_fullname, customer_address
        FROM Customers
        WHERE customer_id = @customerId
      `);

    if (!customer.recordset.length) {
      await transaction.rollback();
      return res.status(404).json({
        message: "Customer not found",
      });
    }

    const c = customer.recordset[0];

    // ================== 4. INSERT ==================
    await transaction.request()
      .input("customerId", customerId)
      .input("fullname", c.customer_fullname)
      .input("address", c.customer_address)
      .input("phone", userPhone)
      .input("email", userEmail)
      .input("contractTypeId", contractTypeId)
      .input("rate", rate)
      .query(`
        INSERT INTO Contracts (
          contract_customer_id,
          contract_customer_fullname,
          contract_customer_address,
          contract_customer_phone,
          contract_customer_email,
          contract_type_id,
          contract_rate,
          contract_start_date,
          contract_end_date,
          contract_status
        )
        VALUES (
          @customerId,
          @fullname,
          @address,
          @phone,
          @email,
          @contractTypeId,
          @rate,
          GETDATE(),
          DATEADD(YEAR, 1, GETDATE()),
          'ACTIVE'
        )
      `);

    await transaction.commit();

    return res.status(201).json({
      message: "Đăng ký hợp đồng thành công!",
    });

  } catch (err) {
    console.error("🔥 REGISTER CONTRACT ERROR:", err);

    if (transaction) {
      await transaction.rollback();
    }

    return res.status(500).json({
      message: err.message,
    });
  }
});

module.exports = router;