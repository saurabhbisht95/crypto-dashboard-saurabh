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
const FIAT_CURRENCY_CODES = new Set(FIAT_OPTIONS);

const currencyLocales = {
  usd: "en-US",
  inr: "en-IN",
  eur: "de-DE",
  gbp: "en-GB",
  jpy: "ja-JP",
  aud: "en-AU",
  cad: "en-CA",
  sgd: "en-SG",
};

const getCurrencyFormatter = (currencyCode) =>
  new Intl.NumberFormat(currencyLocales[currencyCode] || "en-US", {
    style: "currency",
    currency: currencyCode.toUpperCase(),
    maximumFractionDigits: currencyCode === "jpy" ? 0 : 2,
  });

const formatConvertedValue = (value, target) => {
  const number = Number(value);

  if (!Number.isFinite(number)) return "-";

  if (FIAT_CURRENCY_CODES.has(target)) {
    return getCurrencyFormatter(target).format(number);
  }

  return `${preciseNumber.format(number)} ${target.toUpperCase()}`;
};

const getAssetLabel = (assetId, coins) => {
  if (FIAT_CURRENCY_CODES.has(assetId)) {
    return assetId.toUpperCase();
  }

  const coin = coins.find((item) => item.id === assetId);
  return coin ? coin.symbol.toUpperCase() : assetId.toUpperCase();
};

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
    if (!form.amount || Number(form.amount) <= 0 || !form.from || !form.to) {
      return;
    }

    setConverting(true);
    setError("");

    try {
      setResult(await marketService.convert(form));
    } catch (err) {
      setError(getApiMessage(err, "Conversion could not be loaded."));
    } finally {
      setConverting(false);
    }
  }, [form]);

  useEffect(() => {
    if (loading) return undefined;

    const timeoutId = setTimeout(() => {
      convert();
    }, 450);

    return () => clearTimeout(timeoutId);
  }, [convert, loading]);

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

  const resultMatchesForm =
    result?.from === form.from &&
    result?.to === form.to &&
    Number(result?.amount) === Number(form.amount);
  const displayResult = resultMatchesForm ? result : null;

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
            <span className="feature-muted">
              {converting ? "Updating live rate..." : "Converted Value"}
            </span>
            <strong>
              {displayResult
                ? formatConvertedValue(displayResult.value, displayResult.to)
                : "-"}
            </strong>
            <p className="feature-muted">
              1 {getAssetLabel(displayResult?.from || form.from, coins)} ={" "}
              {displayResult
                ? formatConvertedValue(displayResult.rate, displayResult.to)
                : "-"}
            </p>
            {displayResult?.updatedAt && (
              <p className="feature-muted">
                Live backend rate checked at{" "}
                {new Date(displayResult.updatedAt).toLocaleTimeString()}
              </p>
            )}
          </div>
        </section>
      </main>
    </>
  );
}

export default Converter;
