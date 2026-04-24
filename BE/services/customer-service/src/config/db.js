const sql = require("mssql");
require("dotenv").config();

const config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: "localhost",
  port: 1433,
  database: process.env.DB_DATABASE,
  options: {
    encrypt: false,
    trustServerCertificate: true,
  },
};

async function connectDB() {
  try {
    const pool = await sql.connect(config);
    console.log("✅ Connected to SQL Server successfully!");
    return pool;
  } catch (err) {
    console.log("❌ DB Connection Failed:", err.message);
    throw err;
  }
}

module.exports = { sql, connectDB };