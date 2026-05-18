import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Drawer from "@mui/material/Drawer";
import MenuRoundedIcon from "@mui/icons-material/MenuRounded";
import { IconButton } from "@mui/material";
import Switch from "@mui/material/Switch";
import { toast } from "react-toastify";
import { getStorageValue, setStorageValue } from "../../../functions/storage";

export default function TemporaryDrawer() {
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
          <Link to="/watchlist" onClick={() => setOpen(false)}>
            <p className="link">Watchlist</p>
          </Link>
          <Link to="/dashboard" onClick={() => setOpen(false)}>
            <p className="link">Dashboard</p>
          </Link>
          <Switch checked={darkMode} onClick={() => changeMode()} />
        </div>
      </Drawer>
    </div>
  );
}
