import { motion } from "motion/react";
import { useEffect, useRef, useState } from "react";

const CORRECT_OTP = "123456";

function OTPInput() {
  const [digits, setDigits] = useState(["", "", "", "", "", ""]);
  const [focusedIndex, setFocusedIndex] = useState(0);
  const [status, setStatus] = useState("idle"); // idle, error, success
  const [iconType, setIconType] = useState("email");
  const inputRefs = useRef([]);

  useEffect(() => {
    if (inputRefs.current[focusedIndex]) {
      inputRefs.current[focusedIndex].focus();
    }
  }, [focusedIndex]);

  const handleInput = (index, value) => {
    // Only allow single digit numbers
    if (!/^\d$/.test(value) && value !== "") return;

    const newDigits = [...digits];
    newDigits[index] = value;
    setDigits(newDigits);

    if (value && index < 5) {
      setFocusedIndex(index + 1);
    }

    // Check if all 6 digits are entered
    if (index === 5 && value) {
      const otp = newDigits.join("");
      validateOTP(otp);
    }
  };

  const handleEnterIncorrectOTPError = () => {
    setStatus("error");

    // Keep focus at the end initially, then move back to start
    setTimeout(() => {
      setDigits(["", "", "", "", "", ""]);
      setFocusedIndex(0);
      setTimeout(() => {
        setStatus("idle");
      }, 100);
    }, 600);
  };

  const validateOTP = (otp) => {
    if (otp === CORRECT_OTP) {
      setStatus("success");
      setIconType("lock");
    } else {
      handleEnterIncorrectOTPError();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace") {
      e.preventDefault();
      const newDigits = [...digits];

      if (digits[index]) {
        // Clear current digit
        newDigits[index] = "";
        setDigits(newDigits);
      } else if (index > 0) {
        // Move to previous input and clear it
        newDigits[index - 1] = "";
        setDigits(newDigits);
        setFocusedIndex(index - 1);
      }
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text");
    const pastedDigits = pastedData.replace(/\D/g, "").slice(0, 6).split("");

    const newDigits = [...digits];
    pastedDigits.forEach((digit, idx) => {
      if (idx < 6) newDigits[idx] = digit;
    });
    setDigits(newDigits);

    if (pastedDigits.length === 6) {
      const otp = newDigits.join("");
      validateOTP(otp);
    } else if (pastedDigits.length > 0) {
      setFocusedIndex(Math.min(pastedDigits.length, 5));
    }
  };

  const getInputClassName = () => {
    if (status === "error") return "otp-input error";
    if (status === "success") return "otp-input success";
    return "otp-input";
  };

  return (
    <div className="container">
      <motion.div
        className={`icon-container ${status === "success" ? "success" : ""}`}
        animate={
          status === "success"
            ? {
                scale: [1, 1.2, 1],
                rotate: [0, 10, -10, 0],
              }
            : {}
        }
        transition={{ duration: 0.5 }}
      >
        <motion.div
          className="icon"
          key={iconType}
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 15 }}
        >
          {iconType === "email" ? "✉️" : "🔒"}
        </motion.div>
      </motion.div>

      <div className="header">
        <h1>One Time Password</h1>
        <p>Please enter the 6-digit code sent to your email</p>
      </div>

      <div className="otp-form">
        <motion.div
          className="otp-inputs"
          animate={
            status === "error"
              ? {
                  x: [0, -10, 10, -10, 10, 0],
                }
              : {}
          }
          transition={{ duration: 0.4 }}
        >
          {digits.map((digit, index) => (
            <div key={index} className="otp-input-wrapper">
              <input
                ref={(el) => (inputRefs.current[index] = el)}
                type="text"
                inputMode="numeric"
                maxLength="1"
                className={`${getInputClassName()} ${
                  focusedIndex === index ? "focused" : ""
                }`}
                value={digit}
                onChange={(e) => handleInput(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onPaste={handlePaste}
                onFocus={() => setFocusedIndex(index)}
              />
              {digit && (
                <motion.div
                  className="otp-digit"
                  key={`${index}-${digit}`}
                  initial={{ y: 20, scale: 0.5, opacity: 0 }}
                  animate={{ y: 0, scale: 1, opacity: 1 }}
                  transition={{
                    type: "spring",
                    stiffness: 300,
                    damping: 20,
                  }}
                >
                  {digit}
                </motion.div>
              )}
            </div>
          ))}
        </motion.div>

        <div className={`status-message ${status}`}>
          {status === "error" && "❌ Incorrect code. Please try again."}
          {status === "success" && "✅ Verification successful!"}
        </div>
      </div>
    </div>
  );
}

export default OTPInput;
