const express = require("express");
const router = express.Router();

const getInvoicesRoute = require("./billing-modules/get_invoices.module");
const generateInvoicesRoute = require("./billing-modules/generate_invoices.module");

router.use("/invoices", getInvoicesRoute);
router.use("/generates", generateInvoicesRoute);



module.exports = router;