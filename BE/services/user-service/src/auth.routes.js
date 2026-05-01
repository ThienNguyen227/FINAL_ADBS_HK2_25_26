const express = require("express");
const router = express.Router();

// Routes
const registerRoute = require("./auth-modules/register.module");
const verifyOtpRegisterRoute = require("./auth-modules/verify_otp_register")
const forgotPasswordRoute = require("./auth-modules/forgotpassword.module");
const verifyOtpForgotPasswordRoute = require("./auth-modules/verify_otp_forgot_password")
const resetPasswordRoute = require("./auth-modules/resetpassword.module")
const loginRoute = require("./auth-modules/login.module")
const meRoute = require("./auth-modules/me.module")
const resendOTPRegisterRoute = require("./auth-modules/resend_otp_register.module")
const logOutRoute = require("./auth-modules/logout.module")

// API
router.use("/register-request", registerRoute);
router.use("/verify-otp-register-request", verifyOtpRegisterRoute);
router.use("/forgot-password-request", forgotPasswordRoute);
router.use("/verify-otp-forgotpassword-request", verifyOtpForgotPasswordRoute);
router.use("/reset-password-request", resetPasswordRoute);
router.use("/login-request", loginRoute);
router.use("/me-request", meRoute);
router.use("/resend-otp-register-request", resendOTPRegisterRoute);
router.use("/logout", logOutRoute);
module.exports = router;