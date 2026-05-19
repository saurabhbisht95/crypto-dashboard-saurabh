import React, { useCallback, useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Info from "../components/CoinPage/Info";
import LineChart from "../components/CoinPage/LineChart";
import SelectDays from "../components/CoinPage/SelectDays";
import ToggleComponents from "../components/CoinPage/ToggleComponent";
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
import { marketService } from "../services/marketService";
import "./FeaturePages.css";

const isLivePrice = (price) => Number.isFinite(Number(price));

function Coin() {
  const { id } = useParams();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState({ labels: [], datasets: [{}] });
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
      const [coinData, prices] = await Promise.all([
        getCoinData(id),
        getPrices(id, days, priceType),
      ]);

      if (requestId !== requestIdRef.current) return;

      const mappedCoin = settingCoinObject(coinData, setCoin);
      const chartReady = settingChartData(setChartData, prices);

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

    const appendLivePrice = async () => {
      try {
        const data = await marketService.getLivePrices([id]);
        const livePrice = data.prices?.[id]?.usd;

        if (!isActive || !isLivePrice(livePrice)) return;

        setCoin((currentCoin) => ({
          ...currentCoin,
          current_price: livePrice,
          price_change_percentage_24h:
            data.prices?.[id]?.usd_24h_change ??
            currentCoin.price_change_percentage_24h,
        }));

        setChartData((currentChart) => {
          const dataset = currentChart.datasets?.[0];

          if (!dataset?.data?.length) {
            return currentChart;
          }

          return {
            labels: [
              ...currentChart.labels.slice(-89),
              new Date().toLocaleTimeString(),
            ],
            datasets: [
              {
                ...dataset,
                data: [...dataset.data.slice(-89), livePrice],
              },
            ],
          };
        });
      } catch {
        // Keep the historical chart if a live tick misses.
      }
    };

    appendLivePrice();
    const intervalId = setInterval(appendLivePrice, 10000);

    return () => {
      isActive = false;
      clearInterval(intervalId);
    };
  }, [coin.id, error, id, priceType]);

  const handleDaysChange = (event) => {
    const newDays = Number(event.target.value);
    if (!newDays) return;
    setDays(newDays);
  };

  const handlePriceTypeChange = (newPriceType) => {
    if (!newPriceType) return;
    setPriceType(newPriceType);
  };

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
            {priceType === "prices" && (
              <p className="feature-muted" style={{ textAlign: "center" }}>
                Live mode: appending fresh backend price ticks every 10 seconds.
              </p>
            )}
            <LineChart chartData={chartData} />
          </div>
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
