import React, { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import ErrorState from "../components/Common/ErrorState";
import Header from "../components/Common/Header";
import Loader from "../components/Common/Loader";
import { alertService } from "../services/alertService";
import { getApiMessage } from "../services/http";
import { marketService } from "../services/marketService";
import "./FeaturePages.css";

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
});

function Alerts() {
  const [coins, setCoins] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    coinId: "",
    direction: "above",
    targetPrice: "",
  });

  const selectedCoin = useMemo(
    () => coins.find((coin) => coin.id === form.coinId),
    [coins, form.coinId]
  );

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [coinList, alertList] = await Promise.all([
        marketService.getCoins({ perPage: 100 }),
        alertService.getAlerts(),
      ]);
      setCoins(coinList);
      setAlerts(alertList);
      setForm((currentForm) =>
        currentForm.coinId || !coinList[0]
          ? currentForm
          : { ...currentForm, coinId: coinList[0].id }
      );
    } catch (err) {
      setError(getApiMessage(err, "Alerts could not be loaded."));
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
      const updatedAlerts = await alertService.createAlert({
        coinId: selectedCoin.id,
        symbol: selectedCoin.symbol,
        name: selectedCoin.name,
        direction: form.direction,
        targetPrice: Number(form.targetPrice),
      });
      setAlerts(updatedAlerts);
      toast.success("Alert created.");
      setForm((currentForm) => ({ ...currentForm, targetPrice: "" }));
    } catch (err) {
      toast.error(getApiMessage(err, "Alert could not be created."));
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (alertId) => {
    try {
      const updatedAlerts = await alertService.toggleAlert(alertId);
      setAlerts(updatedAlerts);
    } catch (err) {
      toast.error(getApiMessage(err, "Alert could not be updated."));
    }
  };

  const handleDelete = async (alertId) => {
    try {
      const updatedAlerts = await alertService.deleteAlert(alertId);
      setAlerts(updatedAlerts);
      toast.success("Alert removed.");
    } catch (err) {
      toast.error(getApiMessage(err, "Alert could not be removed."));
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
          title="Alerts could not be loaded"
          message={error}
          onAction={loadData}
        />
      </>
    );
  }

  const activeAlerts = alerts.filter((alert) => alert.active).length;
  const triggeredAlerts = alerts.filter((alert) => alert.triggered).length;

  return (
    <>
      <Header />
      <main className="feature-shell">
        <div className="feature-header">
          <div>
            <h1>Price Alerts</h1>
            <p>Store target prices and let the backend evaluate alert status.</p>
          </div>
        </div>

        <section className="metric-grid">
          <div className="metric-card">
            <span>Total Alerts</span>
            <strong>{alerts.length}</strong>
          </div>
          <div className="metric-card">
            <span>Active</span>
            <strong>{activeAlerts}</strong>
          </div>
          <div className="metric-card">
            <span>Triggered</span>
            <strong>{triggeredAlerts}</strong>
          </div>
          <div className="metric-card">
            <span>Watching</span>
            <strong>{new Set(alerts.map((alert) => alert.coinId)).size}</strong>
          </div>
        </section>

        <section className="feature-grid">
          <div className="feature-panel">
            <h2>Create Alert</h2>
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
                Direction
                <select
                  value={form.direction}
                  onChange={(event) =>
                    setForm((currentForm) => ({
                      ...currentForm,
                      direction: event.target.value,
                    }))
                  }
                >
                  <option value="above">Above target</option>
                  <option value="below">Below target</option>
                </select>
              </label>
              <label>
                Target Price
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={form.targetPrice}
                  onChange={(event) =>
                    setForm((currentForm) => ({
                      ...currentForm,
                      targetPrice: event.target.value,
                    }))
                  }
                  placeholder="100000"
                  required
                />
              </label>
              <button type="submit" disabled={saving}>
                {saving ? "Creating..." : "Create Alert"}
              </button>
            </form>
          </div>

          <div className="feature-panel">
            <h2>Alerts</h2>
            <div className="feature-list">
              {alerts.length ? (
                alerts.map((alert) => (
                  <article className="feature-list-item" key={alert.id}>
                    <div>
                      <div className="asset-line">
                        <div>
                          <h3>{alert.name}</h3>
                          <p>
                            {alert.symbol.toUpperCase()} is {alert.direction}{" "}
                            {currency.format(alert.targetPrice)}
                          </p>
                        </div>
                      </div>
                      <div className="feature-values">
                        <div>
                          <span>Current</span>
                          <strong>{currency.format(alert.currentPrice)}</strong>
                        </div>
                        <div>
                          <span>24h Change</span>
                          <strong
                            className={
                              alert.priceChange24h >= 0 ? "positive" : "negative"
                            }
                          >
                            {alert.priceChange24h.toFixed(2)}%
                          </strong>
                        </div>
                        <div>
                          <span>Status</span>
                          <strong>{alert.triggered ? "Triggered" : "Watching"}</strong>
                        </div>
                        <div>
                          <span>Mode</span>
                          <strong>{alert.active ? "Active" : "Paused"}</strong>
                        </div>
                      </div>
                    </div>
                    <div className="feature-list">
                      <button
                        className="feature-action secondary"
                        onClick={() => handleToggle(alert.id)}
                      >
                        {alert.active ? "Pause" : "Resume"}
                      </button>
                      <button
                        className="feature-action secondary"
                        onClick={() => handleDelete(alert.id)}
                      >
                        Remove
                      </button>
                    </div>
                  </article>
                ))
              ) : (
                <div className="empty-panel">No alerts created yet.</div>
              )}
            </div>
          </div>
        </section>
      </main>
    </>
  );
}

export default Alerts;
