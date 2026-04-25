require("dotenv").config();

const authMode = (process.env.DB_AUTH_MODE || "sql").toLowerCase();
const useWindowsAuth = authMode === "windows";
const sql = useWindowsAuth ? require("mssql/msnodesqlv8") : require("mssql");

const rawServer = process.env.DB_SERVER || "localhost";
const serverParts = rawServer.split(/\\+/).filter(Boolean);
const serverName = serverParts[0] || "localhost";
const instanceName = serverParts[1];
const dbPort = Number(process.env.DB_PORT || 1433);

const options = {
  encrypt: String(process.env.DB_ENCRYPT || "false").toLowerCase() === "true",
  trustServerCertificate: true,
};

if (instanceName) {
  options.instanceName = instanceName;
}

const config = {
  server: serverName,
  database: process.env.DB_DATABASE,
  options,
};

if (!instanceName) {
  config.port = dbPort;
}

if (useWindowsAuth) {
  config.driver = "msnodesqlv8";
  config.options.trustedConnection = true;
} else {
  config.user = process.env.DB_USER;
  config.password = process.env.DB_PASSWORD;
}

let poolPromise;

async function connectDB() {
  if (poolPromise) {
    return await poolPromise;
  }
  try {
    poolPromise = sql.connect(config).then(pool => {
      console.log("✅ Connected to SQL Server successfully!");
      return pool;
    });
    return await poolPromise;
  } catch (err) {
    poolPromise = null;
    console.log("❌ DB Connection Failed:", err.message);
    throw err;
  }
}

module.exports = { sql, connectDB };