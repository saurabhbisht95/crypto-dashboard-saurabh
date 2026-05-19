import React, { useEffect, useMemo, useState } from "react";
import Header from "../components/Common/Header";
import Loader from "../components/Common/Loader";
import Search from "../components/Dashboard/Search";
import TabsComponent from "../components/Dashboard/Tabs";

import PaginationComponent from "../components/Dashboard/Pagination";
import TopButton from "../components/Common/TopButton";
import Footer from "../components/Common/Footer/footer";
import ErrorState from "../components/Common/ErrorState";
import { get100Coins } from "../functions/get100Coins";
import { getApiErrorMessage } from "../functions/api";
import { marketService } from "../services/marketService";
import "./FeaturePages.css";

const compactCurrency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  notation: "compact",
  maximumFractionDigits: 2,
});

function Dashboard() {
  const [coins, setCoins] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    let isActive = true;
    getData(() => isActive);

    return () => {
      isActive = false;
    };
  }, []);

  const getData = async (isActive = () => true) => {
    setLoading(true);
    setError("");

    try {
      const [response, marketSummary] = await Promise.all([
        get100Coins(),
        marketService.getSummary(),
      ]);

      if (!isActive()) return;

      setCoins(Array.isArray(response) ? response : []);
      setSummary(marketSummary);
      setPage(1);
    } catch (err) {
      if (!isActive()) return;
      setError(getApiErrorMessage(err));
      setCoins([]);
    } finally {
      if (isActive()) {
        setLoading(false);
      }
    }
  };

  const handleChange = (e) => {
    setSearch(e.target.value);
    setPage(1);
  };

  const filteredCoins = useMemo(
    () =>
      coins.filter(
        (coin) =>
          coin.name.toLowerCase().includes(search.trim().toLowerCase()) ||
          coin.symbol.toLowerCase().includes(search.trim().toLowerCase())
      ),
    [coins, search]
  );

  const handlePageChange = (event, value) => {
    setPage(value);
  };

  const pageCount = Math.max(1, Math.ceil(coins.length / 10));
  const initialCount = (page - 1) * 10;
  const paginatedCoins = coins.slice(initialCount, initialCount + 10);
  const visibleCoins = search ? filteredCoins : paginatedCoins;

  return (
    <>
      <Header />
      {loading ? (
        <Loader />
      ) : error ? (
        <ErrorState
          title="Crypto data could not be loaded"
          message={error}
          onAction={() => getData()}
        />
      ) : (
        <>
          {summary && (
            <section className="feature-shell" style={{ marginBottom: "1rem" }}>
              <div className="metric-grid">
                <div className="metric-card">
                  <span>Top 100 Market Cap</span>
                  <strong>{compactCurrency.format(summary.marketCap)}</strong>
                </div>
                <div className="metric-card">
                  <span>24h Volume</span>
                  <strong>{compactCurrency.format(summary.volume24h)}</strong>
                </div>
                <div className="metric-card">
                  <span>BTC Dominance</span>
                  <strong>{summary.bitcoinDominance.toFixed(2)}%</strong>
                </div>
                <div className="metric-card">
                  <span>Top Gainer</span>
                  <strong>
                    {summary.topGainers?.[0]?.symbol?.toUpperCase() || "-"}{" "}
                    <span className="positive">
                      {summary.topGainers?.[0]?.price_change_percentage_24h?.toFixed(
                        2
                      ) || "0.00"}
                      %
                    </span>
                  </strong>
                </div>
              </div>
            </section>
          )}
          <Search search={search} handleChange={handleChange} />
          <TabsComponent
            coins={visibleCoins}
            setSearch={setSearch}
          />
          {!search && (
            <PaginationComponent
              page={page}
              count={pageCount}
              handlePageChange={handlePageChange}
            />
          )}
        </>
      )}
      <TopButton />
      <Footer />
    </>
  );
}

export default Dashboard;
