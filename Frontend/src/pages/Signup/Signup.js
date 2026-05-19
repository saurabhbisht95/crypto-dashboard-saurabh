import React, { useState } from "react";
import "../Login/styles.css";
import { Link, useNavigate } from "react-router-dom";
import { FiUserPlus } from "react-icons/fi";
import { motion } from "framer-motion";
import { toast } from "react-toastify";

import gradient from "../../assets/gradient.png";
import iphone from "../../assets/iphone.png";
import { useAuth } from "../../context/AuthContext";
import { getApiMessage } from "../../services/http";

const isValidEmail = (email) => /\S+@\S+\.\S+/.test(email);

function Signup() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((currentForm) => ({ ...currentForm, [name]: value }));
    setErrors((currentErrors) => ({ ...currentErrors, [name]: "" }));
  };

  const handleSubmit = async (event) => {
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
      return;
    }

    setSubmitting(true);

    try {
      await register({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
      });
      toast.success("Account created.");
      navigate("/dashboard", { replace: true });
    } catch (err) {
      toast.error(getApiMessage(err, "Signup failed."));
    } finally {
      setSubmitting(false);
    }
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

              <button type="submit" className="btn-primary" disabled={submitting}>
                <FiUserPlus size={18} /> {submitting ? "Creating..." : "Sign Up"}
              </button>
            </form>
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
