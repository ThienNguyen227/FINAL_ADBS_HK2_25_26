const app = require("./app");

const PORT = 3003;

app.listen(PORT, () => {
  console.log(`🚀 Billing Server running on http://localhost:${PORT}`);
});