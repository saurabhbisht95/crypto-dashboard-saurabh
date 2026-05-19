import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Button from "../components/Common/Button";
import ErrorState from "../components/Common/ErrorState";
import Header from "../components/Common/Header";
import Loader from "../components/Common/Loader";
import TabsComponent from "../components/Dashboard/Tabs";
import { getApiMessage } from "../services/http";
import { watchlistService } from "../services/watchlistService";

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
