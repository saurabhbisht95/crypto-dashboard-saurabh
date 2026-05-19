import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Button from "../components/Common/Button";
import ErrorState from "../components/Common/ErrorState";
import Header from "../components/Common/Header";
import Loader from "../components/Common/Loader";
import TabsComponent from "../components/Dashboard/Tabs";
import { getApiMessage } from "../services/http";
import { watchlistService } from "../services/watchlistService";
import "./FeaturePages.css";

const compactCurrency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  notation: "compact",
  maximumFractionDigits: 2,
});

function Watchlist() {
  const [coins, setCoins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const getData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const watchlist = await watchlistService.getWatchlist();
      setCoins(watchlist.coins);
    } catch (err) {
      setError(getApiMessage(err, "Watchlist could not be loaded."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    getData();
  }, [getData]);

  const bestMover = coins.reduce(
    (best, coin) =>
      (coin.price_change_percentage_24h || 0) >
      (best?.price_change_percentage_24h || -Infinity)
        ? coin
        : best,
    null
  );
  const worstMover = coins.reduce(
    (worst, coin) =>
      (coin.price_change_percentage_24h || 0) <
      (worst?.price_change_percentage_24h || Infinity)
        ? coin
        : worst,
    null
  );
  const watchedMarketCap = coins.reduce(
    (sum, coin) => sum + (coin.market_cap || 0),
    0
  );
  const averageChange =
    coins.reduce((sum, coin) => sum + (coin.price_change_percentage_24h || 0), 0) /
    Math.max(coins.length, 1);

  return (
    <div>
      <Header />
      {loading ? (
        <Loader />
      ) : error ? (
        <ErrorState
          title="Watchlist could not be loaded"
          message={error}
          onAction={getData}
        />
      ) : coins.length > 0 ? (
        <>
          <section className="feature-shell" style={{ marginBottom: "1rem" }}>
            <div className="feature-header">
              <div>
                <h1>Watchlist Insights</h1>
                <p>Your saved market, summarized like a trading desk brief.</p>
              </div>
            </div>
            <div className="metric-grid">
              <div className="metric-card">
                <span>Tracked Assets</span>
                <strong>{coins.length}</strong>
              </div>
              <div className="metric-card">
                <span>Watched Market Cap</span>
                <strong>{compactCurrency.format(watchedMarketCap)}</strong>
              </div>
              <div className="metric-card">
                <span>Average 24h Move</span>
                <strong className={averageChange >= 0 ? "positive" : "negative"}>
                  {averageChange.toFixed(2)}%
                </strong>
              </div>
              <div className="metric-card">
                <span>Best / Worst</span>
                <strong>
                  {bestMover?.symbol?.toUpperCase()} /{" "}
                  {worstMover?.symbol?.toUpperCase()}
                </strong>
              </div>
            </div>
          </section>
          <TabsComponent coins={coins} />
        </>
      ) : (
        <div>
          <h1 style={{ textAlign: "center" }}>
            Sorry, No Items In The Watchlist.
          </h1>
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              margin: "2rem",
            }}
          >
            <Link to="/dashboard">
              <Button text="Dashboard" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

export default Watchlist;
