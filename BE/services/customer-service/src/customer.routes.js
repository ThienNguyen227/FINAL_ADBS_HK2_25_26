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

// 7.
const invoiceInforRoute = require("./customer-modules/get_customer_contract_id.module");

// 8.
const checkContractRoute = require("./customer-modules/check-contract.module");



// 9.
const updateOfflineStatusRoute = require("./customer-modules/update_offline_status.module");

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

// 7.
router.use("/customer-contract-id", invoiceInforRoute);

// 8.
router.use("/check-contract", checkContractRoute);





// 9.
router.use("/update-offline-status", updateOfflineStatusRoute);

// 10.
const updateOnlineStatusRoute = require("./customer-modules/update_online_status.module");
router.use("/update-online-status", updateOnlineStatusRoute);

router.use("/admin/customers", require("./customer-modules/admin/getcustomers.module"));
router.use("/admin/customer-update", require("./customer-modules/admin/updatecustomer.module"));

router.use("/admin/contracts", require("./customer-modules/admin/getcontracts.module"));
router.use("/admin/contract-update", require("./customer-modules/admin/updatecontract.module"));

module.exports = router;