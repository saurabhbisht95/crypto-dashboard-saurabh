import React, { useCallback, useEffect, useState } from "react";
import ErrorState from "../components/Common/ErrorState";
import Header from "../components/Common/Header";
import Loader from "../components/Common/Loader";
import { getApiMessage } from "../services/http";
import { marketService } from "../services/marketService";
import {
  compactCurrency,
  currency,
  formatPercent,
  percentClass,
} from "../utils/formatters";
import "./FeaturePages.css";
import "./MarketPages.css";

function NftMarket() {
  const [collections, setCollections] = useState([]);
  const [fallbackMode, setFallbackMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadNfts = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const data = await marketService.getNfts({ perPage: 40 });
      setCollections(data.collections);
      setFallbackMode(data.fallbackMode);
    } catch (err) {
      setError(getApiMessage(err, "NFT market data could not be loaded."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadNfts();
  }, [loadNfts]);

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
        <ErrorState title="NFT market unavailable" message={error} onAction={loadNfts} />
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="feature-shell">
        <div className="feature-header">
          <div>
            <h1>NFT Market</h1>
            <p>Floor prices, collection volume, market cap, and 24h movement.</p>
          </div>
        </div>
        {fallbackMode && (
          <div className="feature-panel" style={{ marginBottom: "1rem" }}>
            <p className="feature-muted">
              Showing public NFT collection data. Full market ranking is enabled when a paid NFT market endpoint is available.
            </p>
          </div>
        )}
        <section className="market-card-grid">
          {collections.map((collection) => (
            <article className="market-card" key={collection.id}>
              <div className="market-card-header">
                {collection.image && (
                  <img src={collection.image} alt={collection.name} />
                )}
                <div>
                  <h3>{collection.name}</h3>
                  <p>{collection.symbol || collection.platform}</p>
                </div>
              </div>
              <strong>{currency.format(collection.floorPriceUsd || 0)}</strong>
              <p className={percentClass(collection.change24h)}>
                {formatPercent(collection.change24h)} floor
              </p>
              <p>{compactCurrency.format(collection.volume24hUsd || 0)} volume</p>
              <p>{compactCurrency.format(collection.marketCapUsd || 0)} market cap</p>
            </article>
          ))}
        </section>
      </main>
    </>
  );
}

export default NftMarket;
