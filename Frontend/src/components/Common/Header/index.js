import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import Button from "../Button";
import TemporaryDrawer from "./drawer";
import "./styles.css";
import Switch from "@mui/material/Switch";
import { toast } from "react-toastify";
import { getStorageValue, setStorageValue } from "../../../functions/storage";
import { useAuth } from "../../../context/AuthContext";

function Header() {
  const { isAuthenticated, logout, user } = useAuth();
  const firstName = user?.name?.split(" ")?.[0];
  const accountMenuRef = useRef(null);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(
    getStorageValue("theme") === "dark" ? true : false
  );

  useEffect(() => {
    if (getStorageValue("theme") === "dark") {
      setDark();
    } else {
      setLight();
    }
  }, []);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (
        accountMenuRef.current &&
        !accountMenuRef.current.contains(event.target)
      ) {
        setAccountMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);

    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const changeMode = () => {
    if (getStorageValue("theme") !== "dark") {
      setDark();
    } else {
      setLight();
    }
    setDarkMode(!darkMode);
    toast.success("Theme Changed!");
  };

  const handleLogout = async () => {
    await logout();
    setAccountMenuOpen(false);
    toast.success("Logged out.");
  };

  const setDark = () => {
    setStorageValue("theme", "dark");
    document.documentElement.setAttribute("data-theme", "dark");
  };

  const setLight = () => {
    setStorageValue("theme", "light");
    document.documentElement.setAttribute("data-theme", "light");
  };

  return (
    <div className="header">
      <h1>
        CryptoTracker<span style={{ color: "var(--blue)" }}>.</span>
      </h1>
      <div className="links">
        <Switch checked={darkMode} onClick={() => changeMode()} />
        <Link to="/">
          <p className="link">Home</p>
        </Link>
        <Link to="/compare">
          <p className="link">Compare</p>
        </Link>
        {isAuthenticated && (
          <>
            <Link to="/portfolio">
              <p className="link">Portfolio</p>
            </Link>
            <Link to="/alerts">
              <p className="link">Alerts</p>
            </Link>
            <Link to="/watchlist">
              <p className="link">Watchlist</p>
            </Link>
          </>
        )}
        <Link to="/dashboard">
          <Button text={"dashboard"} />
        </Link>
        {isAuthenticated ? (
          <div className="account-menu" ref={accountMenuRef}>
            <button
              type="button"
              className="header-user-button"
              onClick={() => setAccountMenuOpen((isOpen) => !isOpen)}
              aria-expanded={accountMenuOpen}
              aria-haspopup="menu"
            >
              {firstName || "Account"}
            </button>
            {accountMenuOpen && (
              <div className="account-popover" role="menu">
                <button type="button" onClick={handleLogout} role="menuitem">
                  Logout
                </button>
              </div>
            )}
          </div>
        ) : (
          <Link to="/login">
            <Button text={"login"} />
          </Link>
        )}
      </div>
      <div className="drawer-component">
        <TemporaryDrawer />
      </div>
    </div>
  );
}

export default Header;
