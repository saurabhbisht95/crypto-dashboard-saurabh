import React from 'react';
import "./styles.css";
import { Link } from 'react-router-dom';
import { FiLogIn } from 'react-icons/fi';
import { motion } from 'framer-motion';

import gradient from '../../assets/gradient.png';
import iphone from '../../assets/iphone.png';

function Login() {
  return (
    <div className="auth-wrapper">

      <div className="auth-layout">
        {/* Left side image (iPhone) */}
        <div className="auth-image-container">
          <div className="iphone-stack">
            <img src={gradient} alt="gradient" className="gradient-background" />
            <motion.img
              src={iphone}
              alt="iphone"
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

        {/* Right side login form */}
        <div className="auth-container">
          <div className="auth-card">
            <h2 className="auth-title">Welcome Back</h2>
            <form className="auth-form">
              <label>Email</label>
              <input type="email" className="input" placeholder="Enter your email" />
              <label>Password</label>
              <input type="password" className="input" placeholder="••••••••" />
              <div className="auth-links">
                <Link to="/forgot-password" className="forgot-link">Forgot Password?</Link>
              </div>
              <button type="submit" className="btn-primary">
                <FiLogIn size={18} /> Login
              </button>
            </form>
            <p>
              Don’t have an account? <Link to="/signup" className='sign-up'>Sign Up</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
