import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Doughnut } from "react-chartjs-2";
import "chart.js/auto";
import { toast } from "react-toastify";
import ErrorState from "../components/Common/ErrorState";
import Header from "../components/Common/Header";
import Loader from "../components/Common/Loader";
import { marketService } from "../services/marketService";
import { portfolioService } from "../services/portfolioService";
import { getApiMessage } from "../services/http";
import "./FeaturePages.css";
import "./MarketPages.css";

const ALLOCATION_COLORS = [
  "#3a80e9",
  "#61c96f",
  "#f9c74f",
  "#f94141",
  "#9b5de5",
  "#00b4d8",
];

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
});

const number = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 6,
});

const getEmptyPortfolio = () => ({
  holdings: [],
  summary: {
    investedValue: 0,
    currentValue: 0,
    profitLoss: 0,
    profitLossPercentage: 0,
  },
  allocation: [],
});

function Portfolio() {
  const [coins, setCoins] = useState([]);
  const [portfolio, setPortfolio] = useState(getEmptyPortfolio());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    coinId: "",
    amount: "",
    averageBuyPrice: "",
  });

  const selectedCoin = useMemo(
    () => coins.find((coin) => coin.id === form.coinId),
    [coins, form.coinId]
  );

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [coinList, portfolioData] = await Promise.all([
        marketService.getCoins({ perPage: 100 }),
        portfolioService.getPortfolio(),
      ]);
      setCoins(coinList);
      setPortfolio(portfolioData);
      setForm((currentForm) =>
        currentForm.coinId || !coinList[0]
          ? currentForm
          : { ...currentForm, coinId: coinList[0].id }
      );
    } catch (err) {
      setError(getApiMessage(err, "Portfolio could not be loaded."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!selectedCoin) {
      toast.error("Select a coin.");
      return;
    }

    setSaving(true);

    try {
      const updatedPortfolio = await portfolioService.saveHolding({
        coinId: selectedCoin.id,
        symbol: selectedCoin.symbol,
        name: selectedCoin.name,
        amount: Number(form.amount),
        averageBuyPrice: Number(form.averageBuyPrice),
      });
      setPortfolio(updatedPortfolio);
      toast.success("Holding saved.");
      setForm((currentForm) => ({
        ...currentForm,
        amount: "",
        averageBuyPrice: "",
      }));
    } catch (err) {
      toast.error(getApiMessage(err, "Holding could not be saved."));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (holdingId) => {
    try {
      const updatedPortfolio = await portfolioService.deleteHolding(holdingId);
      setPortfolio(updatedPortfolio);
      toast.success("Holding removed.");
    } catch (err) {
      toast.error(getApiMessage(err, "Holding could not be removed."));
    }
  };

  const handleExportCsv = () => {
    const header = [
      "Coin",
      "Symbol",
      "Amount",
      "Average Buy Price",
      "Current Price",
      "Current Value",
      "Invested Value",
      "Profit Loss",
      "Profit Loss %",
    ];
    const rows = portfolio.holdings.map((holding) => [
      holding.name,
      holding.symbol,
      holding.amount,
      holding.averageBuyPrice,
      holding.currentPrice,
      holding.currentValue,
      holding.investedValue,
      holding.profitLoss,
      holding.profitLossPercentage,
    ]);
    const csv = [header, ...rows]
      .map((row) =>
        row
          .map((cell) => `"${String(cell ?? "").replaceAll('"', '""')}"`)
          .join(",")
      )
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "cryptotracker-portfolio.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

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
        <ErrorState
          title="Portfolio could not be loaded"
          message={error}
          onAction={loadData}
        />
      </>
    );
  }

  const summary = portfolio.summary;
  const topAllocation = Math.max(
    0,
    ...portfolio.allocation.map((asset) => asset.percentage)
  );
  const riskScore = Math.min(
    100,
    topAllocation +
      (portfolio.holdings.length < 3 ? 20 : 0) +
      Math.abs(summary.profitLossPercentage) * 0.35
  );
  const allocationChartData = {
    labels: portfolio.allocation.map((asset) => asset.name),
    datasets: [
      {
        data: portfolio.allocation.map((asset) => asset.value),
        backgroundColor: portfolio.allocation.map(
          (_, index) => ALLOCATION_COLORS[index % ALLOCATION_COLORS.length]
        ),
        borderWidth: 0,
      },
    ],
  };
  const bestHolding = [...portfolio.holdings].sort(
    (a, b) => b.profitLossPercentage - a.profitLossPercentage
  )[0];
  const weakestHolding = [...portfolio.holdings].sort(
    (a, b) => a.profitLossPercentage - b.profitLossPercentage
  )[0];

  return (
    <>
      <Header />
      <main className="feature-shell">
        <div className="feature-header">
          <div>
            <h1>Portfolio</h1>
            <p>Track holdings, live value, allocation, and profit/loss.</p>
          </div>
          <button className="feature-action" onClick={handleExportCsv}>
            Export CSV
          </button>
        </div>

        <section className="metric-grid">
          <div className="metric-card">
            <span>Current Value</span>
            <strong>{currency.format(summary.currentValue)}</strong>
          </div>
          <div className="metric-card">
            <span>Invested</span>
            <strong>{currency.format(summary.investedValue)}</strong>
          </div>
          <div className="metric-card">
            <span>Profit / Loss</span>
            <strong className={summary.profitLoss >= 0 ? "positive" : "negative"}>
              {currency.format(summary.profitLoss)}
            </strong>
          </div>
          <div className="metric-card">
            <span>P/L Percentage</span>
            <strong
              className={
                summary.profitLossPercentage >= 0 ? "positive" : "negative"
              }
            >
              {summary.profitLossPercentage.toFixed(2)}%
            </strong>
          </div>
          <div className="metric-card">
            <span>Risk Score</span>
            <strong className={riskScore > 70 ? "negative" : riskScore > 45 ? "" : "positive"}>
              {riskScore.toFixed(0)}/100
            </strong>
          </div>
          <div className="metric-card">
            <span>Best Holding</span>
            <strong className="positive">
              {bestHolding
                ? `${bestHolding.symbol.toUpperCase()} ${bestHolding.profitLossPercentage.toFixed(2)}%`
                : "-"}
            </strong>
          </div>
          <div className="metric-card">
            <span>Weakest Holding</span>
            <strong className="negative">
              {weakestHolding
                ? `${weakestHolding.symbol.toUpperCase()} ${weakestHolding.profitLossPercentage.toFixed(2)}%`
                : "-"}
            </strong>
          </div>
        </section>

        <section className="feature-grid" style={{ marginBottom: "1.25rem" }}>
          <div className="feature-panel">
            <h2>Allocation</h2>
            {portfolio.allocation.length ? (
              <Doughnut
                data={allocationChartData}
                options={{
                  plugins: {
                    legend: {
                      labels: {
                        color: "var(--white)",
                      },
                    },
                  },
                }}
              />
            ) : (
              <div className="empty-panel">No allocation data.</div>
            )}
          </div>
          <div className="feature-panel">
            <h2>Allocation Breakdown</h2>
            <div className="feature-list">
              {portfolio.allocation.map((asset) => (
                <article className="market-card" key={asset.coinId}>
                  <h3>{asset.name}</h3>
                  <p>{currency.format(asset.value)}</p>
                  <div className="allocation-bar">
                    <span
                      className="allocation-fill"
                      style={{ width: `${Math.min(asset.percentage, 100)}%` }}
                    />
                  </div>
                  <p>{asset.percentage.toFixed(2)}%</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="feature-grid">
          <div className="feature-panel">
            <h2>Add Holding</h2>
            <form className="feature-form" onSubmit={handleSubmit}>
              <label>
                Coin
                <select
                  value={form.coinId}
                  onChange={(event) =>
                    setForm((currentForm) => ({
                      ...currentForm,
                      coinId: event.target.value,
                    }))
                  }
                >
                  {coins.map((coin) => (
                    <option key={coin.id} value={coin.id}>
                      {coin.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Amount
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={form.amount}
                  onChange={(event) =>
                    setForm((currentForm) => ({
                      ...currentForm,
                      amount: event.target.value,
                    }))
                  }
                  placeholder="0.25"
                  required
                />
              </label>
              <label>
                Average Buy Price
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={form.averageBuyPrice}
                  onChange={(event) =>
                    setForm((currentForm) => ({
                      ...currentForm,
                      averageBuyPrice: event.target.value,
                    }))
                  }
                  placeholder="50000"
                  required
                />
              </label>
              <button type="submit" disabled={saving}>
                {saving ? "Saving..." : "Save Holding"}
              </button>
            </form>
          </div>

          <div className="feature-panel">
            <h2>Holdings</h2>
            <div className="feature-list">
              {portfolio.holdings.length ? (
                portfolio.holdings.map((holding) => (
                  <article className="feature-list-item" key={holding.id}>
                    <div>
                      <div className="asset-line">
                        {holding.image && <img src={holding.image} alt={holding.name} />}
                        <div>
                          <h3>{holding.name}</h3>
                          <p>{holding.symbol.toUpperCase()}</p>
                        </div>
                      </div>
                      <div className="feature-values">
                        <div>
                          <span>Amount</span>
                          <strong>{number.format(holding.amount)}</strong>
                        </div>
                        <div>
                          <span>Current Price</span>
                          <strong>{currency.format(holding.currentPrice)}</strong>
                        </div>
                        <div>
                          <span>Value</span>
                          <strong>{currency.format(holding.currentValue)}</strong>
                        </div>
                        <div>
                          <span>P/L</span>
                          <strong
                            className={
                              holding.profitLoss >= 0 ? "positive" : "negative"
                            }
                          >
                            {currency.format(holding.profitLoss)}
                          </strong>
                        </div>
                      </div>
                    </div>
                    <button
                      className="feature-action secondary"
                      onClick={() => handleDelete(holding.id)}
                    >
                      Remove
                    </button>
                  </article>
                ))
              ) : (
                <div className="empty-panel">No holdings added yet.</div>
              )}
            </div>
          </div>
        </section>

        <section className="feature-panel" style={{ marginTop: "1.25rem" }}>
          <h2>Position Ledger</h2>
          <div className="table-scroll">
            <table className="market-table">
              <thead>
                <tr>
                  <th>Asset</th>
                  <th>Amount</th>
                  <th>Avg Buy</th>
                  <th>Current</th>
                  <th>P/L</th>
                  <th>Updated</th>
                </tr>
              </thead>
              <tbody>
                {portfolio.holdings.map((holding) => (
                  <tr key={holding.id}>
                    <td>{holding.symbol.toUpperCase()} · {holding.name}</td>
                    <td>{number.format(holding.amount)}</td>
                    <td>{currency.format(holding.averageBuyPrice)}</td>
                    <td>{currency.format(holding.currentPrice)}</td>
                    <td className={holding.profitLoss >= 0 ? "positive" : "negative"}>
                      {currency.format(holding.profitLoss)}
                    </td>
                    <td>{new Date(holding.updatedAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </>
  );
}

export default Portfolio;
