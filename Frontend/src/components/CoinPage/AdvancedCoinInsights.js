import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { marketService } from "../../services/marketService";
import {
  compactCurrency,
  compactNumber,
  currency,
  formatPercent,
  percentClass,
} from "../../utils/formatters";
import "../../pages/FeaturePages.css";
import "../../pages/MarketPages.css";

const getSafeUrl = (urls = []) => urls.find(Boolean) || "";

function OhlcCandles({ candles }) {
  const visibleCandles = candles.slice(-30);
  const { minLow, maxHigh } = useMemo(
    () =>
      visibleCandles.reduce(
        (bounds, candle) => ({
          minLow: Math.min(bounds.minLow, candle.low),
          maxHigh: Math.max(bounds.maxHigh, candle.high),
        }),
        { minLow: Infinity, maxHigh: -Infinity }
      ),
    [visibleCandles]
  );
  const range = Math.max(maxHigh - minLow, 1);

  if (!visibleCandles.length) {
    return <p className="feature-muted">OHLC data is unavailable.</p>;
  }

  return (
    <div className="ohlc-strip">
      {visibleCandles.map((candle) => {
        const isUp = candle.close >= candle.open;
        const highTop = ((maxHigh - candle.high) / range) * 100;
        const wickHeight = ((candle.high - candle.low) / range) * 100;
        const bodyTop = ((maxHigh - Math.max(candle.open, candle.close)) / range) * 100;
        const bodyHeight =
          (Math.abs(candle.close - candle.open) / range) * 100;

        return (
          <div
            className={`ohlc-candle ${isUp ? "up" : "down"}`}
            key={candle.timestamp}
            title={`${new Date(candle.timestamp).toLocaleDateString()} O ${currency.format(
              candle.open
            )} H ${currency.format(candle.high)} L ${currency.format(
              candle.low
            )} C ${currency.format(candle.close)}`}
          >
            <span
              className="ohlc-wick"
              style={{ top: `${highTop}%`, height: `${Math.max(wickHeight, 2)}%` }}
            />
            <span
              className="ohlc-body"
              style={{
                top: `${bodyTop}%`,
                height: `${Math.max(bodyHeight, 3)}%`,
              }}
            />
          </div>
        );
      })}
    </div>
  );
}

function AdvancedCoinInsights({ coinId }) {
  const [advanced, setAdvanced] = useState(null);

  useEffect(() => {
    let isActive = true;

    marketService
      .getCoinAdvanced(coinId, { days: 30 })
      .then((data) => {
        if (isActive) setAdvanced(data);
      })
      .catch(() => {});

    return () => {
      isActive = false;
    };
  }, [coinId]);

  if (!advanced) return null;

  const market = advanced.overview.market || {};
  const links = advanced.overview.links || {};
  const homepage = getSafeUrl(links.homepage);
  const blockchainSite = getSafeUrl(links.blockchain_site);

  return (
    <section className="feature-shell">
      <div className="feature-header">
        <div>
          <h1>Advanced Market View</h1>
          <p>OHLC candles, supply, ATH/ATL, markets, links, and related assets.</p>
        </div>
      </div>

      <section className="metric-grid">
        <div className="metric-card">
          <span>Circulating Supply</span>
          <strong>{compactNumber.format(market.circulating_supply || 0)}</strong>
        </div>
        <div className="metric-card">
          <span>Total Supply</span>
          <strong>{compactNumber.format(market.total_supply || 0)}</strong>
        </div>
        <div className="metric-card">
          <span>ATH</span>
          <strong>{compactCurrency.format(market.ath?.usd || 0)}</strong>
        </div>
        <div className="metric-card">
          <span>ATL</span>
          <strong>{compactCurrency.format(market.atl?.usd || 0)}</strong>
        </div>
      </section>

      <section className="feature-grid">
        <div className="feature-panel">
          <h2>30 Day OHLC</h2>
          <OhlcCandles candles={advanced.ohlc} />
        </div>
        <div className="feature-panel">
          <h2>Project Links</h2>
          <div className="mini-link-grid">
            {homepage ? (
              <a href={homepage} target="_blank" rel="noreferrer">
                Website
              </a>
            ) : (
              <span>Website unavailable</span>
            )}
            {blockchainSite ? (
              <a href={blockchainSite} target="_blank" rel="noreferrer">
                Explorer
              </a>
            ) : (
              <span>Explorer unavailable</span>
            )}
            {links.subreddit_url ? (
              <a href={links.subreddit_url} target="_blank" rel="noreferrer">
                Reddit
              </a>
            ) : (
              <span>Reddit unavailable</span>
            )}
            {links.repos_url?.github?.[0] ? (
              <a href={links.repos_url.github[0]} target="_blank" rel="noreferrer">
                GitHub
              </a>
            ) : (
              <span>GitHub unavailable</span>
            )}
          </div>
          <div className="feature-values">
            <div>
              <span>Reddit</span>
              <strong>{compactNumber.format(advanced.overview.community.reddit_subscribers || 0)}</strong>
            </div>
            <div>
              <span>Forks</span>
              <strong>{compactNumber.format(advanced.overview.developer.forks || 0)}</strong>
            </div>
            <div>
              <span>Stars</span>
              <strong>{compactNumber.format(advanced.overview.developer.stars || 0)}</strong>
            </div>
            <div>
              <span>Commits 4w</span>
              <strong>{compactNumber.format(advanced.overview.developer.commit_count_4_weeks || 0)}</strong>
            </div>
          </div>
        </div>
      </section>

      <section className="feature-grid" style={{ marginTop: "1.25rem" }}>
        <div className="feature-panel table-scroll">
          <h2>Market Pairs</h2>
          <table className="market-table">
            <thead>
              <tr>
                <th>Exchange</th>
                <th>Pair</th>
                <th>Last</th>
                <th>Volume</th>
                <th>Trust</th>
              </tr>
            </thead>
            <tbody>
              {advanced.tickers.map((ticker) => (
                <tr key={`${ticker.market}-${ticker.base}-${ticker.target}`}>
                  <td>
                    {ticker.tradeUrl ? (
                      <a href={ticker.tradeUrl} target="_blank" rel="noreferrer">
                        {ticker.market}
                      </a>
                    ) : (
                      ticker.market
                    )}
                  </td>
                  <td>{ticker.base}/{ticker.target}</td>
                  <td>{currency.format(ticker.last || 0)}</td>
                  <td>{compactNumber.format(ticker.volume || 0)}</td>
                  <td>{ticker.trustScore || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="feature-panel">
          <h2>Related Assets</h2>
          <div className="feature-list">
            {advanced.relatedCoins.map((coin) => (
              <Link to={`/coin/${coin.id}`} className="feature-list-item" key={coin.id}>
                <div className="asset-line">
                  {coin.image && <img src={coin.image} alt={coin.name} />}
                  <div>
                    <h3>{coin.name}</h3>
                    <p>{coin.symbol?.toUpperCase()}</p>
                  </div>
                </div>
                <span className={percentClass(coin.price_change_percentage_24h)}>
                  {formatPercent(coin.price_change_percentage_24h)}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </section>
  );
}

export default AdvancedCoinInsights;
