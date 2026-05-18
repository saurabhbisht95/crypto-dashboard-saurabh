import React, { useState } from "react";
import "../Login/styles.css";
import { Link } from "react-router-dom";
import { FiUserPlus } from "react-icons/fi";
import { motion } from "framer-motion";

import gradient from "../../assets/gradient.png";
import iphone from "../../assets/iphone.png";

const isValidEmail = (email) => /\S+@\S+\.\S+/.test(email);

function Signup() {
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState("");

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((currentForm) => ({ ...currentForm, [name]: value }));
    setErrors((currentErrors) => ({ ...currentErrors, [name]: "" }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    const nextErrors = {};

    if (form.name.trim().length < 2) {
      nextErrors.name = "Enter your full name.";
    }

    if (!isValidEmail(form.email.trim())) {
      nextErrors.email = "Enter a valid email address.";
    }

    if (form.password.length < 8) {
      nextErrors.password = "Use at least 8 characters.";
    }

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length) {
      setStatus("");
      return;
    }

    setStatus(
      "Signup needs a secure backend before real accounts can be created. Your password was not stored."
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
            <h2 className="auth-title">Create Account</h2>
            <form className="auth-form" onSubmit={handleSubmit} noValidate>
              <label htmlFor="signup-name">Full Name</label>
              <input
                id="signup-name"
                name="name"
                type="text"
                className="input"
                placeholder="Enter your full name"
                value={form.name}
                onChange={handleChange}
                aria-invalid={Boolean(errors.name)}
              />
              {errors.name && <span className="auth-error">{errors.name}</span>}

              <label htmlFor="signup-email">Email</label>
              <input
                id="signup-email"
                name="email"
                type="email"
                className="input"
                placeholder="Enter your email"
                value={form.email}
                onChange={handleChange}
                aria-invalid={Boolean(errors.email)}
              />
              {errors.email && <span className="auth-error">{errors.email}</span>}

              <label htmlFor="signup-password">Password</label>
              <input
                id="signup-password"
                name="password"
                type="password"
                className="input"
                placeholder="Enter your password"
                value={form.password}
                onChange={handleChange}
                aria-invalid={Boolean(errors.password)}
              />
              {errors.password && (
                <span className="auth-error">{errors.password}</span>
              )}

              <button type="submit" className="btn-primary">
                <FiUserPlus size={18} /> Sign Up
              </button>
            </form>
            {status && (
              <div className="auth-alert">
                <p>{status}</p>
                <Link to="/dashboard">Continue to Dashboard</Link>
              </div>
            )}
            <p>
              Already have an account?{" "}
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

export default Signup;
