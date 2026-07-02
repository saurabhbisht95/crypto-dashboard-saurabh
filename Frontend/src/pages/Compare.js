import React, { useCallback, useEffect, useRef, useState } from "react";
import Info from "../components/CoinPage/Info";
import LineChart from "../components/CoinPage/LineChart";
import ToggleComponents from "../components/CoinPage/ToggleComponent";
import Header from "../components/Common/Header";
import Loader from "../components/Common/Loader";
import ErrorState from "../components/Common/ErrorState";
import SelectCoins from "../components/ComparePage/SelectCoins";
import List from "../components/Dashboard/List";
import { getApiErrorMessage } from "../functions/api";
import { get100Coins } from "../functions/get100Coins";
import { getCoinData } from "../functions/getCoinData";
import { getPrices } from "../functions/getPrices";
import { settingChartData } from "../functions/settingChartData";
import { settingCoinObject } from "../functions/settingCoinObject";
import {
  getUnsupportedBinanceMarkets,
  subscribeToBinanceTickers,
} from "../services/binanceMarketStream";
import { marketService } from "../services/marketService";
import "./FeaturePages.css";

const isLivePrice = (price) => Number.isFinite(Number(price));
const LIVE_CHART_POINTS = 180;
const MIN_CHART_UPDATE_MS = 1000;

