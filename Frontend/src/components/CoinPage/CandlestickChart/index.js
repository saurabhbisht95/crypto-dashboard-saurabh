import React, { useEffect, useMemo, useRef, useState } from "react";
import "./styles.css";

const MAX_VISIBLE_CANDLES = 180;
const PRICE_AXIS_WIDTH = 78;
const PLOT_LEFT = 16;
const PLOT_TOP = 18;
const PLOT_BOTTOM = 28;
const VOLUME_HEIGHT = 72;
const VOLUME_GAP = 16;

const formatPrice = (value) => {
  const number = Number(value);

  if (!Number.isFinite(number)) return "$0.00";

  const maximumFractionDigits = number >= 100 ? 2 : number >= 1 ? 4 : 8;

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits,
  }).format(number);
};

const formatVolume = (value) =>
  new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);

const toCandle = (candle) => {
  if (Array.isArray(candle)) {
    return {
      timestamp: candle[0],
      open: Number(candle[1]),
      high: Number(candle[2]),
      low: Number(candle[3]),
      close: Number(candle[4]),
      volume: Number(candle[5]) || 0,
    };
  }

  return {
    timestamp: candle?.timestamp,
    open: Number(candle?.open),
    high: Number(candle?.high),
    low: Number(candle?.low),
    close: Number(candle?.close),
    volume: Number(candle?.volume) || 0,
  };
};

const getCssColor = (name, fallback) => {
  if (typeof window === "undefined") return fallback;

  const color = window
    .getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim();

  return color || fallback;
};

const getPlotMetrics = (width, height) => {
  const volumeTop = height - PLOT_BOTTOM - VOLUME_HEIGHT;
  const priceBottom = volumeTop - VOLUME_GAP;

  return {
    plotLeft: PLOT_LEFT,
    plotRight: width - PRICE_AXIS_WIDTH,
    plotTop: PLOT_TOP,
    priceBottom,
    volumeTop,
    volumeBottom: height - PLOT_BOTTOM,
    plotWidth: Math.max(width - PRICE_AXIS_WIDTH - PLOT_LEFT, 1),
    priceHeight: Math.max(priceBottom - PLOT_TOP, 1),
  };
};

const drawChart = ({ canvas, candles, hoverIndex }) => {
  const rect = canvas.getBoundingClientRect();
  const width = Math.max(rect.width, 320);
  const height = Math.max(rect.height, 320);
  const ratio = window.devicePixelRatio || 1;
  const ctx = canvas.getContext("2d");

  canvas.width = width * ratio;
  canvas.height = height * ratio;
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);

  const surface = getCssColor("--surface", "#0c1118");
  const surface2 = getCssColor("--surface-2", "#151d28");
  const border = getCssColor("--border", "rgba(148, 163, 184, 0.18)");
  const grey = getCssColor("--grey", "#8f99aa");
  const white = getCssColor("--white", "#f5f7fb");
  const green = getCssColor("--green", "#16c784");
  const red = getCssColor("--red", "#ea3943");
  const blue = getCssColor("--blue", "#4f8cff");
  const metrics = getPlotMetrics(width, height);
  const highs = candles.map((candle) => candle.high);
  const lows = candles.map((candle) => candle.low);
  const maxHigh = Math.max(...highs);
  const minLow = Math.min(...lows);
  const pricePadding = Math.max((maxHigh - minLow) * 0.08, maxHigh * 0.002, 1);
  const maxPrice = maxHigh + pricePadding;
  const minPrice = Math.max(minLow - pricePadding, 0);
  const priceRange = Math.max(maxPrice - minPrice, 1);
  const maxVolume = Math.max(...candles.map((candle) => candle.volume), 1);
  const slotWidth = metrics.plotWidth / candles.length;
  const bodyWidth = Math.max(Math.min(slotWidth * 0.64, 14), 3);

  const getY = (price) =>
    metrics.plotTop +
    ((maxPrice - price) / priceRange) * metrics.priceHeight;

  const getVolumeY = (volume) =>
    metrics.volumeBottom -
    (volume / maxVolume) * (metrics.volumeBottom - metrics.volumeTop);

  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = surface;
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = surface2;
  ctx.fillRect(
    metrics.plotLeft,
    metrics.plotTop,
    metrics.plotWidth,
    metrics.volumeBottom - metrics.plotTop
  );

  ctx.strokeStyle = border;
  ctx.lineWidth = 1;

  for (let index = 0; index <= 5; index += 1) {
    const y = metrics.plotTop + (metrics.priceHeight / 5) * index;
    const price = maxPrice - (priceRange / 5) * index;

    ctx.beginPath();
    ctx.moveTo(metrics.plotLeft, y);
    ctx.lineTo(metrics.plotRight, y);
    ctx.stroke();

    ctx.fillStyle = grey;
    ctx.font = "11px Inter, sans-serif";
    ctx.textAlign = "left";
    ctx.fillText(formatPrice(price), metrics.plotRight + 10, y + 4);
  }

  const timeLabelCount = Math.min(4, candles.length);
  for (let index = 0; index < timeLabelCount; index += 1) {
    const candleIndex = Math.round(
      (index / Math.max(timeLabelCount - 1, 1)) * (candles.length - 1)
    );
    const candle = candles[candleIndex];
    const x = metrics.plotLeft + candleIndex * slotWidth + slotWidth / 2;
    const date = new Date(candle.timestamp);

    ctx.fillStyle = grey;
    ctx.font = "11px Inter, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(
      date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      x,
      height - 9
    );
  }

  candles.forEach((candle, index) => {
    const x = metrics.plotLeft + index * slotWidth + slotWidth / 2;
    const isUp = candle.close >= candle.open;
    const color = isUp ? green : red;
    const highY = getY(candle.high);
    const lowY = getY(candle.low);
    const openY = getY(candle.open);
    const closeY = getY(candle.close);
    const bodyTop = Math.min(openY, closeY);
    const bodyHeight = Math.max(Math.abs(openY - closeY), 2);
    const volumeY = getVolumeY(candle.volume);

    ctx.strokeStyle = color;
    ctx.beginPath();
    ctx.moveTo(x, highY);
    ctx.lineTo(x, lowY);
    ctx.stroke();

    ctx.fillStyle = color;
    ctx.fillRect(x - bodyWidth / 2, bodyTop, bodyWidth, bodyHeight);

    ctx.globalAlpha = 0.24;
    ctx.fillRect(
      x - bodyWidth / 2,
      volumeY,
      bodyWidth,
      metrics.volumeBottom - volumeY
    );
    ctx.globalAlpha = 1;
  });

  const latest = candles.at(-1);
  const latestY = getY(latest.close);

  ctx.strokeStyle = blue;
  ctx.setLineDash([5, 5]);
  ctx.beginPath();
  ctx.moveTo(metrics.plotLeft, latestY);
  ctx.lineTo(metrics.plotRight, latestY);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.fillStyle = blue;
  ctx.fillRect(metrics.plotRight + 8, latestY - 12, PRICE_AXIS_WIDTH - 14, 24);
  ctx.fillStyle = "#ffffff";
  ctx.font = "11px Inter, sans-serif";
  ctx.textAlign = "left";
  ctx.fillText(formatPrice(latest.close), metrics.plotRight + 13, latestY + 4);

  if (hoverIndex !== null && candles[hoverIndex]) {
    const candle = candles[hoverIndex];
    const x = metrics.plotLeft + hoverIndex * slotWidth + slotWidth / 2;
    const y = getY(candle.close);

    ctx.strokeStyle = "rgba(245, 247, 251, 0.42)";
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(x, metrics.plotTop);
    ctx.lineTo(x, metrics.volumeBottom);
    ctx.moveTo(metrics.plotLeft, y);
    ctx.lineTo(metrics.plotRight, y);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = white;
    ctx.beginPath();
    ctx.arc(x, y, 3, 0, Math.PI * 2);
    ctx.fill();
  }
};

