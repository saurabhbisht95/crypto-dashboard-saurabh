import { MenuItem, Select } from "@mui/material";
import React from "react";
import SelectDays from "../../CoinPage/SelectDays";
import "./styles.css";

function SelectCoins({
  allCoins,
  crypto1,
  crypto2,
  onCoinChange,
  days,
  handleDaysChange,
}) {
  const coinOptions =
    allCoins.length > 0
      ? allCoins
      : [
          { id: crypto1, name: crypto1 },
          { id: crypto2, name: crypto2 },
        ];

  const style = {
    height: "2.5rem",
    color: "var(--white)",
    "& .MuiOutlinedInput-notchedOutline": {
      borderColor: "var(--white)",
    },
    "& .MuiSvgIcon-root": {
      color: "var(--white)",
    },
    "&:hover": {
      "&& fieldset": {
        borderColor: "#3a80e9",
      },
    },
  };

  return (
    <div className="select-coins-div">
      <div className="select-flex">
        <p>Crypto 1</p>
        <Select
          value={crypto1}
          onChange={(e) => onCoinChange(e, false)}
          sx={style}
        >
          {coinOptions
            .filter((coin) => coin.id !== crypto2)
            .map((coin) => (
              <MenuItem value={coin.id} key={coin.id}>
                {coin.name}
              </MenuItem>
            ))}
        </Select>
      </div>
      <div className="select-flex">
        <p>Crypto 2</p>
        <Select
          value={crypto2}
          onChange={(e) => onCoinChange(e, true)}
          sx={style}
        >
          {coinOptions
            .filter((coin) => coin.id !== crypto1)
            .map((coin) => (
              <MenuItem value={coin.id} key={coin.id}>
                {coin.name}
              </MenuItem>
            ))}
        </Select>
      </div>
      <SelectDays
        days={days}
        handleDaysChange={handleDaysChange}
        noPTag={true}
      />
    </div>
  );
}

export default SelectCoins;
