const express = require("express");
const router = express.Router();
const { connectDB } = require("../config/db");


// ================== REPOSITORY ==================
const checkCustomerExist = async (customer_user_id) => {
  const pool = await connectDB();
  const result = await pool.request()
    .input("customer_user_id", customer_user_id)
    .query(`
      SELECT customer_user_id FROM Customers WHERE customer_user_id = @customer_user_id
    `);

  return result.recordset[0];
};

const createCustomer = async (customer_user_id) => {
  const pool = await connectDB();

  await pool.request()
    .input("customer_user_id", customer_user_id)
    .query(`
      INSERT INTO Customers (customer_user_id, customer_updated_at)
      VALUES (@customer_user_id, GETDATE())
    `);
};
// ================== SERVICE ==================

const createCustomerService = async (data) => {
  const existingCustomer = await checkCustomerExist(data.customer_user_id.user_id);
  if (existingCustomer) return { error: "EXISTING_CUSTOMER" };

  await createCustomer(data.customer_user_id.user_id);

  return { message: "CREATE_CUSTOMER_SUCCESSFULLY" };
};

// ================== CONTROLLER ==================

router.post("/", async (req, res) => { // Nhận "customer_user_id": 
  try {
    const result = await createCustomerService(req.body);

    if (result.error === "EXISTING_CUSTOMER") {
      return res.status(400).json({ message: "Khách hàng đã tồn tại!" });
    }

    return res.status(200).json({ message: "Tạo khách hàng mới thành công!" });

  } catch (err) {
    console.error(err);
    return res.status(500).json({
      message: "Internal Server Error",
      error: err.message,
    });
  }
});

module.exports = router;