function CandlestickChart({
  candles = [],
  symbol = "",
  interval = "1m",
  source = "Binance",
}) {
  const canvasRef = useRef(null);
  const [hoverIndex, setHoverIndex] = useState(null);
  const visibleCandles = useMemo(
    () =>
      candles
        .map(toCandle)
        .filter(
          (candle) =>
            candle.timestamp &&
            [candle.open, candle.high, candle.low, candle.close].every(
              Number.isFinite
            )
        )
        .sort((a, b) => a.timestamp - b.timestamp)
        .slice(-MAX_VISIBLE_CANDLES),
    [candles]
  );
  const activeCandle =
    hoverIndex !== null && visibleCandles[hoverIndex]
      ? visibleCandles[hoverIndex]
      : visibleCandles.at(-1);
  const change = activeCandle
    ? activeCandle.close - activeCandle.open
    : 0;
  const changePercent =
    activeCandle?.open > 0 ? (change / activeCandle.open) * 100 : 0;

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas || !visibleCandles.length) return undefined;

    const render = () =>
      drawChart({
        canvas,
        candles: visibleCandles,
        hoverIndex,
      });

    render();

    const observer = new ResizeObserver(render);
    observer.observe(canvas);

    return () => {
      observer.disconnect();
    };
  }, [hoverIndex, visibleCandles]);

  const handleMouseMove = (event) => {
    if (!canvasRef.current || !visibleCandles.length) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const metrics = getPlotMetrics(rect.width, rect.height);
    const x = event.clientX - rect.left;
    const index = Math.floor(
      ((x - metrics.plotLeft) / metrics.plotWidth) * visibleCandles.length
    );

    if (index < 0 || index >= visibleCandles.length) {
      setHoverIndex(null);
      return;
    }

    setHoverIndex(index);
  };

  if (!visibleCandles.length) {
    return <p className="candlestick-empty">No candle data available.</p>;
  }

  return (
    <div className="candlestick-chart">
      <div className="candlestick-toolbar">
        <div>
          <strong>{symbol || "Market"}</strong>
          <span>{interval}</span>
          <span>{source}</span>
        </div>
        <div className="candlestick-ohlc">
          <span>O {formatPrice(activeCandle.open)}</span>
          <span>H {formatPrice(activeCandle.high)}</span>
          <span>L {formatPrice(activeCandle.low)}</span>
          <span>C {formatPrice(activeCandle.close)}</span>
          <span className={change < 0 ? "negative" : "positive"}>
            {change < 0 ? "" : "+"}
            {formatPrice(change)} ({changePercent.toFixed(2)}%)
          </span>
          <span>Vol {formatVolume(activeCandle.volume)}</span>
        </div>
      </div>
      <canvas
        ref={canvasRef}
        className="candlestick-canvas"
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHoverIndex(null)}
      />
    </div>
  );
}

export default CandlestickChart;
