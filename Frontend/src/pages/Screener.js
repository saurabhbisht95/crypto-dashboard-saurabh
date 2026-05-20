import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import ErrorState from "../components/Common/ErrorState";
import Header from "../components/Common/Header";
import Loader from "../components/Common/Loader";
import PaginationComponent from "../components/Dashboard/Pagination";
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

const ORDER_OPTIONS = [
  { value: "market_cap_desc", label: "Market Cap" },
  { value: "volume_desc", label: "Volume" },
  { value: "id_asc", label: "Name" },
];

const PAGE_SIZE = 12;

function Screener() {
  const [categories, setCategories] = useState([]);
  const [coins, setCoins] = useState([]);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({
    category: "",
    order: "market_cap_desc",
    minMarketCap: "",
    minVolume: "",
    minChange24h: "",
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const params = useMemo(
    () =>
      Object.fromEntries(
        Object.entries({
          perPage: 100,
          category: filters.category,
          order: filters.order,
          minMarketCap: filters.minMarketCap,
          minVolume: filters.minVolume,
          minChange24h: filters.minChange24h,
        }).filter(([, value]) => value !== "")
      ),
    [filters]
  );

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [categoryData, screenerData] = await Promise.all([
        marketService.getCategories(),
        marketService.getScreener(params),
      ]);
      setCategories(categoryData.slice(0, 80));
      setCoins(screenerData.coins);
      setPage(1);
    } catch (err) {
      setError(getApiMessage(err, "Screener data could not be loaded."));
    } finally {
      setLoading(false);
    }
  }, [params]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setFilters((currentFilters) => ({ ...currentFilters, [name]: value }));
    setPage(1);
  };

  const pageCount = Math.max(1, Math.ceil(coins.length / PAGE_SIZE));
  const visibleCoins = coins.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

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
        <ErrorState title="Screener unavailable" message={error} onAction={loadData} />
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="feature-shell">
        <div className="feature-header">
          <div>
            <h1>Crypto Screener</h1>
            <p>Filter coins by category, liquidity, market cap, and momentum.</p>
          </div>
        </div>

        <section className="feature-panel">
          <form
            className="screener-controls feature-form"
            onSubmit={(event) => {
              event.preventDefault();
              loadData();
            }}
          >
            <label>
              Category
              <select name="category" value={filters.category} onChange={handleFilterChange}>
                <option value="">All categories</option>
                {categories.map((category) => (
                  <option value={category.id} key={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Sort
              <select name="order" value={filters.order} onChange={handleFilterChange}>
                {ORDER_OPTIONS.map((option) => (
                  <option value={option.value} key={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Min Market Cap
              <input
                name="minMarketCap"
                type="number"
                placeholder="100000000"
                value={filters.minMarketCap}
                onChange={handleFilterChange}
              />
            </label>
            <label>
              Min 24h Volume
              <input
                name="minVolume"
                type="number"
                placeholder="5000000"
                value={filters.minVolume}
                onChange={handleFilterChange}
              />
            </label>
            <label>
              Min 24h %
              <input
                name="minChange24h"
                type="number"
                placeholder="0"
                value={filters.minChange24h}
                onChange={handleFilterChange}
              />
            </label>
            <button type="submit">Apply Filters</button>
          </form>

          <div className="table-scroll">
            <div className="section-toolbar">
              <span>{coins.length} assets matched</span>
              <span>
                Page {page} of {pageCount}
              </span>
            </div>
            <table className="market-table">
              <thead>
                <tr>
                  <th>Coin</th>
                  <th>Price</th>
                  <th>1h</th>
                  <th>24h</th>
                  <th>7d</th>
                  <th>30d</th>
                  <th>Volume</th>
                  <th>Market Cap</th>
                  <th>MC/FDV</th>
                </tr>
              </thead>
              <tbody>
                {visibleCoins.map((coin) => (
                  <tr key={coin.id}>
                    <td>
                      <Link to={`/coin/${coin.id}`}>
                        {coin.symbol?.toUpperCase()} · {coin.name}
                      </Link>
                    </td>
                    <td>{currency.format(coin.current_price || 0)}</td>
                    <td className={percentClass(coin.price_change_percentage_1h_in_currency)}>
                      {formatPercent(coin.price_change_percentage_1h_in_currency)}
                    </td>
                    <td className={percentClass(coin.price_change_percentage_24h_in_currency)}>
                      {formatPercent(coin.price_change_percentage_24h_in_currency)}
                    </td>
                    <td className={percentClass(coin.price_change_percentage_7d_in_currency)}>
                      {formatPercent(coin.price_change_percentage_7d_in_currency)}
                    </td>
                    <td className={percentClass(coin.price_change_percentage_30d_in_currency)}>
                      {formatPercent(coin.price_change_percentage_30d_in_currency)}
                    </td>
                    <td>{compactCurrency.format(coin.total_volume || 0)}</td>
                    <td>{compactCurrency.format(coin.market_cap || 0)}</td>
                    <td>
                      {coin.market_cap_to_fdv
                        ? coin.market_cap_to_fdv.toFixed(2)
                        : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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

export default Screener;
