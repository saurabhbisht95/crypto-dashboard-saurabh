import React, { useEffect, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import Drawer from "@mui/material/Drawer";
import MenuRoundedIcon from "@mui/icons-material/MenuRounded";
import { IconButton } from "@mui/material";
import Switch from "@mui/material/Switch";
import { toast } from "react-toastify";
import { getStorageValue, setStorageValue } from "../../../functions/storage";
import { useAuth } from "../../../context/AuthContext";

const coreLinks = [
  { label: "Home", to: "/" },
  { label: "Compare", to: "/compare" },
  { label: "Discover", to: "/discover" },
  { label: "Screener", to: "/screener" },
  { label: "Exchanges", to: "/exchanges" },
  { label: "NFTs", to: "/nfts" },
  { label: "Converter", to: "/converter" },
  { label: "Dashboard", to: "/dashboard" },
];

const authLinks = [
  { label: "Portfolio", to: "/portfolio" },
  { label: "Alerts", to: "/alerts" },
  { label: "Watchlist", to: "/watchlist" },
];

export default function TemporaryDrawer() {
  const { isAuthenticated, logout, user } = useAuth();
  const [open, setOpen] = useState(false);
  const [showAccountActions, setShowAccountActions] = useState(false);
  const firstName = user?.name?.split(" ")?.[0];
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
    setOpen(false);
    setShowAccountActions(false);
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
    <div>
      <IconButton onClick={() => setOpen(true)}>
        <MenuRoundedIcon className="link" />
      </IconButton>
      <Drawer
        anchor="right"
        open={open}
        onClose={() => {
          setOpen(false);
          setShowAccountActions(false);
        }}
      >
        <div className="drawer-div">
          {[...coreLinks, ...(isAuthenticated ? authLinks : [])].map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `link drawer-link ${isActive ? "active-link" : ""}`
              }
            >
              {item.label}
            </NavLink>
          ))}
          {isAuthenticated ? (
            <>
              <button
                type="button"
                className="link drawer-link drawer-action"
                onClick={() => setShowAccountActions((isVisible) => !isVisible)}
              >
                {firstName || "Account"}
              </button>
              {showAccountActions && (
                <button
                  type="button"
                  className="link drawer-link drawer-action"
                  onClick={handleLogout}
                >
                  Logout
                </button>
              )}
            </>
          ) : (
            <Link to="/login" onClick={() => setOpen(false)}>
              <span className="link drawer-link">Login</span>
            </Link>
          )}
          <Switch checked={darkMode} onClick={() => changeMode()} />
        </div>
      </Drawer>
    </div>
  );
}
