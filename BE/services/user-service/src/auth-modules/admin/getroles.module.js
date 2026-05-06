const express = require("express");
const router = express.Router();
const { connectDB } = require("../../config/db");

router.get("/", async (req, res) => {
  try {
    const pool = await connectDB();

    const result = await pool.request().query(`
      SELECT
        role_id,
        role_name
      FROM User_Roles
      ORDER BY role_id
    `);

    res.status(200).json({
      roles: result.recordset
    });

  } catch (err) {
    res.status(500).json({
      message: err.message
    });
  }
});

module.exports = router;