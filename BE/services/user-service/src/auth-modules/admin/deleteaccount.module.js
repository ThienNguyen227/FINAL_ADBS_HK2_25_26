const express = require("express");
const router = express.Router();
const { connectDB } = require("../../config/db");

router.delete("/:id", async (req, res) => {
  try {
    const pool = await connectDB();

    await pool.request()
      .input("id", req.params.id)
      .query(`
        DELETE FROM Users
        WHERE user_id = @id
      `);

    res.status(200).json({
      message: "Xóa thành công"
    });

  } catch (err) {
    res.status(500).json({
      message: err.message
    });
  }
});

module.exports = router;