const express = require("express");
const router = express.Router();

const getInvoicesRoute = require("./billing-modules/get_invoices.module");

router.use("/invoices", getInvoicesRoute);

module.exports = router;