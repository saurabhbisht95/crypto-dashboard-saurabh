import React, { useEffect, useState } from "react";
import { marketService } from "../../services/marketService";
import "./MarketWidgets.css";

function MarketIntelligence() {
  const [intelligence, setIntelligence] = useState(null);

  useEffect(() => {
    let isActive = true;

    marketService
      .getIntelligence()
      .then((data) => {
        if (isActive) setIntelligence(data);
      })
      .catch(() => {});

    return () => {
      isActive = false;
    };
  }, []);

  if (!intelligence?.signals?.length) return null;

  return (
    <section className="market-section">
      <div className="market-section-header">
        <div>
          <h2>Market Intelligence</h2>
          <p>News-style signals generated from live market movement.</p>
        </div>
        <span
          className={`sentiment-pill ${
            intelligence.sentiment === "Bullish"
              ? "positive"
              : intelligence.sentiment === "Bearish"
                ? "negative"
                : ""
          }`}
        >
          {intelligence.sentiment}
        </span>
      </div>
      <div className="insight-grid">
        {intelligence.signals.map((signal) => (
          <article className="insight-card" key={signal.title}>
            <span>{signal.sentiment}</span>
            <h3>{signal.title}</h3>
            <p>{signal.description}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

export default MarketIntelligence;
