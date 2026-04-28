const express = require("express");
const router = express.Router();

// . Create new customer after register successfully.
const createCustomerRoute = require("./customer-modules/createcustomer.module");

// 1. Get for more information for customer at /myinformation page
const getMoreInformationRoute = require("./customer-modules/getmoreinformation.module");

// 2. 
const updateCustomerInformationRoute = require("./customer-modules/updatecustomerinfomation.module");

// 3. 
const getContractTypeRoute = require("./customer-modules/getcontracttype.module");

// 4. 
const registerContractRoute = require("./customer-modules/registercontract.module");

// 5. 
const getContractRoute = require("./customer-modules/getcontract.module");

// 6. 
const cancelContractRoute = require("./customer-modules/cancelcontract.module");



// .
router.use("/create-customer", createCustomerRoute);

// 1.
router.use("/get-more-information", getMoreInformationRoute);

// 2.
router.use("/update-information", updateCustomerInformationRoute);

// 3.
router.use("/get-contract-type", getContractTypeRoute);

// 4.
router.use("/register-contract", registerContractRoute);

// 5.
router.use("/get-contract", getContractRoute);

// 6.
router.use("/cancel-contract", cancelContractRoute);








module.exports = router;