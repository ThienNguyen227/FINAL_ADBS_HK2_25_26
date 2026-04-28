const express = require("express");
const router = express.Router();
const { sql, connectDB } = require("../config/db");
const jwt = require("jsonwebtoken");
require("dotenv").config();

// ================== VERIFY TOKEN ==================
const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({
      message: "No token provided",
    });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    req.user = decoded; // { userId: ... }
    next();
  } catch (err) {
    return res.status(401).json({
      message: "Invalid or expired token",
    });
  }
};

// ================== CANCEL CONTRACT ==================
// router.put("/", verifyToken, async (req, res) => {
//   try {
//     const pool = await connectDB();

//     const { contract_id } = req.body;

//     // ===== VALIDATE =====
//     if (!contract_id) {
//       return res.status(400).json({
//         message: "contract_id is required",
//       });
//     }

//     // ===== CHECK CONTRACT EXISTS =====
//     const checkResult = await pool.request()
//       .input("contract_id", contract_id)
//       .query(`
//         SELECT contract_id, contract_status
//         FROM Contracts
//         WHERE contract_id = @contract_id
//       `);

//     const contract = checkResult.recordset[0];

//     if (!contract) {
//       return res.status(404).json({
//         message: "Contract not found",
//       });
//     }

//     // ===== BUSINESS RULE =====
//     if (contract.contract_status === "TERMINATED") {
//       return res.status(400).json({
//         message: "Contract already terminated",
//       });
//     }

//     // ===== UPDATE STATUS =====
//     await pool.request()
//       .input("contract_id", contract_id)
//       .query(`
//         UPDATE Contracts
//         SET 
//           contract_status = 'TERMINATED',
//           contract_updated_at = GETDATE()
//         WHERE contract_id = @contract_id
//       `);

//     // ===== GET UPDATED LIST (optional but tiện FE) =====
//     const result = await pool.request()
//       .query(`
//         SELECT *
//         FROM Contracts
//         ORDER BY contract_id DESC
//       `);

//     return res.status(200).json({
//       message: "Cancel contract successful",
//       contracts: result.recordset,
//     });

//   } catch (err) {
//     console.error(err);
//     return res.status(500).json({
//       message: "Internal Server Error",
//       error: err.message,
//     });
//   }
// });

// module.exports = router;

router.put("/", verifyToken, async (req, res) => {
  let transaction;

  try {
    const pool = await connectDB();
    const { contract_id } = req.body;

    if (!contract_id) {
      return res.status(400).json({
        message: "contract_id is required",
      });
    }

    // ================== TRANSACTION ==================
    transaction = new sql.Transaction(pool);
    await transaction.begin(sql.ISOLATION_LEVEL.SERIALIZABLE);

    // ================== 1. LOCK + CHECK CONTRACT ==================
    const checkResult = await transaction.request()
      .input("contract_id", contract_id)
      .query(`
        SELECT contract_id, contract_status
        FROM Contracts WITH (UPDLOCK, HOLDLOCK)
        WHERE contract_id = @contract_id
      `);

    await new Promise(resolve => setTimeout(resolve, 5000));

    const contract = checkResult.recordset[0];

    if (!contract) {
      await transaction.rollback();
      return res.status(404).json({
        message: "Contract not found",
      });
    }

    // ================== 2. BUSINESS RULE ==================
    if (contract.contract_status === "TERMINATED") {
      await transaction.rollback();
      return res.status(400).json({
        message: "Hợp đồng đã được hủy!",
      });
    }

    if (contract.contract_status === "EXPIRED") {
      await transaction.rollback();
      return res.status(400).json({
        message: "Contract already expired",
      });
    }

    // ================== 3. UPDATE ==================
    await transaction.request()
      .input("contract_id", contract_id)
      .query(`
        UPDATE Contracts
        SET 
          contract_status = 'TERMINATED',
          contract_updated_at = GETDATE()
        WHERE contract_id = @contract_id
      `);

    // ================== COMMIT ==================
    await transaction.commit();

    // ================== 4. RETURN UPDATED LIST ==================
    const result = await pool.request()
      .query(`
        SELECT *
        FROM Contracts
        ORDER BY contract_id DESC
      `);

    return res.status(200).json({
      message: "Cancel contract successful",
      contracts: result.recordset,
    });

  } catch (err) {
    console.error("CANCEL CONTRACT ERROR:", err);

    if (transaction) {
      await transaction.rollback();
    }

    return res.status(500).json({
      message: "Internal Server Error",
      error: err.message,
    });
  }
});

module.exports = router;