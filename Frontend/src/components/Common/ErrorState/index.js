import React from "react";
import Button from "../Button";
import "./styles.css";

function ErrorState({ title, message, actionText = "Retry", onAction }) {
  return (
    <div className="error-state">
      <h2>{title}</h2>
      {message && <p>{message}</p>}
      {onAction && <Button text={actionText} onClick={() => onAction()} />}
    </div>
  );
}

export default ErrorState;
