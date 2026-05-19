import React, { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import ErrorState from "../components/Common/ErrorState";
import Header from "../components/Common/Header";
import Loader from "../components/Common/Loader";
import { marketService } from "../services/marketService";
import { portfolioService } from "../services/portfolioService";
import { getApiMessage } from "../services/http";
import "./FeaturePages.css";

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

  return (
    <>
      <Header />
      <main className="feature-shell">
        <div className="feature-header">
          <div>
            <h1>Portfolio</h1>
            <p>Track holdings, live value, allocation, and profit/loss.</p>
          </div>
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
      </main>
    </>
  );
}

export default Portfolio;
