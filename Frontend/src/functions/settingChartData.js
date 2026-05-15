import { gettingDate } from "./getDate";

const getSeries = (prices) => {
  if (!Array.isArray(prices)) return [];
  return prices.filter(
    (data) => Array.isArray(data) && data.length >= 2 && Number.isFinite(data[1])
  );
};

export const settingChartData = (
  setChartData,
  prices1,
  prices2,
  datasetLabels = ["Crypto 1", "Crypto 2"]
) => {
  const series1 = getSeries(prices1);
  const series2 = getSeries(prices2);

  if (!series1.length) {
    setChartData({
      labels: [],
      datasets: [],
    });
    return false;
  }

  if (series2.length) {
    setChartData({
      labels: series1.map((data) => gettingDate(data[0])),
      datasets: [
        {
          label: datasetLabels[0],
          data: series1.map((data) => data[1]),
          borderWidth: 1,
          fill: false,
          backgroundColor: "rgba(58, 128, 233,0.1)",
          tension: 0.25,
          borderColor: "#3a80e9",
          pointRadius: 0,
          yAxisID: "crypto1",
        },
        {
          label: datasetLabels[1],
          data: series2.map((data) => data[1]),
          borderWidth: 1,
          fill: false,
          tension: 0.25,
          borderColor: "#61c96f",
          pointRadius: 0,
          yAxisID: "crypto2",
        },
      ],
    });
  } else {
    setChartData({
      labels: series1.map((data) => gettingDate(data[0])),
      datasets: [
        {
          data: series1.map((data) => data[1]),
          borderWidth: 1,
          fill: true,
          backgroundColor: "rgba(58, 128, 233,0.1)",
          tension: 0.25,
          borderColor: "#3a80e9",
          pointRadius: 0,
          yAxisID: "crypto1",
        },
      ],
    });
  }

  return true;
};
