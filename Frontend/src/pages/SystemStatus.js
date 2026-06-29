import React, { useEffect, useState } from "react";
import ErrorState from "../components/Common/ErrorState";
import Header from "../components/Common/Header";
import Loader from "../components/Common/Loader";
import { getApiMessage } from "../services/http";
import { systemService } from "../services/systemService";
import "./FeaturePages.css";

function SystemStatus() {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadStatus = async () => {
    setLoading(true);
    setError("");

    try {
      const data = await systemService.getStatus();
      setStatus(data);
    } catch (err) {
      setError(getApiMessage(err, "System status could not be loaded."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStatus();
    const intervalId = setInterval(loadStatus, 60000);

    return () => clearInterval(intervalId);
  }, []);

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
        <ErrorState title="System status unavailable" message={error} onAction={loadStatus} />
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="feature-shell">
        <div className="feature-header">
          <div>
            <h1>System Status</h1>
            <p>Operational view of API, database, cache, alerts, and live mode.</p>
          </div>
        </div>
        <section className="metric-grid">
          <div className="metric-card">
            <span>API</span>
            <strong className="positive">{status.api}</strong>
          </div>
          <div className="metric-card">
            <span>MongoDB</span>
            <strong className={status.mongodb === "connected" ? "positive" : "negative"}>
              {status.mongodb}
            </strong>
          </div>
          <div className="metric-card">
            <span>Cache Entries</span>
            <strong>{status.cache.activeEntries}</strong>
          </div>
          <div className="metric-card">
            <span>Live Data</span>
            <strong>{status.liveMode}</strong>
          </div>
        </section>
        <section className="feature-panel">
          <h2>Runtime Details</h2>
          <div className="feature-values">
            <div>
              <span>Alert interval</span>
              <strong>{Math.round(status.alertCheckIntervalMs / 1000)}s</strong>
            </div>
            <div>
              <span>Market provider</span>
              <strong>{status.marketProvider || "coinlore"}</strong>
            </div>
            <div>
              <span>Cache provider</span>
              <strong>{status.cache.provider}</strong>
            </div>
            <div>
              <span>Checked at</span>
              <strong>{new Date(status.timestamp).toLocaleTimeString()}</strong>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}

export default SystemStatus;
