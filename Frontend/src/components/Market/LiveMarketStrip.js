import React, { useEffect, useMemo, useState } from "react";
import { marketService } from "../../services/marketService";
import "./MarketWidgets.css";

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
});

const DEFAULT_IDS = ["bitcoin", "ethereum", "solana", "ripple", "dogecoin"];

const LABELS = {
  bitcoin: { symbol: "BTC", name: "Bitcoin" },
  ethereum: { symbol: "ETH", name: "Ethereum" },
  solana: { symbol: "SOL", name: "Solana" },
  ripple: { symbol: "XRP", name: "XRP" },
  dogecoin: { symbol: "DOGE", name: "Dogecoin" },
};

function LiveMarketStrip({ ids = DEFAULT_IDS }) {
  const [prices, setPrices] = useState({});
  const [updatedAt, setUpdatedAt] = useState("");

  const stableIds = useMemo(() => ids.join(","), [ids]);

  useEffect(() => {
    let isActive = true;

    const loadLivePrices = async () => {
      try {
        const data = await marketService.getLivePrices(stableIds.split(","));

        if (!isActive) return;

        setPrices(data.prices || {});
        setUpdatedAt(new Date(data.polledAt).toLocaleTimeString());
      } catch {
        // The dashboard keeps existing data if a live poll misses.
      }
    };

    loadLivePrices();
    const intervalId = setInterval(loadLivePrices, 10000);

    return () => {
      isActive = false;
      clearInterval(intervalId);
    };
  }, [stableIds]);

  return (
    <section className="live-strip" aria-live="polite">
      <div className="live-strip-header">
        <div className="live-badge">
          <span className="live-dot" />
          LIVE MARKET
        </div>
        <span>{updatedAt ? `Updated ${updatedAt}` : "Connecting..."}</span>
      </div>
      <div className="live-strip-track">
        {stableIds.split(",").map((id) => {
          const item = prices[id] || {};
          const label = LABELS[id] || { symbol: id.toUpperCase(), name: id };
          const price = Number(item.usd);
          const change = Number(item.usd_24h_change);
          const hasPrice = Number.isFinite(price);
          const hasChange = Number.isFinite(change);

          return (
            <div className="live-tile" key={id}>
              <span>{label.symbol}</span>
              <small>{label.name}</small>
              <strong>{hasPrice ? currency.format(price) : "Loading"}</strong>
              <p className={hasChange && change < 0 ? "negative" : "positive"}>
                {hasChange ? `${change.toFixed(2)}%` : "Waiting"}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export default LiveMarketStrip;
