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