function Compare() {
  const [allCoins, setAllCoins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const requestIdRef = useRef(0);
  const liveComparisonRef = useRef({});
  // id states
  const [crypto1, setCrypto1] = useState("bitcoin");
  const [crypto2, setCrypto2] = useState("ethereum");
  // data states
  const [coin1Data, setCoin1Data] = useState({});
  const [coin2Data, setCoin2Data] = useState({});
  // days state
  const [days, setDays] = useState(30);
  const [priceType, setPriceType] = useState("prices");
  const [chartData, setChartData] = useState({
    labels: [],
    datasets: [],
  });

  const getAllCoins = useCallback(async () => {
    try {
      const coins = await get100Coins();
      setAllCoins(Array.isArray(coins) ? coins : []);
    } catch {
      setAllCoins([]);
    }
  }, []);

  const getComparisonData = useCallback(async () => {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    setLoading(true);
    setError("");

    try {
      const [data1, data2, prices1, prices2] = await Promise.all([
        getCoinData(crypto1),
        getCoinData(crypto2),
        getPrices(crypto1, days, priceType),
        getPrices(crypto2, days, priceType),
      ]);

      if (requestId !== requestIdRef.current) return;

      const coin1 = settingCoinObject(data1, setCoin1Data);
      const coin2 = settingCoinObject(data2, setCoin2Data);
      const chartReady = settingChartData(setChartData, prices1, prices2, [
        coin1?.name || crypto1,
        coin2?.name || crypto2,
      ]);

      if (!coin1 || !coin2 || !chartReady) {
        throw new Error("Incomplete comparison data received.");
      }
    } catch (err) {
      if (requestId !== requestIdRef.current) return;

      setError(
        getApiErrorMessage(
          err,
          "Comparison data could not be loaded. Please retry or choose another coin."
        )
      );
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  }, [crypto1, crypto2, days, priceType]);

  useEffect(() => {
    getAllCoins();
  }, [getAllCoins]);

  useEffect(() => {
    getComparisonData();
  }, [getComparisonData]);

  useEffect(() => {
    liveComparisonRef.current = {
      [crypto1]: {
        price: coin1Data.current_price,
        change24h: coin1Data.price_change_percentage_24h,
      },
      [crypto2]: {
        price: coin2Data.current_price,
        change24h: coin2Data.price_change_percentage_24h,
      },
    };
  }, [
    coin1Data.current_price,
    coin1Data.price_change_percentage_24h,
    coin2Data.current_price,
    coin2Data.price_change_percentage_24h,
    crypto1,
    crypto2,
  ]);

  useEffect(() => {
    if (!coin1Data?.id || !coin2Data?.id || priceType !== "prices" || error) {
      return undefined;
    }

    let isActive = true;
    let fallbackIntervalId;
    let fallbackTimeoutId;
    let lastChartUpdateAt = 0;
    const liveMarkets = [crypto1, crypto2];
    const unsupportedMarkets = getUnsupportedBinanceMarkets(liveMarkets);

    const stopFallbackPolling = () => {
      window.clearInterval(fallbackIntervalId);
      fallbackIntervalId = undefined;
    };

    const appendComparisonPoint = () => {
      const price1 = liveComparisonRef.current[crypto1]?.price;
      const price2 = liveComparisonRef.current[crypto2]?.price;

      if (!isLivePrice(price1) || !isLivePrice(price2)) return;

      setChartData((currentChart) => {
        if (currentChart.datasets?.length < 2) {
          return currentChart;
        }

        return {
          labels: [
            ...currentChart.labels.slice(-(LIVE_CHART_POINTS - 1)),
            new Date().toLocaleTimeString(),
          ],
          datasets: [
            {
              ...currentChart.datasets[0],
              data: [
                ...currentChart.datasets[0].data.slice(
                  -(LIVE_CHART_POINTS - 1)
                ),
                price1,
              ],
            },
            {
              ...currentChart.datasets[1],
              data: [
                ...currentChart.datasets[1].data.slice(
                  -(LIVE_CHART_POINTS - 1)
                ),
                price2,
              ],
            },
          ],
        };
      });
    };

    const applyLivePrice = (coinId, livePrice, change24h) => {
      if (!isActive || !isLivePrice(livePrice)) return;

      liveComparisonRef.current = {
        ...liveComparisonRef.current,
        [coinId]: {
          price: livePrice,
          change24h:
            change24h ?? liveComparisonRef.current[coinId]?.change24h,
        },
      };

      if (coinId === crypto1) {
        setCoin1Data((currentCoin) => ({
          ...currentCoin,
          current_price: livePrice,
          price_change_percentage_24h:
            change24h ?? currentCoin.price_change_percentage_24h,
        }));
      }

      if (coinId === crypto2) {
        setCoin2Data((currentCoin) => ({
          ...currentCoin,
          current_price: livePrice,
          price_change_percentage_24h:
            change24h ?? currentCoin.price_change_percentage_24h,
        }));
      }

      const now = Date.now();

      if (now - lastChartUpdateAt < MIN_CHART_UPDATE_MS) return;

      lastChartUpdateAt = now;
      appendComparisonPoint();
    };

    const appendLivePrices = async () => {
      try {
        const data = await marketService.getLivePrices([crypto1, crypto2]);
        const price1 = data.prices?.[crypto1]?.usd;
        const price2 = data.prices?.[crypto2]?.usd;
        const change1 = data.prices?.[crypto1]?.usd_24h_change;
        const change2 = data.prices?.[crypto2]?.usd_24h_change;

        applyLivePrice(crypto1, price1, change1);
        applyLivePrice(crypto2, price2, change2);
      } catch {
        // Keep the current comparison chart if a live tick misses.
      }
    };

    const startFallbackPolling = (runImmediately = false) => {
      if (fallbackIntervalId) return;
      if (runImmediately) {
        appendLivePrices();
      }
      fallbackIntervalId = window.setInterval(appendLivePrices, 30000);
    };

    const stopStream = subscribeToBinanceTickers(
      liveMarkets,
      (tick) => {
        window.clearTimeout(fallbackTimeoutId);

        if (!unsupportedMarkets.length) {
          stopFallbackPolling();
        }

        applyLivePrice(tick.id, tick.price, tick.changePercent24h);
      },
      {
        onStatus: (status) => {
          if (["unsupported", "error", "disconnected"].includes(status)) {
            startFallbackPolling(true);
          }
        },
      }
    );

    if (unsupportedMarkets.length) {
      startFallbackPolling(true);
    }

    if (unsupportedMarkets.length < liveMarkets.length) {
      fallbackTimeoutId = window.setTimeout(() => {
        startFallbackPolling(true);
      }, 7000);
    }

    return () => {
      isActive = false;
      window.clearTimeout(fallbackTimeoutId);
      stopFallbackPolling();
      stopStream();
    };
  }, [coin1Data?.id, coin2Data?.id, crypto1, crypto2, error, priceType]);

  const onCoinChange = (e, isCoin2) => {
    if (isCoin2) {
      const newCrypto2 = e.target.value;
      if (!newCrypto2 || newCrypto2 === crypto1) return;
      setCrypto2(newCrypto2);
    } else {
      const newCrypto1 = e.target.value;
      if (!newCrypto1 || newCrypto1 === crypto2) return;
      setCrypto1(newCrypto1);
    }
  };

  const handleDaysChange = (e) => {
    const newDays = Number(e.target.value);
    if (!newDays) return;
    setDays(newDays);
  };

  const handlePriceTypeChange = (newPriceType) => {
    if (!newPriceType) return;
    setPriceType(newPriceType);
  };

  return (
    <div className="compare-page">
      <Header />
      {loading || (!error && (!coin1Data?.id || !coin2Data?.id)) ? (
        <Loader />
      ) : error ? (
        <ErrorState
          title="Comparison could not be loaded"
          message={error}
          onAction={getComparisonData}
        />
      ) : (
        <main className="compare-shell">
          <header className="feature-header compare-header">
            <div>
              <span className="feature-eyebrow">Compare markets</span>
              <h1>
                {coin1Data.name} vs {coin2Data.name}
              </h1>
              <p>
                Compare live price movement, volume, market cap, and coin
                details in one responsive view.
              </p>
            </div>
          </header>
          <SelectCoins
            allCoins={allCoins}
            crypto1={crypto1}
            crypto2={crypto2}
            onCoinChange={onCoinChange}
            days={days}
            handleDaysChange={handleDaysChange}
          />
          <section className="compare-coin-grid">
            <div className="grey-wrapper compare-coin-card">
              <table className="compare-list-table">
                <tbody>
                  <List coin={coin1Data} disableAnimation={true} />
                </tbody>
              </table>
            </div>
            <div className="grey-wrapper compare-coin-card">
              <table className="compare-list-table">
                <tbody>
                  <List coin={coin2Data} disableAnimation={true} />
                </tbody>
              </table>
            </div>
          </section>
          <section className="grey-wrapper compare-chart-panel">
            <ToggleComponents
              priceType={priceType}
              handlePriceTypeChange={handlePriceTypeChange}
            />
            {priceType === "prices" && (
              <p className="feature-muted" style={{ textAlign: "center" }}>
                Live comparison: Binance stream ticks update supported markets
                every second.
              </p>
            )}
            <div className="compare-chart-box">
              <LineChart
                chartData={chartData}
                multiAxis={true}
                fillContainer={true}
              />
            </div>
          </section>
          <section className="compare-info-grid">
            <Info title={coin1Data.name} desc={coin1Data.desc} />
            <Info title={coin2Data.name} desc={coin2Data.desc} />
          </section>
        </main>
      )}
    </div>
  );
}

export default Compare;
