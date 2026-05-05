const express = require("express");
const router = express.Router();
const { sql, connectDB } = require("../config/db");

router.post("/", async (req, res) => {
  try {
    const { user_id } = req.body;
    
    if (!user_id) {
      return res.status(400).json({ success: false, message: "Missing user_id" });
    }

    const pool = await connectDB();
    
    // Tìm customer_id từ user_id
    const customerResult = await pool.request()
      .input('user_id', sql.Int, user_id)
      .query(`SELECT customer_id FROM Customers WHERE customer_user_id = @user_id`);
      
    if (customerResult.recordset.length === 0) {
      return res.status(404).json({ success: false, message: "Customer not found" });
    }
    
    const customer_id = customerResult.recordset[0].customer_id;

    // Update trạng thái
    await pool.request()
      .input('customer_id', sql.Int, customer_id)
      .query(`
        UPDATE Customers 
        SET customer_status = 'OFFLINE_DETECTED' 
        WHERE customer_id = @customer_id
      `);

    res.status(200).json({ success: true, message: "Updated customer status to OFFLINE_DETECTED" });
  } catch (error) {
    console.error("Update offline status error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
