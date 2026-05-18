import React, { useState } from "react";
import "./styles.css";

const getSafeDescription = (html = "") => {
  if (typeof window === "undefined" || !window.DOMParser) {
    return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  }

  const parser = new DOMParser();
  const documentContent = parser.parseFromString(html, "text/html");
  return (documentContent.body.textContent || "").replace(/\s+/g, " ").trim();
};

function Info({ title, desc }) {
  const [toggle, setToggle] = useState(false);
  const safeDesc = getSafeDescription(desc);
  const isLong = safeDesc.length > 300;
  const visibleDesc =
    isLong && !toggle ? `${safeDesc.slice(0, 300).trim()}...` : safeDesc;

  return (
    <div className="grey-wrapper info-component">
      <h1>{title}</h1>
      <p className="info-p">
        {visibleDesc || "No description available for this coin."}
        {isLong && (
          <button
            type="button"
            className="read-more-button"
            onClick={() => setToggle(!toggle)}
          >
            {toggle ? "Read Less" : "Read More"}
          </button>
        )}
      </p>
    </div>
  );
}

export default Info;
