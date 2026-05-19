import React, { useState } from "react";
import "./styles.css";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { FiLogIn } from "react-icons/fi";
import { motion } from "framer-motion";
import { toast } from "react-toastify";

import gradient from "../../assets/gradient.png";
import iphone from "../../assets/iphone.png";
import { useAuth } from "../../context/AuthContext";
import { getApiMessage } from "../../services/http";

const isValidEmail = (email) => /\S+@\S+\.\S+/.test(email);

function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: "", password: "" });
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

    if (!isValidEmail(form.email.trim())) {
      nextErrors.email = "Enter a valid email address.";
    }

    if (form.password.length < 6) {
      nextErrors.password = "Password must be at least 6 characters.";
    }

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length) {
      return;
    }

    setSubmitting(true);

    try {
      await login({
        email: form.email.trim(),
        password: form.password,
      });
      toast.success("Logged in successfully.");
      navigate(location.state?.from || "/dashboard", { replace: true });
    } catch (err) {
      toast.error(getApiMessage(err, "Login failed."));
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
            <h2 className="auth-title">Welcome Back</h2>
            <form className="auth-form" onSubmit={handleSubmit} noValidate>
              <label htmlFor="login-email">Email</label>
              <input
                id="login-email"
                name="email"
                type="email"
                className="input"
                placeholder="Enter your email"
                value={form.email}
                onChange={handleChange}
                aria-invalid={Boolean(errors.email)}
              />
              {errors.email && <span className="auth-error">{errors.email}</span>}

              <label htmlFor="login-password">Password</label>
              <input
                id="login-password"
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

              <div className="auth-links">
                <Link to="/forgot-password" className="forgot-link">
                  Forgot Password?
                </Link>
              </div>
              <button type="submit" className="btn-primary" disabled={submitting}>
                <FiLogIn size={18} /> {submitting ? "Logging in..." : "Login"}
              </button>
            </form>
            <p>
              Don't have an account?{" "}
              <Link to="/signup" className="sign-up">
                Sign Up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
