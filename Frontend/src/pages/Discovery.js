import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import ErrorState from "../components/Common/ErrorState";
import Header from "../components/Common/Header";
import Loader from "../components/Common/Loader";
import PaginationComponent from "../components/Dashboard/Pagination";
import { marketService } from "../services/marketService";
import { getApiMessage } from "../services/http";
import {
  compactCurrency,
  formatPercent,
  percentClass,
} from "../utils/formatters";
import "./FeaturePages.css";
import "./MarketPages.css";

const NEW_LISTING_PAGE_SIZE = 6;

function Discovery() {
  const [data, setData] = useState(null);
  const [newListingsPage, setNewListingsPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadDiscovery = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      setData(await marketService.getDiscovery());
      setNewListingsPage(1);
    } catch (err) {
      setError(getApiMessage(err, "Discovery data could not be loaded."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDiscovery();
  }, [loadDiscovery]);

  if (loading) {
    return (
      <>
        <Header />
        <Loader />
      </>
    );
  }

  if (error) {
    return (
      <>
        <Header />
        <ErrorState title="Discovery unavailable" message={error} onAction={loadDiscovery} />
      </>
    );
  }

  const newListingsCount = Math.max(
    1,
    Math.ceil(data.newCoins.length / NEW_LISTING_PAGE_SIZE)
  );
  const visibleNewListings = data.newCoins.slice(
    (newListingsPage - 1) * NEW_LISTING_PAGE_SIZE,
    newListingsPage * NEW_LISTING_PAGE_SIZE
  );

  return (
    <>
      <Header />
      <main className="feature-shell">
        <div className="feature-header">
          <div>
            <h1>Market Discovery</h1>
            <p>Trending searches, hot categories, new listings, NFTs, and chains.</p>
          </div>
          <div className="page-actions">
            <Link to="/screener" className="feature-action">Screener</Link>
            <Link to="/exchanges" className="feature-action secondary">Exchanges</Link>
            <Link to="/nfts" className="feature-action secondary">NFTs</Link>
            <Link to="/converter" className="feature-action secondary">Converter</Link>
          </div>
        </div>

        <section className="market-card-grid">
          {data.trendingCoins.map((coin) => (
            <Link to={`/coin/${coin.id}`} className="market-card" key={coin.id}>
              <div className="market-card-header">
                {coin.image && <img src={coin.image} alt={coin.name} />}
                <div>
                  <h3>{coin.name}</h3>
                  <p>{coin.symbol?.toUpperCase()} #{coin.marketCapRank || "-"}</p>
                </div>
              </div>
              <strong>{compactCurrency.format(Number(coin.price) || 0)}</strong>
              <p className={percentClass(coin.change24h)}>
                {formatPercent(coin.change24h)} 24h
              </p>
            </Link>
          ))}
        </section>

        <section className="feature-panel" style={{ marginBottom: "1.5rem" }}>
          <h2>Categories</h2>
          <div className="market-card-grid">
            {data.categories.map((category) => (
              <article className="market-card" key={category.id}>
                <h3>{category.name}</h3>
                <strong>{compactCurrency.format(category.marketCap)}</strong>
                <p className={percentClass(category.change24h)}>
                  {formatPercent(category.change24h)} market cap change
                </p>
              </article>
            ))}
          </div>
        </section>

        <section className="feature-grid">
          <div className="feature-panel">
            <div className="section-toolbar">
              <h2>New Listings</h2>
              <span>
                Page {newListingsPage} of {newListingsCount}
              </span>
            </div>
            <div className="feature-list">
              {visibleNewListings.map((coin) => (
                <Link to={`/coin/${coin.id}`} className="feature-list-item" key={coin.id}>
                  <div>
                    <h3>{coin.name}</h3>
                    <p className="feature-muted">{coin.symbol?.toUpperCase()}</p>
                  </div>
                  <span className="market-chip">New</span>
                </Link>
              ))}
            </div>
            {newListingsCount > 1 && (
              <PaginationComponent
                page={newListingsPage}
                count={newListingsCount}
                handlePageChange={(event, value) => setNewListingsPage(value)}
              />
            )}
          </div>

          <div className="feature-panel">
            <h2>Trending NFTs & Chains</h2>
            <div className="chip-row" style={{ marginBottom: "1rem" }}>
              {data.trendingNfts.map((nft) => (
                <span className="market-chip" key={nft.id || nft.name}>{nft.name}</span>
              ))}
            </div>
            <div className="chip-row">
              {data.chains.map((chain) => (
                <span className="market-chip" key={chain.id}>{chain.name}</span>
              ))}
            </div>
          </div>
        </section>
      </main>
    </>
  );
}

export default Discovery;
