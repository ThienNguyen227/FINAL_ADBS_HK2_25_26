import { useLocation } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import { useAuth } from "../../hooks/useAuth"; 
import { useNavigate } from "react-router-dom";
import "../../styles/VerifyOTP.css";

const VerifyOTP = () => {
  const navigate = useNavigate();

  const location = useLocation();

  const { type, name, phone, email, password } = location.state;

  const { verifyOTP, verifyOTPForgotPassword, loading, error, success, resendRegisterOTP } = useAuth(); 

  const [otp, setOtp] = useState(new Array(6).fill(""));

  const [timeLeft, setTimeLeft] = useState(10); 

  const inputsRef = useRef([]);

  // ⏳ Countdown
  useEffect(() => {
    if (timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  const handleChange = (value, index) => {
    if (!/^[0-9]?$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      inputsRef.current[index + 1].focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputsRef.current[index - 1].focus();
    }
  };

  // Comfirm OTP
  const handleVerify = async () => {
    const finalOTP = otp.join("");

    if (finalOTP.length < 6) {
      alert("Vui lòng nhập đủ 6 số OTP");
      return;
    }

    let res;

    if (type === "REGISTER") {
      res = await verifyOTP({
        name,
        phone,
        email,
        password,
        otp: finalOTP,
      });
    } else if (type === "FORGOT_PASSWORD") {
      res = await verifyOTPForgotPassword({
        email,
        otp: finalOTP,
      });
    }

    if (!res?.error) {
        setTimeout(() => {
        if (type === "REGISTER") {
          navigate("/login");
        } else if (type === "FORGOT_PASSWORD") {
          navigate("/reset-password", {
            state: { email } 
          });
        }
      }, 2000);
    }

  };
  // Resend OTP
  const handleResend = async () => {
  setTimeLeft(120);
  setOtp(new Array(6).fill(""));

  try {
    if (type === "REGISTER") {
      await resendRegisterOTP({ email });
    }

    // if (type === "FORGOT_PASSWORD") {
    //   await resendForgotPasswordOTP({ email });
    // }

  } catch (err) {
    console.error(err);
  }
};

  const formatTime = () => {
    const m = Math.floor(timeLeft / 60);
    const s = timeLeft % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  return (
    <div className="otp-container">
      <div className="otp-card">
        <h2>Nhập OTP</h2>
        <p className="otp-email">{email}</p>

        <div className="otp-inputs">
          {otp.map((digit, index) => (
            <input
              key={index}
              value={digit}
              maxLength={1}
              ref={(el) => (inputsRef.current[index] = el)}
              onChange={(e) => handleChange(e.target.value, index)}
              onKeyDown={(e) => handleKeyDown(e, index)}
            />
          ))}
        </div>

        <div className="otp-timer">
          Thời gian còn lại: {formatTime()}
        </div>

        {/* ✅ loading + disable */}
        {timeLeft > 0 ? (
          <button
            className="otp-btn"
            onClick={handleVerify}
            disabled={loading}
          >
            {loading ? "Đang thực hiện ..." : "Xác nhận"}
          </button>
        ) : (
          <button className="otp-btn resend-btn" onClick={handleResend} disabled={loading}>
            {loading ? "Đang thực hiện ..." : "Gửi lại OTP"}
          </button>
        )}

        {/* ✅ show error */}
        {error && <p style={{ color: "red" }}>{error}</p>}
        {success && <p style={{ color: "green" }}>{success}</p>}
      </div>
    </div>
  );
};

export default VerifyOTP;