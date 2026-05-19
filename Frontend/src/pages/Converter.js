import React, { useCallback, useEffect, useMemo, useState } from "react";
import ErrorState from "../components/Common/ErrorState";
import Header from "../components/Common/Header";
import Loader from "../components/Common/Loader";
import { getApiMessage } from "../services/http";
import { marketService } from "../services/marketService";
import { preciseNumber } from "../utils/formatters";
import "./FeaturePages.css";
import "./MarketPages.css";

const FIAT_OPTIONS = ["usd", "inr", "eur", "gbp", "jpy", "aud", "cad", "sgd"];

function Converter() {
  const [coins, setCoins] = useState([]);
  const [result, setResult] = useState(null);
  const [form, setForm] = useState({
    amount: "1",
    from: "bitcoin",
    to: "usd",
  });
  const [loading, setLoading] = useState(true);
  const [converting, setConverting] = useState(false);
  const [error, setError] = useState("");

  const toOptions = useMemo(
    () => [
      ...FIAT_OPTIONS.map((currencyCode) => ({
        id: currencyCode,
        name: currencyCode.toUpperCase(),
      })),
      ...coins.slice(0, 50),
    ],
    [coins]
  );

  const convert = useCallback(async () => {
    setConverting(true);

    try {
      setResult(await marketService.convert(form));
    } catch (err) {
      setError(getApiMessage(err, "Conversion could not be loaded."));
    } finally {
      setConverting(false);
    }
  }, [form]);

  useEffect(() => {
    const loadCoins = async () => {
      setLoading(true);
      setError("");

      try {
        const coinList = await marketService.getCoins({ perPage: 100 });
        setCoins(coinList);
        setResult(
          await marketService.convert({
            amount: "1",
            from: "bitcoin",
            to: "usd",
          })
        );
      } catch (err) {
        setError(getApiMessage(err, "Converter could not be loaded."));
      } finally {
        setLoading(false);
      }
    };

    loadCoins();
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((currentForm) => ({ ...currentForm, [name]: value }));
  };

  if (loading) {
    return (
      <>
        <Header />
        <Loader />
      </>
    );
  }

  if (error && !result) {
    return (
      <>
        <Header />
        <ErrorState title="Converter unavailable" message={error} onAction={convert} />
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="feature-shell">
        <div className="feature-header">
          <div>
            <h1>Crypto Converter</h1>
            <p>Convert crypto to fiat or another crypto asset with live backend prices.</p>
          </div>
        </div>
        <section className="converter-grid">
          <div className="feature-panel">
            <h2>Convert</h2>
            <form
              className="feature-form"
              onSubmit={(event) => {
                event.preventDefault();
                convert();
              }}
            >
              <label>
                Amount
                <input
                  type="number"
                  min="0"
                  step="any"
                  name="amount"
                  value={form.amount}
                  onChange={handleChange}
                />
              </label>
              <label>
                From
                <select name="from" value={form.from} onChange={handleChange}>
                  {coins.map((coin) => (
                    <option value={coin.id} key={coin.id}>
                      {coin.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                To
                <select name="to" value={form.to} onChange={handleChange}>
                  {toOptions.map((option) => (
                    <option value={option.id} key={option.id}>
                      {option.name}
                    </option>
                  ))}
                </select>
              </label>
              <button type="submit" disabled={converting}>
                {converting ? "Converting..." : "Convert"}
              </button>
            </form>
          </div>

          <div className="feature-panel converter-result">
            <span className="feature-muted">Converted Value</span>
            <strong>{result ? preciseNumber.format(result.value) : "-"}</strong>
            <p className="feature-muted">
              1 {form.from.toUpperCase()} = {result ? preciseNumber.format(result.rate) : "-"}{" "}
              {form.to.toUpperCase()}
            </p>
          </div>
        </section>
      </main>
    </>
  );
}

export default Converter;
