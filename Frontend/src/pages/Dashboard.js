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
  if (!marketCoins.length) {
    return null;
  }

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
  const advancing = marketCoins.filter(
    (coin) => (coin.price_change_percentage_24h || 0) >= 0
  ).length;
  const declining = marketCoins.length - advancing;
  const averageChange =
    marketCoins.reduce(
      (sum, coin) => sum + (coin.price_change_percentage_24h || 0),
      0
    ) / marketCoins.length;

  return {
    marketCap,
    volume24h,
    advancing,
    declining,
    averageChange,
    topGainers: sortedByChange.slice(0, 5),
    topLosers: sortedByChange.slice(-5).reverse(),
    bitcoinDominance:
      marketCap > 0 ? (bitcoinMarketCap / marketCap) * 100 : 0,
  };
};

function Dashboard() {
  const [coins, setCoins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [shouldLoadInsights, setShouldLoadInsights] = useState(false);
  const deferredSearch = useDeferredValue(search);
  const summary = useMemo(() => buildMarketSummary(coins), [coins]);
  const liveStripCoins = useMemo(() => coins.slice(0, 5), [coins]);

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

  useEffect(() => {
    setPage(1);
  }, [normalizedSearch]);

  const handlePageChange = (event, value) => {
    setPage(value);
  };

  const pageCount = Math.max(1, Math.ceil(filteredCoins.length / 10));
  const initialCount = (page - 1) * 10;
  const visibleCoins = useMemo(
    () => filteredCoins.slice(initialCount, initialCount + 10),
    [filteredCoins, initialCount]
  );

  useEffect(() => {
    if (page > pageCount) {
      setPage(pageCount);
    }
  }, [page, pageCount]);

  const isSearching = Boolean(normalizedSearch);
  const rangeStart = filteredCoins.length ? initialCount + 1 : 0;
  const rangeEnd = Math.min(initialCount + visibleCoins.length, filteredCoins.length);
  const resultLabel = isSearching
    ? `matches for "${deferredSearch.trim()}"`
    : "assets tracked";
  const showingLabel = `${rangeStart}-${rangeEnd} of ${filteredCoins.length}`;

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
          <LiveMarketStrip marketCoins={liveStripCoins} />
          <section className="feature-shell dashboard-overview">
            <div className="dashboard-hero">
              <div>
                <span className="feature-eyebrow">Markets</span>
                <h1>Professional crypto market dashboard</h1>
                <p>
                  Real-time market breadth, liquidity, momentum, and watchlist
                  actions in a focused trading workspace.
                </p>
              </div>
              <div className="dashboard-session-card">
                <div className="session-card-header">
                  <span>Session</span>
                  <strong>Spot Market</strong>
                </div>
                <div className="session-row">
                  <span>Advancers</span>
                  <strong className="positive">{summary?.advancing || 0}</strong>
                </div>
                <div className="session-row">
                  <span>Decliners</span>
                  <strong className="negative">{summary?.declining || 0}</strong>
                </div>
                <div className="session-row">
                  <span>Avg 24h Move</span>
                  <strong
                    className={
                      (summary?.averageChange || 0) < 0 ? "negative" : "positive"
                    }
                  >
                    {(summary?.averageChange || 0).toFixed(2)}%
                  </strong>
                </div>
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
                <div className="metric-card">
                  <span>Top Loser</span>
                  <strong>
                    {summary.topLosers?.[0]?.symbol?.toUpperCase() || "-"}{" "}
                    <span className="negative">
                      {summary.topLosers?.[0]?.price_change_percentage_24h?.toFixed(
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
            <div className="dashboard-result-copy">
              <strong>{showingLabel}</strong>
              {" "}
              <span>{resultLabel}</span>
            </div>
          </section>
          <TabsComponent coins={visibleCoins} setSearch={setSearch} />
          {filteredCoins.length > 10 && (
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
