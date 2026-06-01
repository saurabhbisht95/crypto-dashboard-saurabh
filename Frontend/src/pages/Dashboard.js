import React, {
  lazy,
  Suspense,
  useDeferredValue,
  useEffect,
  useMemo,
  useState,
} from "react";
import Header from "../components/Common/Header";
import Loader from "../components/Common/Loader";
import Search from "../components/Dashboard/Search";
import TabsComponent from "../components/Dashboard/Tabs";

import PaginationComponent from "../components/Dashboard/Pagination";
import TopButton from "../components/Common/TopButton";
import Footer from "../components/Common/Footer/footer";
import ErrorState from "../components/Common/ErrorState";
import LiveMarketStrip from "../components/Market/LiveMarketStrip";
import { get100Coins } from "../functions/get100Coins";
import { getApiErrorMessage } from "../functions/api";
import "./FeaturePages.css";

const MarketHeatmap = lazy(() => import("../components/Market/MarketHeatmap"));
const MarketIntelligence = lazy(() =>
  import("../components/Market/MarketIntelligence")
);

const compactCurrency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  notation: "compact",
  maximumFractionDigits: 2,
});

const buildMarketSummary = (marketCoins) => {
  const sortedByChange = [...marketCoins].sort(
    (a, b) =>
      (b.price_change_percentage_24h || 0) -
      (a.price_change_percentage_24h || 0)
  );
  const marketCap = marketCoins.reduce(
    (sum, coin) => sum + (coin.market_cap || 0),
    0
  );
  const volume24h = marketCoins.reduce(
    (sum, coin) => sum + (coin.total_volume || 0),
    0
  );
  const bitcoinMarketCap =
    marketCoins.find((coin) => coin.id === "bitcoin")?.market_cap || 0;

  return {
    marketCap,
    volume24h,
    topGainers: sortedByChange.slice(0, 5),
    topLosers: sortedByChange.slice(-5).reverse(),
    bitcoinDominance:
      marketCap > 0 ? (bitcoinMarketCap / marketCap) * 100 : 0,
  };
};

function Dashboard() {
  const [coins, setCoins] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [shouldLoadInsights, setShouldLoadInsights] = useState(false);
  const deferredSearch = useDeferredValue(search);

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
      const response = await get100Coins();

      if (!isActive()) return;

      const marketCoins = Array.isArray(response) ? response : [];

      setCoins(marketCoins);
      setSummary(buildMarketSummary(marketCoins));
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

  const normalizedSearch = useMemo(
    () => deferredSearch.trim().toLowerCase(),
    [deferredSearch]
  );

  const filteredCoins = useMemo(() => {
    if (!normalizedSearch) return coins;

    return coins.filter(
      (coin) =>
        coin.name.toLowerCase().includes(normalizedSearch) ||
        coin.symbol.toLowerCase().includes(normalizedSearch)
    );
  }, [coins, normalizedSearch]);

  const handlePageChange = (event, value) => {
    setPage(value);
  };

  const pageCount = Math.max(1, Math.ceil(coins.length / 10));
  const initialCount = (page - 1) * 10;
  const paginatedCoins = useMemo(
    () => coins.slice(initialCount, initialCount + 10),
    [coins, initialCount]
  );
  const isSearching = Boolean(normalizedSearch);
  const visibleCoins = isSearching ? filteredCoins : paginatedCoins;
  const resultLabel = isSearching
    ? `${filteredCoins.length} matches for "${deferredSearch.trim()}"`
    : `${coins.length} assets tracked`;

  useEffect(() => {
    if (loading || error || isSearching) {
      setShouldLoadInsights(false);
      return undefined;
    }

    const scheduleInsights = () => setShouldLoadInsights(true);
    const supportsIdleCallback = typeof window.requestIdleCallback === "function";
    const taskId = supportsIdleCallback
      ? window.requestIdleCallback(scheduleInsights, { timeout: 1600 })
      : window.setTimeout(scheduleInsights, 700);

    return () => {
      if (supportsIdleCallback) {
        window.cancelIdleCallback(taskId);
      } else {
        window.clearTimeout(taskId);
      }
    };
  }, [error, isSearching, loading]);

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
          <LiveMarketStrip />
          <section className="feature-shell dashboard-overview">
            <div className="feature-header dashboard-heading">
              <div>
                <span className="feature-eyebrow">Markets</span>
                <h1>Market dashboard</h1>
                <p>
                  Scan live prices, market breadth, and momentum across the top
                  crypto assets.
                </p>
              </div>
              <div className="dashboard-stat-pill" aria-label={resultLabel}>
                <span>Showing</span>
                <strong>{visibleCoins.length}</strong>
                <small>{isSearching ? "matches" : `of ${coins.length}`}</small>
              </div>
            </div>
          </section>
          {summary && (
            <section className="feature-shell dashboard-summary">
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
          <section className="dashboard-tools" aria-label="Dashboard filters">
            <Search search={search} handleChange={handleChange} />
            <p>{resultLabel}</p>
          </section>
          <TabsComponent coins={visibleCoins} setSearch={setSearch} />
          {!isSearching && (
            <PaginationComponent
              page={page}
              count={pageCount}
              handlePageChange={handlePageChange}
            />
          )}
          {!isSearching && shouldLoadInsights && (
            <Suspense fallback={null}>
              <MarketIntelligence />
              <MarketHeatmap />
            </Suspense>
          )}
        </>
      )}
      <TopButton />
      <Footer />
    </>
  );
}

export default Dashboard;
