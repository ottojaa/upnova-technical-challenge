import { LockIcon, MailIcon } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";

const CORRECT_OTP = "123456";

function OTPInput() {
  const [digits, setDigits] = useState(["", "", "", "", "", ""]);
  const [focusedIndex, setFocusedIndex] = useState(0);
  const [outlineIndex, setOutlineIndex] = useState(0);
  const [status, setStatus] = useState("idle"); // idle, error, success
  const [iconType, setIconType] = useState("email");
  const inputRefs = useRef([]);

  useEffect(() => {
    if (inputRefs.current[focusedIndex]) {
      inputRefs.current[focusedIndex].focus();
    }
  }, [focusedIndex]);

  // Sync outline with focus during normal operation
  useEffect(() => {
    if (status === "idle" || status === "success") {
      setOutlineIndex(focusedIndex);
    }
  }, [focusedIndex, status]);

  const handleInput = (index, value) => {
    // Only allow single digit numbers
    if (!/^\d$/.test(value) && value !== "") return;

    // Reset status if we're modifying after success
    if (status === "success") {
      setStatus("idle");
      setIconType("email");
    }

    if (status === "error") {
      setStatus("idle");
      setIconType("email");
    }

    const newDigits = [...digits];
    newDigits[index] = value;
    setDigits(newDigits);

    if (value && index < 5) {
      setFocusedIndex(index + 1);
    }

    // Check if all 6 digits are entered
    if (value && newDigits.every((digit) => digit !== "")) {
      const otp = newDigits.join("");
      validateOTP(otp);
    }
  };

  const handleEnterIncorrectOTPError = async () => {
    setStatus("error");

    // Wait for shake animation
    await new Promise((r) => setTimeout(r, 500));

    // Clear digits and reset
    setDigits(["", "", "", "", "", ""]);
    setFocusedIndex(0);
    setOutlineIndex(0);
  };

  const handleFocus = (index) => {
    setFocusedIndex(index);
    setOutlineIndex(index);
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

      // Reset status if we're modifying after success
      if (status === "success") {
        setStatus("idle");
        setIconType("email");
      }

      const newDigits = [...digits];

      if (digits[index]) {
        newDigits[index] = "";
        setDigits(newDigits);
      } else if (index > 0) {
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
                scaleY: [1, 0.7, 1],
                scaleX: [1, 1.15, 1],
              }
            : {}
        }
        transition={{
          scaleY: {
            duration: 0.3,
            ease: [0.8, 1.26, 0.64, 1],
            times: [0, 0.25, 1],
          },
          scaleX: {
            duration: 0.3,
            ease: [0.7, 1.26, 0.64, 1],
            times: [0, 0.45, 1], // lags behind by 0.1
          },
        }}
      >
        <motion.div
          className="icon"
          key={iconType}
          transition={{ type: "spring", stiffness: 200, damping: 15 }}
        >
          {iconType === "email" ? (
            <MailIcon size={36} />
          ) : (
            <LockIcon size={36} />
          )}
        </motion.div>
      </motion.div>

      <div className="header">
        <h2>We've emailed you a verification code.</h2>
        <p>Please enter the code we sent you below.</p>
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
              {/* Animated outline using layoutId */}
              {status !== "success" && outlineIndex === index && (
                <motion.div
                  layoutId="otp-outline"
                  className={`otp-outline ${status === "error" ? "error" : ""}`}
                  transition={
                    status === "error"
                      ? { type: "spring", stiffness: 300, damping: 30 }
                      : { duration: 0.12, ease: "easeInOut" }
                  }
                />
              )}
              <input
                ref={(el) => (inputRefs.current[index] = el)}
                type="text"
                inputMode="numeric"
                maxLength="1"
                className={getInputClassName()}
                value={digit}
                onChange={(e) => handleInput(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onPaste={handlePaste}
                onFocus={() => handleFocus(index)}
              />
              {!digit && <div className="otp-placeholder">0</div>}

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

        <div className="footer-container">
          <AnimatePresence mode="popLayout">
            {status === "error" && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="error-message"
              >
                Incorrect validation code
              </motion.div>
            )}
          </AnimatePresence>
          <motion.div
            variants={{
              error: { y: 20 },
              success: { y: 0 },
            }}
            animate={status}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="resend-link"
          >
            Didn't receive a code? <b>Resend</b>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

export default OTPInput;
