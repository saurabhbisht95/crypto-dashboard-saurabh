import React from "react";
import "./styles.css";

import Pagination from "@mui/material/Pagination";

export default function PaginationControlled({ page, count = 10, handlePageChange }) {
  return (
    <div className="pagination-div">
      <Pagination
        sx={{
          "& .MuiPaginationItem-text": {
            color: "#fff !important",
            border: "1px solid var(--grey)",
          },
          "& .MuiPaginationItem-text:hover": {
            backgroundColor: "transparent !important",
          },
          "& .Mui-selected  ": {
            backgroundColor: "var(--blue)",
            borderColor: "var(--blue)",
          },
          "& .MuiPaginationItem-ellipsis": {
            border: "none",
          },
        }}
        count={count}
        page={page}
        onChange={handlePageChange}
      />
    </div>
  );
}
