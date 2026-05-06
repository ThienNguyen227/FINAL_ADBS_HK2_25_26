const express = require("express");
const router = express.Router();
const sql = require("mssql");
const bcrypt = require("bcrypt");
const axios = require("axios");
const { connectDB } = require("../../config/db");

// call customer service
const createCustomer = async (userId) => {
  await axios.post("http://localhost:3001/customer/create-customer", {
    customer_user_id: userId
  });
};

router.post("/", async (req, res) => {
  let transaction;

  try {
    const {
      user_name,
      user_phone,
      user_email,
      password,
      user_role_id
    } = req.body;

    const pool = await connectDB();
    transaction = new sql.Transaction(pool);

    await transaction.begin(sql.ISOLATION_LEVEL.READ_COMMITTED);

    const checkRequest = new sql.Request(transaction);

    const check = await checkRequest
      .input("email", sql.VarChar, user_email)
      .input("phone", sql.VarChar, user_phone)
      .query(`
        SELECT TOP 1 user_id 
        FROM Users WITH (UPDLOCK, HOLDLOCK)
        WHERE user_email = @email OR user_phone = @phone
      `);

    if (check.recordset.length > 0) {
      await transaction.rollback();

      return res.status(400).json({
        message: "Tài khoản đăng được đăng ký ở nơi khác!"
      });
    }

    await new Promise(resolve => setTimeout(resolve, 5000));

    const insertRequest = new sql.Request(transaction);

    const result = await insertRequest
      .input("name", sql.NVarChar, user_name)
      .input("phone", sql.VarChar, user_phone)
      .input("email", sql.VarChar, user_email)
      .input("password", sql.NVarChar, password)
      .input("role", sql.Int, user_role_id)
      .query(`
        INSERT INTO Users
        (
          user_name,
          user_phone,
          user_email,
          user_password_hash,
          user_role_id
        )
        OUTPUT INSERTED.user_id
        VALUES
        (
          @name,
          @phone,
          @email,
          @password,
          @role
        )
      `);

    const userId = result.recordset[0].user_id;

    await createCustomer(userId);

    await transaction.commit();

    return res.status(201).json({
      message: "Tạo tài khoản thành công",
      userId
    });

  } catch (err) {
    if (transaction) {
      try {
        await transaction.rollback();
      } catch (_) {}
    }

    // DEADLOCK
    if (err.number === 1205) {
      return res.status(409).json({
        message: "Tài khoản đang được đăng ký ở nơi khác, vui lòng thử lại"
      });
    }

    return res.status(500).json({
      message: err.message
    });
  }
});

module.exports = router;