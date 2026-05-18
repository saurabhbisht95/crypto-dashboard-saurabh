import React from "react";
import { Link } from "react-router-dom";
import Button from "../components/Common/Button";
import ErrorState from "../components/Common/ErrorState";
import Header from "../components/Common/Header";

function NotFound() {
  return (
    <>
      <Header />
      <ErrorState
        title="Page not found"
        message="The page you opened does not exist."
      />
      <div style={{ display: "flex", justifyContent: "center", margin: "2rem" }}>
        <Link to="/dashboard">
          <Button text="Dashboard" />
        </Link>
      </div>
    </>
  );
}

export default NotFound;
