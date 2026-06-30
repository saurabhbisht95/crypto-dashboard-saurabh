import React, { useEffect, useMemo, useState } from "react";
import { marketService } from "../../services/marketService";
import "./MarketWidgets.css";

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
});

const DEFAULT_IDS = ["bitcoin", "ethereum", "solana", "ripple", "dogecoin"];
const EMPTY_MARKET_COINS = [];

const LABELS = {
  bitcoin: { symbol: "BTC", name: "Bitcoin" },
  ethereum: { symbol: "ETH", name: "Ethereum" },
  solana: { symbol: "SOL", name: "Solana" },
  ripple: { symbol: "XRP", name: "XRP" },
  dogecoin: { symbol: "DOGE", name: "Dogecoin" },
};

const coinToPricePayload = (coin) => ({
  usd: coin.current_price,
  usd_market_cap: coin.market_cap,
  usd_24h_vol: coin.total_volume,
  usd_24h_change: coin.price_change_percentage_24h,
});

function LiveMarketStrip({ ids = DEFAULT_IDS, marketCoins = EMPTY_MARKET_COINS }) {
  const initialPrices = useMemo(
    () =>
      marketCoins.reduce((values, coin) => {
        values[coin.id] = coinToPricePayload(coin);
        return values;
      }, {}),
    [marketCoins]
  );
  const marketTiles = useMemo(() => {
    if (marketCoins.length) {
      return marketCoins.map((coin) => ({
        id: coin.id,
        symbol: coin.symbol?.toUpperCase() || coin.id.toUpperCase(),
        name: coin.name || coin.id,
      }));
    }

    return ids.map((id) => {
      const label = LABELS[id] || { symbol: id.toUpperCase(), name: id };
      return { id, ...label };
    });
  }, [ids, marketCoins]);
  const stableIds = useMemo(
    () => marketTiles.map((coin) => coin.id).join(","),
    [marketTiles]
  );
  const hasInitialPrices = Object.keys(initialPrices).length > 0;
  const [prices, setPrices] = useState(initialPrices);
  const [updatedAt, setUpdatedAt] = useState("");

  useEffect(() => {
    if (hasInitialPrices) {
      setPrices(initialPrices);
      setUpdatedAt("Market snapshot");
    }
  }, [hasInitialPrices, initialPrices]);

  useEffect(() => {
    let isActive = true;
    const idsToPoll = stableIds.split(",").filter(Boolean);

    if (!idsToPoll.length) {
      return undefined;
    }

    const loadLivePrices = async () => {
      try {
        const data = await marketService.getLivePrices(idsToPoll);

        if (!isActive) return;

        setPrices(data.prices || {});
        setUpdatedAt(new Date(data.polledAt).toLocaleTimeString());
      } catch {
        // The dashboard keeps existing data if a live poll misses.
      }
    };

    if (!hasInitialPrices) {
      loadLivePrices();
    }

    const intervalId = setInterval(loadLivePrices, 30000);

    return () => {
      isActive = false;
      clearInterval(intervalId);
    };
  }, [hasInitialPrices, stableIds]);

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
        {marketTiles.map((label) => {
          const { id } = label;
          const item = prices[id] || {};
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
