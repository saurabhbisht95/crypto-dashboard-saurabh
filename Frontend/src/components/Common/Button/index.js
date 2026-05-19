import React from "react";
import "./styles.css";

function Button({ text, onClick, outlined, type = "button", disabled = false }) {
  const className = outlined ? "btn-outlined" : "btn";

  if (onClick) {
    return (
      <button
        type={type}
        className={className}
        onClick={(event) => onClick(event)}
        disabled={disabled}
      >
        {text}
      </button>
    );
  }

  return <span className={className}>{text}</span>;
}

export default Button;
