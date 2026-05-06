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
    
    // Update trạng thái thành ONLINE dựa trên customer_user_id
    await pool.request()
      .input('user_id', sql.Int, user_id)
      .query(`
        UPDATE Customers 
        SET customer_status = 'ONLINE' 
        WHERE customer_user_id = @user_id
      `);

    res.status(200).json({ success: true, message: "Updated customer status to ONLINE" });
  } catch (error) {
    console.error("Update online status error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
