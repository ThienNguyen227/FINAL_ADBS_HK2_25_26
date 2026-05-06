const express = require("express");
const router = express.Router();

// Routes Customer
const registerRoute = require("./auth-modules/register.module");
const verifyOtpRegisterRoute = require("./auth-modules/verify_otp_register")
const forgotPasswordRoute = require("./auth-modules/forgotpassword.module");
const verifyOtpForgotPasswordRoute = require("./auth-modules/verify_otp_forgot_password")
const resetPasswordRoute = require("./auth-modules/resetpassword.module")
const loginRoute = require("./auth-modules/login.module")
const meRoute = require("./auth-modules/me.module")
const resendOTPRegisterRoute = require("./auth-modules/resend_otp_register.module")
const resendOTPForgotPasswordRoute = require("./auth-modules/resend_otp_forgotpassword.module")
const logOutRoute = require("./auth-modules/logout.module")

// Routes Admin



// API
router.use("/register-request", registerRoute);
router.use("/verify-otp-register-request", verifyOtpRegisterRoute);
router.use("/forgot-password-request", forgotPasswordRoute);
router.use("/verify-otp-forgotpassword-request", verifyOtpForgotPasswordRoute);
router.use("/reset-password-request", resetPasswordRoute);
router.use("/login-request", loginRoute);
router.use("/me-request", meRoute);
router.use("/resend-otp-register-request", resendOTPRegisterRoute);
router.use("/resend-otp-forgotpassword-request", resendOTPForgotPasswordRoute);
router.use("/logout", logOutRoute);

router.use("/admin/accounts", require("./auth-modules/admin/getaccounts.module"));
router.use("/admin/roles", require("./auth-modules/admin/getroles.module"));
router.use("/admin/account-create", require("./auth-modules/admin/createaccount.module"));
router.use("/admin/account-update", require("./auth-modules/admin/updateaccount.module"));
router.use("/admin/account-lock", require("./auth-modules/admin/lockaccount.module"));
router.use("/admin/account-delete", require("./auth-modules/admin/deleteaccount.module"));


router.use("/refresh-token", require("./auth-modules/refreshtoken.module"));




module.exports = router;