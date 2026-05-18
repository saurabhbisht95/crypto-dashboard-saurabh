import React, { useState } from "react";
import { Link } from "react-router-dom";
import { FiMail } from "react-icons/fi";
import { motion } from "framer-motion";
import "./Login/styles.css";

import gradient from "../assets/gradient.png";
import iphone from "../assets/iphone.png";

const isValidEmail = (email) => /\S+@\S+\.\S+/.test(email);

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!isValidEmail(email.trim())) {
      setError("Enter a valid email address.");
      setStatus("");
      return;
    }

    setError("");
    setStatus(
      "Password reset email service is not connected yet. Your email was not sent or stored."
    );
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-layout">
        <div className="auth-image-container">
          <div className="iphone-stack">
            <img src={gradient} alt="" className="gradient-background" />
            <motion.img
              src={iphone}
              alt="CryptoTracker dashboard preview"
              className="floating-iphone"
              initial={{ y: -10 }}
              animate={{ y: 10 }}
              transition={{
                type: "smooth",
                repeatType: "mirror",
                duration: 2,
                repeat: Infinity,
              }}
            />
          </div>
        </div>

        <div className="auth-container">
          <div className="auth-card">
            <h2 className="auth-title">Reset Password</h2>
            <form className="auth-form" onSubmit={handleSubmit} noValidate>
              <label htmlFor="forgot-email">Email</label>
              <input
                id="forgot-email"
                type="email"
                className="input"
                placeholder="Enter your email"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                  setError("");
                }}
                aria-invalid={Boolean(error)}
              />
              {error && <span className="auth-error">{error}</span>}

              <button type="submit" className="btn-primary">
                <FiMail size={18} /> Send Reset Link
              </button>
            </form>
            {status && (
              <div className="auth-alert">
                <p>{status}</p>
                <Link to="/login">Back to Login</Link>
              </div>
            )}
            <p>
              Remembered your password?{" "}
              <Link to="/login" className="sign-up">
                Login
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ForgotPassword;
