import React, { useCallback, useEffect, useState } from "react";
import ErrorState from "../components/Common/ErrorState";
import Header from "../components/Common/Header";
import Loader from "../components/Common/Loader";
import PaginationComponent from "../components/Dashboard/Pagination";
import { getApiMessage } from "../services/http";
import { marketService } from "../services/marketService";
import { compactNumber } from "../utils/formatters";
import "./FeaturePages.css";
import "./MarketPages.css";

const PAGE_SIZE = 20;

function Exchanges() {
  const [exchanges, setExchanges] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadExchanges = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      setExchanges(await marketService.getExchanges({ perPage: 80 }));
      setPage(1);
    } catch (err) {
      setError(getApiMessage(err, "Exchange data could not be loaded."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadExchanges();
  }, [loadExchanges]);

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
        <ErrorState title="Exchanges unavailable" message={error} onAction={loadExchanges} />
      </>
    );
  }

  const pageCount = Math.max(1, Math.ceil(exchanges.length / PAGE_SIZE));
  const visibleExchanges = exchanges.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <>
      <Header />
      <main className="feature-shell">
        <div className="feature-header">
          <div>
            <h1>Exchange Rankings</h1>
            <p>Spot exchange quality, trust score, geography, and BTC volume.</p>
          </div>
        </div>
        <section className="feature-panel table-scroll">
          <div className="section-toolbar">
            <span>{exchanges.length} ranked exchanges</span>
            <span>
              Page {page} of {pageCount}
            </span>
          </div>
          <table className="market-table">
            <thead>
              <tr>
                <th>Exchange</th>
                <th>Trust</th>
                <th>Rank</th>
                <th>24h BTC Volume</th>
                <th>Country</th>
                <th>Year</th>
              </tr>
            </thead>
            <tbody>
              {visibleExchanges.map((exchange) => (
                <tr key={exchange.id}>
                  <td>
                    <a href={exchange.url} target="_blank" rel="noreferrer">
                      {exchange.name}
                    </a>
                  </td>
                  <td className={exchange.trustScore >= 8 ? "positive" : ""}>
                    {exchange.trustScore}/10
                  </td>
                  <td>#{exchange.trustScoreRank}</td>
                  <td>{compactNumber.format(exchange.tradeVolume24hBtc)} BTC</td>
                  <td>{exchange.country}</td>
                  <td>{exchange.yearEstablished || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {pageCount > 1 && (
            <PaginationComponent
              page={page}
              count={pageCount}
              handlePageChange={(event, value) => setPage(value)}
            />
          )}
        </section>
      </main>
    </>
  );
}

export default Exchanges;
