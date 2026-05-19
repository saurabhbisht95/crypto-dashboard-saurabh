import React, { useEffect, useState } from "react";
import { marketService } from "../../services/marketService";
import "./MarketWidgets.css";

const compactCurrency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  notation: "compact",
  maximumFractionDigits: 1,
});

const getHeatClass = (change) => {
  if (change >= 6) return "heatmap-strong-up";
  if (change >= 0) return "heatmap-up";
  if (change <= -6) return "heatmap-strong-down";
  return "heatmap-down";
};

function MarketHeatmap() {
  const [heatmap, setHeatmap] = useState([]);

  useEffect(() => {
    let isActive = true;

    marketService
      .getHeatmap(40)
      .then((data) => {
        if (isActive) setHeatmap(data);
      })
      .catch(() => {});

    return () => {
      isActive = false;
    };
  }, []);

  if (!heatmap.length) return null;

  return (
    <section className="market-section">
      <div className="market-section-header">
        <div>
          <h2>Crypto Heatmap</h2>
          <p>Market cap weighted view of the strongest and weakest assets.</p>
        </div>
      </div>
      <div className="heatmap-grid">
        {heatmap.map((coin) => (
          <article className={`heatmap-tile ${getHeatClass(coin.change24h)}`} key={coin.id}>
            <h3>{coin.symbol.toUpperCase()}</h3>
            <span>{coin.name}</span>
            <p>{coin.change24h.toFixed(2)}%</p>
            <strong>{compactCurrency.format(coin.marketCap)} cap</strong>
          </article>
        ))}
      </div>
    </section>
  );
}

export default MarketHeatmap;
