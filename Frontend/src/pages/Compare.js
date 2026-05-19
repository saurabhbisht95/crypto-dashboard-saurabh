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
import { marketService } from "../services/marketService";
import "./FeaturePages.css";

const isLivePrice = (price) => Number.isFinite(Number(price));

function Compare() {
  const [allCoins, setAllCoins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const requestIdRef = useRef(0);
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
    if (!coin1Data?.id || !coin2Data?.id || priceType !== "prices" || error) {
      return undefined;
    }

    let isActive = true;

    const appendLivePrices = async () => {
      try {
        const data = await marketService.getLivePrices([crypto1, crypto2]);
        const price1 = data.prices?.[crypto1]?.usd;
        const price2 = data.prices?.[crypto2]?.usd;

        if (!isActive || !isLivePrice(price1) || !isLivePrice(price2)) return;

        setCoin1Data((currentCoin) => ({
          ...currentCoin,
          current_price: price1,
          price_change_percentage_24h:
            data.prices?.[crypto1]?.usd_24h_change ??
            currentCoin.price_change_percentage_24h,
        }));
        setCoin2Data((currentCoin) => ({
          ...currentCoin,
          current_price: price2,
          price_change_percentage_24h:
            data.prices?.[crypto2]?.usd_24h_change ??
            currentCoin.price_change_percentage_24h,
        }));

        setChartData((currentChart) => {
          if (currentChart.datasets?.length < 2) {
            return currentChart;
          }

          return {
            labels: [
              ...currentChart.labels.slice(-89),
              new Date().toLocaleTimeString(),
            ],
            datasets: [
              {
                ...currentChart.datasets[0],
                data: [...currentChart.datasets[0].data.slice(-89), price1],
              },
              {
                ...currentChart.datasets[1],
                data: [...currentChart.datasets[1].data.slice(-89), price2],
              },
            ],
          };
        });
      } catch {
        // Keep the current comparison chart if a live tick misses.
      }
    };

    appendLivePrices();
    const intervalId = setInterval(appendLivePrices, 10000);

    return () => {
      isActive = false;
      clearInterval(intervalId);
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
    <div>
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
        <>
          <SelectCoins
            allCoins={allCoins}
            crypto1={crypto1}
            crypto2={crypto2}
            onCoinChange={onCoinChange}
            days={days}
            handleDaysChange={handleDaysChange}
          />
          <div className="grey-wrapper">
            <List coin={coin1Data} />
          </div>
          <div className="grey-wrapper">
            <List coin={coin2Data} />
          </div>
          <div className="grey-wrapper">
            <ToggleComponents
              priceType={priceType}
              handlePriceTypeChange={handlePriceTypeChange}
            />
            {priceType === "prices" && (
              <p className="feature-muted" style={{ textAlign: "center" }}>
                Live comparison: fresh backend price ticks append every 10 seconds.
              </p>
            )}
            <LineChart chartData={chartData} multiAxis={true} />
          </div>
          <Info title={coin1Data.name} desc={coin1Data.desc} />
          <Info title={coin2Data.name} desc={coin2Data.desc} />
        </>
      )}
    </div>
  );
}

export default Compare;
