import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Button from "../components/Common/Button";
import ErrorState from "../components/Common/ErrorState";
import Header from "../components/Common/Header";
import Loader from "../components/Common/Loader";
import TabsComponent from "../components/Dashboard/Tabs";
import { getApiErrorMessage } from "../functions/api";
import { get100Coins } from "../functions/get100Coins";

const getStoredWatchlist = () => {
  try {
    return JSON.parse(localStorage.getItem("watchlist")) || [];
  } catch {
    return [];
  }
};

function Watchlist() {
  const [watchlist] = useState(getStoredWatchlist);
  const [coins, setCoins] = useState([]);
  const [loading, setLoading] = useState(Boolean(watchlist.length));
  const [error, setError] = useState("");

  const getData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const allCoins = await get100Coins();
      if (allCoins) {
        setCoins(allCoins.filter((coin) => watchlist.includes(coin.id)));
      }
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [watchlist]);

  useEffect(() => {
    if (watchlist.length) {
      getData();
    }
  }, [getData, watchlist.length]);

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
      ) : watchlist.length > 0 ? (
        <TabsComponent coins={coins} />
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
