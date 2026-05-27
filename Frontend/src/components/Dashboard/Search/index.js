import React from "react";
import "./styles.css";
import SearchIcon from "@mui/icons-material/Search";

function Search({ search, handleChange }) {
  return (
    <div className="search-flex">
      <SearchIcon sx={{ color: "var(--grey)", fontSize: "1.2rem" }} />
      <input
        aria-label="Search coins"
        className="search-input"
        autoComplete="off"
        placeholder="Search coins by name or symbol"
        type="search"
        value={search}
        onChange={handleChange}
      />
    </div>
  );
}

export default Search;
