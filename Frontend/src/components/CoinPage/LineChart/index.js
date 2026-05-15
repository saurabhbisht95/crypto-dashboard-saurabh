import React from "react";
import { Line } from "react-chartjs-2";
import "chart.js/auto";

function LineChart({ chartData, multiAxis }) {
  const hasData = chartData?.datasets?.some((dataset) => dataset.data?.length);

  const options = {
    plugins: {
      legend: {
        display: multiAxis ? true : false,
      },
    },
    responsive: true,
    interaction: {
      mode: "index",
      intersect: false,
    },
    scales: {
      crypto1: {
        position: "left",
      },
      ...(multiAxis
        ? {
            crypto2: {
              position: "right",
              grid: {
                drawOnChartArea: false,
              },
            },
          }
        : {}),
    },
  };

  if (!hasData) {
    return <p style={{ textAlign: "center" }}>No chart data available.</p>;
  }

  return <Line data={chartData} options={options} />;
}

export default LineChart;
