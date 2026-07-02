import React, { useCallback, useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import CandlestickChart from "../components/CoinPage/CandlestickChart";
import Info from "../components/CoinPage/Info";
import LineChart from "../components/CoinPage/LineChart";
import SelectDays from "../components/CoinPage/SelectDays";
import ToggleComponents from "../components/CoinPage/ToggleComponent";
import AdvancedCoinInsights from "../components/CoinPage/AdvancedCoinInsights";
import Button from "../components/Common/Button";
import ErrorState from "../components/Common/ErrorState";
import Header from "../components/Common/Header";
import Loader from "../components/Common/Loader";
import List from "../components/Dashboard/List";
import { getApiErrorMessage } from "../functions/api";
import { getCoinData } from "../functions/getCoinData";
import { getPrices } from "../functions/getPrices";
import { settingChartData } from "../functions/settingChartData";
import { settingCoinObject } from "../functions/settingCoinObject";
import {
  getBinanceCandles,
  getBinanceTickerSymbol,
  isBinanceMarketSupported,
  subscribeToBinanceKlines,
  subscribeToBinanceTickers,
} from "../services/binanceMarketStream";
import { marketService } from "../services/marketService";
import "./FeaturePages.css";

const isLivePrice = (price) => Number.isFinite(Number(price));
const LIVE_CHART_POINTS = 180;
const CANDLE_SETTINGS_BY_DAYS = [
  { maxDays: 7, interval: "15m", candlesPerDay: 96 },
  { maxDays: 30, interval: "1h", candlesPerDay: 24 },
  { maxDays: 60, interval: "2h", candlesPerDay: 12 },
  { maxDays: 120, interval: "4h", candlesPerDay: 6 },
  { maxDays: Infinity, interval: "1d", candlesPerDay: 1 },
];

const getCandleSettings = (days) => {
  const selectedDays = Number(days) || 30;
  const setting = CANDLE_SETTINGS_BY_DAYS.find(
    (item) => selectedDays <= item.maxDays
  );

  return {
    interval: setting.interval,
    limit: Math.min(
      Math.max(Math.ceil(selectedDays * setting.candlesPerDay), 120),
      1000
    ),
  };
};

const toOhlcCandles = (ohlc = []) =>
  ohlc
    .map((candle) => ({
      timestamp: candle[0],
      open: Number(candle[1]),
      high: Number(candle[2]),
      low: Number(candle[3]),
      close: Number(candle[4]),
      volume: Number(candle[5]) || 0,
    }))
    .filter((candle) =>
      [candle.open, candle.high, candle.low, candle.close].every(
        Number.isFinite
      )
    );

const mergeLiveCandle = (candles, liveCandle) => {
  if (!liveCandle?.timestamp) return candles;

  const nextCandle = {
    timestamp: liveCandle.timestamp,
    open: Number(liveCandle.open),
    high: Number(liveCandle.high),
    low: Number(liveCandle.low),
    close: Number(liveCandle.close),
    volume: Number(liveCandle.volume) || 0,
  };

  if (
    ![nextCandle.open, nextCandle.high, nextCandle.low, nextCandle.close].every(
      Number.isFinite
    )
  ) {
    return candles;
  }

  const withoutCurrent = candles.filter(
    (candle) => candle.timestamp !== nextCandle.timestamp
  );

  return [...withoutCurrent, nextCandle]
    .sort((a, b) => a.timestamp - b.timestamp)
    .slice(-LIVE_CHART_POINTS);
};

const updateLatestCandlePrice = (candles, price) => {
  if (!candles.length || !isLivePrice(price)) return candles;

  const latest = candles.at(-1);
  const updated = {
    ...latest,
    high: Math.max(latest.high, price),
    low: Math.min(latest.low, price),
    close: price,
  };

  return [...candles.slice(0, -1), updated];
};

const loadCandleData = async (coinId, days) => {
  const settings = getCandleSettings(days);

  try {
    const binanceCandles = await getBinanceCandles(coinId, settings);

    if (binanceCandles.length) {
      return {
        candles: binanceCandles,
        source: "Binance",
        interval: settings.interval,
      };
    }
  } catch {
    // Fall back to the backend OHLC snapshot when Binance is unreachable.
  }

  const ohlc = await marketService.getCoinOhlc(coinId, { days });

  return {
    candles: toOhlcCandles(ohlc),
    source: "Backend OHLC",
    interval: `${days}D`,
  };
};

function Coin() {
  const { id } = useParams();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState({ labels: [], datasets: [{}] });
  const [candleData, setCandleData] = useState([]);
  const [candleMeta, setCandleMeta] = useState({
    source: "Binance",
    interval: "1h",
  });
  const [coin, setCoin] = useState({});
  const [days, setDays] = useState(30);
  const [priceType, setPriceType] = useState("prices");
  const requestIdRef = useRef(0);

  const getData = useCallback(async () => {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    setLoading(true);
    setError("");

    try {
      const shouldUseCandles = priceType === "prices";
      const [coinData, prices, candlesResult] = await Promise.all([
        getCoinData(id),
        shouldUseCandles ? Promise.resolve([]) : getPrices(id, days, priceType),
        shouldUseCandles ? loadCandleData(id, days) : Promise.resolve(null),
      ]);

      if (requestId !== requestIdRef.current) return;

      const mappedCoin = settingCoinObject(coinData, setCoin);
      const chartReady = shouldUseCandles
        ? Boolean(candlesResult?.candles?.length)
        : settingChartData(setChartData, prices);

      if (shouldUseCandles) {
        setCandleData(candlesResult?.candles || []);
        setCandleMeta({
          source: candlesResult?.source || "Backend OHLC",
          interval: candlesResult?.interval || getCandleSettings(days).interval,
        });
        setChartData({ labels: [], datasets: [] });
      }

      if (!mappedCoin || !chartReady) {
        throw new Error("Incomplete coin data received.");
      }
    } catch (err) {
      if (requestId !== requestIdRef.current) return;
      setError(
        getApiErrorMessage(
          err,
          "Sorry, we could not find the coin you're looking for."
        )
      );
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  }, [days, id, priceType]);

  useEffect(() => {
    if (id) {
      getData();
    }
  }, [getData, id]);

  useEffect(() => {
    if (!id || !coin.id || priceType !== "prices" || error) {
      return undefined;
    }

    let isActive = true;
    let fallbackIntervalId;
    let fallbackTimeoutId;
    const candleSettings = getCandleSettings(days);

    const stopFallbackPolling = () => {
      window.clearInterval(fallbackIntervalId);
      fallbackIntervalId = undefined;
    };

    const applyLivePrice = (livePrice, change24h) => {
      if (!isActive || !isLivePrice(livePrice)) return;

      setCoin((currentCoin) => ({
        ...currentCoin,
        current_price: livePrice,
        price_change_percentage_24h:
          change24h ?? currentCoin.price_change_percentage_24h,
      }));

      setCandleData((currentCandles) =>
        updateLatestCandlePrice(currentCandles, livePrice)
      );
    };

    const appendLivePrice = async () => {
      try {
        const data = await marketService.getLivePrices([id]);
        const livePrice = data.prices?.[id]?.usd;
        const change24h = data.prices?.[id]?.usd_24h_change;

        applyLivePrice(livePrice, change24h);
      } catch {
        // Keep the historical chart if a live tick misses.
      }
    };

    const startFallbackPolling = (runImmediately = false) => {
      if (fallbackIntervalId) return;
      if (runImmediately) {
        appendLivePrice();
      }
      fallbackIntervalId = window.setInterval(appendLivePrice, 30000);
    };

    const stopTickerStream = subscribeToBinanceTickers(
      [id],
      (tick) => {
        window.clearTimeout(fallbackTimeoutId);
        stopFallbackPolling();
        applyLivePrice(tick.price, tick.changePercent24h);
      },
      {
        onStatus: (status) => {
          if (["unsupported", "error", "disconnected"].includes(status)) {
            startFallbackPolling(true);
          }
        },
      }
    );

    const stopCandleStream = subscribeToBinanceKlines(
      id,
      (liveCandle) => {
        setCandleMeta({
          source: "Binance",
          interval: candleSettings.interval,
        });
        setCandleData((currentCandles) =>
          mergeLiveCandle(currentCandles, liveCandle)
        );
        applyLivePrice(liveCandle.close);
      },
      {
        interval: candleSettings.interval,
      }
    );

    if (isBinanceMarketSupported(id)) {
      fallbackTimeoutId = window.setTimeout(() => {
        startFallbackPolling(true);
      }, 7000);
    } else {
      startFallbackPolling(true);
    }

    return () => {
      isActive = false;
      window.clearTimeout(fallbackTimeoutId);
      stopFallbackPolling();
      stopTickerStream();
      stopCandleStream();
    };
  }, [coin.id, days, error, id, priceType]);

  const handleDaysChange = (event) => {
    const newDays = Number(event.target.value);
    if (!newDays) return;
    setDays(newDays);
  };

  const handlePriceTypeChange = (newPriceType) => {
    if (!newPriceType) return;
    setPriceType(newPriceType);
  };

  const binanceSymbol = getBinanceTickerSymbol({
    id,
    symbol: coin.symbol,
  });
  const candleSymbol = binanceSymbol
    ? binanceSymbol.toUpperCase().replace("USDT", "/USDT")
    : coin.symbol?.toUpperCase() || coin.name;

  return (
    <>
      <Header />
      {!error && !loading && coin.id ? (
        <>
          <div className="grey-wrapper">
            <List coin={coin} delay={0.5} />
          </div>
          <div className="grey-wrapper">
            <SelectDays handleDaysChange={handleDaysChange} days={days} />
            <ToggleComponents
              priceType={priceType}
              handlePriceTypeChange={handlePriceTypeChange}
            />
            {priceType === "prices" ? (
              <CandlestickChart
                candles={candleData}
                symbol={candleSymbol}
                interval={candleMeta.interval}
                source={candleMeta.source}
              />
            ) : (
              <LineChart chartData={chartData} />
            )}
          </div>
          <AdvancedCoinInsights coinId={id} />
          <Info title={coin.name} desc={coin.desc} />
        </>
      ) : error ? (
        <>
          <ErrorState
            title="Coin data could not be loaded"
            message={error}
            onAction={getData}
          />
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              margin: "2rem",
            }}
          >
            <Link to="/dashboard">
              <Button text="Dashboard" />
            </Link>
          </div>
        </>
      ) : (
        <Loader />
      )}
    </>
  );
}

export default Coin;
