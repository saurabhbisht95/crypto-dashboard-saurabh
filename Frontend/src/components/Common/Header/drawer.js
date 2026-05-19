import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Drawer from "@mui/material/Drawer";
import MenuRoundedIcon from "@mui/icons-material/MenuRounded";
import { IconButton } from "@mui/material";
import Switch from "@mui/material/Switch";
import { toast } from "react-toastify";
import { getStorageValue, setStorageValue } from "../../../functions/storage";
import { useAuth } from "../../../context/AuthContext";

export default function TemporaryDrawer() {
  const { isAuthenticated, logout } = useAuth();
  const [open, setOpen] = useState(false);
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
    setOpen(false);
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
      <Drawer anchor="right" open={open} onClose={() => setOpen(false)}>
        <div className="drawer-div">
          <Link to="/" onClick={() => setOpen(false)}>
            <p className="link">Home</p>
          </Link>
          <Link to="/compare" onClick={() => setOpen(false)}>
            <p className="link">Compare</p>
          </Link>
          {isAuthenticated && (
            <>
              <Link to="/portfolio" onClick={() => setOpen(false)}>
                <p className="link">Portfolio</p>
              </Link>
              <Link to="/alerts" onClick={() => setOpen(false)}>
                <p className="link">Alerts</p>
              </Link>
              <Link to="/watchlist" onClick={() => setOpen(false)}>
                <p className="link">Watchlist</p>
              </Link>
            </>
          )}
          <Link to="/dashboard" onClick={() => setOpen(false)}>
            <p className="link">Dashboard</p>
          </Link>
          {isAuthenticated ? (
            <p className="link" onClick={handleLogout}>
              Logout
            </p>
          ) : (
            <Link to="/login" onClick={() => setOpen(false)}>
              <p className="link">Login</p>
            </Link>
          )}
          <Switch checked={darkMode} onClick={() => changeMode()} />
        </div>
      </Drawer>
    </div>
  );
}
