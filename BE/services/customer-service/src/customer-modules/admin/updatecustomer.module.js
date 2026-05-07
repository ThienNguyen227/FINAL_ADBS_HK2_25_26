// const express = require("express");
// const router = express.Router();
// const { sql, connectDB } = require("../../config/db");

// router.put("/", async (req, res) => {
//   const pool = await connectDB();
//   const transaction = pool.transaction();

//   try {
//     const {
//       customer_id,
//       customer_fullname,
//       customer_address,
//       customer_priority
//     } = req.body;

//     if (!customer_id) {
//       return res.status(400).json({
//         message: "customer_id is required"
//       });
//     }

//     await transaction.begin();

//     const request = transaction.request(sql.ISOLATION_LEVEL.REPEATABLE_READ);

//     const result = await request
//       .input("customer_id", customer_id)
//       .input("customer_fullname", customer_fullname)
//       .input("customer_address", customer_address)
//       .input("customer_priority", customer_priority)
//       .query(`
//         UPDATE Customers
//         SET 
//           customer_fullname = @customer_fullname,
//           customer_address = @customer_address,
//           customer_priority = @customer_priority,
//           customer_updated_at = GETDATE()
//         WHERE customer_id = @customer_id;

//         SELECT * FROM Customers WHERE customer_id = @customer_id;

//       `);

//     await new Promise(resolve => setTimeout(resolve, 5000));

//     await transaction.commit();

//     return res.status(200).json({
//       message: "Cập nhật khách hàng thành công",
//       customer: result.recordset[0]
//     });

//   } catch (err) {
//     try {
//       await transaction.rollback();
//     } catch (e) {}

//     return res.status(500).json({
//       message: "Internal Server Error",
//       error: err.message
//     });
//   }
// });

// module.exports = router;

const express = require("express");
const router = express.Router();
const { sql, connectDB } = require("../../config/db");

router.put("/", async (req, res) => {
  let transaction;

  try {
    const {
      customer_id,
      customer_fullname,
      customer_address,
      customer_priority
    } = req.body;

    if (!customer_id) {
      return res.status(400).json({
        message: "customer_id is required"
      });
    }

    const pool = await connectDB();
    transaction = new sql.Transaction(pool);

    await transaction.begin(sql.ISOLATION_LEVEL.REPEATABLE_READ);

    // 🔥 LOCK ROW (fail ngay nếu bị lock bởi transaction khác)
    await new sql.Request(transaction)
      .input("customer_id", customer_id)
      .query(`
        SELECT 1
        FROM Customers WITH (UPDLOCK, HOLDLOCK, NOWAIT)
        WHERE customer_id = @customer_id;
      `);

    // 🔥 simulate race condition
    await new Promise(resolve => setTimeout(resolve, 5000));

    // 🔥 UPDATE
    const result = await new sql.Request(transaction)
      .input("customer_id", customer_id)
      .input("customer_fullname", customer_fullname)
      .input("customer_address", customer_address)
      .input("customer_priority", customer_priority)
      .query(`
        UPDATE Customers
        SET 
          customer_fullname = @customer_fullname,
          customer_address = @customer_address,
          customer_priority = @customer_priority,
          customer_updated_at = GETDATE()
        WHERE customer_id = @customer_id;

        SELECT * FROM Customers WHERE customer_id = @customer_id;
      `);

    await transaction.commit();

    return res.status(200).json({
      message: "Cập nhật khách hàng thành công",
      customer: result.recordset[0]
    });

  } catch (err) {
    if (transaction) {
      try {
        await transaction.rollback();
      } catch (_) {}
    }

    // 🔥 bị lock bởi request khác
    if (err.number === 1222) {
      return res.status(409).json({
        message: "Khách hàng đang được cập nhật ở nơi khác"
      });
    }

    return res.status(500).json({
      message: "Internal Server Error",
      error: err.message
    });
  }
});

module.exports = router;