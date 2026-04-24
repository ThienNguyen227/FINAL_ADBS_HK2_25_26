require("dotenv").config();
const nodemailer = require("nodemailer");

// ================== TRANSPORTER (tạo 1 lần) ==================
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS, 
  },
});

// Test kết nối
transporter.verify((err, success) => {
  if (err) {
    console.error("SMTP lỗi:", err);
  } else {
    console.log("SMTP sẵn sàng gửi mail");
  }
});

// ================== GENERATE OTP ==================
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// ================== SEND EMAIL ==================
const sendOTPEmail = async (to, otp, subject, text) => {
  try {
    const info = await transporter.sendMail({
      from: `"EVN System" <${process.env.EMAIL_USER}>`,
      to,
      subject: subject || "Mã OTP", 
      text: text || `Mã OTP của bạn là: ${otp}. Có hiệu lực trong 2 phút.`,
    });

    console.log("Đã gửi mail:", info.response);
    return true;
  } catch (error) {
    console.error("Lỗi gửi mail:", error);
    return false;
  }
};

module.exports = {
  generateOTP,
  sendOTPEmail,
};