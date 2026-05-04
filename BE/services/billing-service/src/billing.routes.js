const express = require("express");
const router = express.Router();

const getInvoicesRoute = require("./billing-modules/get_invoices.module");
const createPaymentRoute = require("./billing-modules/create_payment.module");
const getResultPaymentRoute = require("./billing-modules/get_result_payment.module");

router.use("/invoices", getInvoicesRoute);
router.use("/payments", createPaymentRoute);
router.use("/ipn", getResultPaymentRoute);

module.exports = router;