import React, { useEffect, useRef, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import Button from "../Button";
import TemporaryDrawer from "./drawer";
import "./styles.css";
import Switch from "@mui/material/Switch";
import { toast } from "react-toastify";
import { getStorageValue, setStorageValue } from "../../../functions/storage";
import { useAuth } from "../../../context/AuthContext";

const coreLinks = [
  { label: "Home", to: "/" },
  { label: "Compare", to: "/compare" },
  { label: "Discover", to: "/discover" },
  { label: "Screener", to: "/screener" },
  { label: "Convert", to: "/converter" },
];

const authLinks = [
  { label: "Portfolio", to: "/portfolio" },
  { label: "Alerts", to: "/alerts" },
  { label: "Watchlist", to: "/watchlist" },
];

function Header() {
  const { isAuthenticated, logout, user } = useAuth();
  const firstName = user?.name?.split(" ")?.[0];
  const accountMenuRef = useRef(null);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(
    getStorageValue("theme") !== "light"
  );

  useEffect(() => {
    if (getStorageValue("theme") === "light") {
      setLight();
    } else {
      setDark();
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
    if (getStorageValue("theme") === "dark") {
      setLight();
    } else {
      setDark();
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
    <header className="header">
      <h1>
        CryptoTracker<span style={{ color: "var(--blue)" }}>.</span>
      </h1>
      <nav className="links" aria-label="Primary navigation">
        <Switch
          checked={darkMode}
          onClick={() => changeMode()}
          inputProps={{ "aria-label": "Toggle color theme" }}
        />
        {[...coreLinks, ...(isAuthenticated ? authLinks : [])].map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/"}
            className={({ isActive }) =>
              `link ${isActive ? "active-link" : ""}`
            }
          >
            {item.label}
          </NavLink>
        ))}
        <Link to="/dashboard">
          <Button text="Dashboard" />
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
      </nav>
      <div className="drawer-component">
        <TemporaryDrawer />
      </div>
    </header>
  );
}

export default Header;
