const express = require("express");
const router = express.Router();


const createCustomerRoute = require("./customer-modules/createcustomer.module");



router.use("/create-customer", createCustomerRoute);



module.exports = router;