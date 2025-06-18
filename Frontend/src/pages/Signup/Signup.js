import React from 'react';
import "../Login/styles.css";
import { Link } from 'react-router-dom';
import { FiUserPlus } from 'react-icons/fi';
import { motion } from 'framer-motion';

import gradient from '../../assets/gradient.png';
import iphone from '../../assets/iphone.png';

function Signup() {
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

        {/* Right side sign up form */}
        <div className="auth-container">
          <div className="auth-card">
            <h2 className="auth-title">Create Account</h2>
            <form className="auth-form">
              <label>Full Name</label>
              <input type="text" className="input" placeholder="Enter your full name" />

              <label>Email</label>
              <input type="email" className="input" placeholder="Enter your email" />

              <label>Password</label>
              <input type="password" className="input" placeholder="••••••••" />


              <button type="submit" className="btn-primary">
                <FiUserPlus size={18} /> Sign Up
              </button>
            </form>
            <p>
              Already have an account? <Link to="/login" className='sign-up'>Login</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Signup;
