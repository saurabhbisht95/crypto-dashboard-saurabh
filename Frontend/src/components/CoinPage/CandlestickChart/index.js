import MyLocationIcon from "@mui/icons-material/MyLocation";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import ZoomInIcon from "@mui/icons-material/ZoomIn";
import ZoomOutIcon from "@mui/icons-material/ZoomOut";
import React, { useEffect, useMemo, useRef, useState } from "react";
import "./styles.css";

const DEFAULT_VISIBLE_CANDLES = 96;
const MIN_VISIBLE_CANDLES = 24;
const MAX_VISIBLE_CANDLES = 260;
const PRICE_AXIS_WIDTH = 82;
const PLOT_LEFT = 16;
const PLOT_TOP = 18;
const PLOT_BOTTOM = 30;
const VOLUME_HEIGHT = 72;
const VOLUME_GAP = 16;
const PULSE_MS = 900;

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

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

const formatTimeLabel = (timestamp, spanMs) => {
  const date = new Date(timestamp);

  if (spanMs > 3 * 24 * 60 * 60 * 1000) {
    return date.toLocaleDateString([], { month: "short", day: "numeric" });
  }

  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

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

const getVisibleWindow = (candles, visibleCount, offsetFromRight) => {
  const count = clamp(
    visibleCount,
    Math.min(MIN_VISIBLE_CANDLES, candles.length || MIN_VISIBLE_CANDLES),
    Math.min(MAX_VISIBLE_CANDLES, Math.max(candles.length, MIN_VISIBLE_CANDLES))
  );
  const maxOffset = Math.max(candles.length - count, 0);
  const offset = clamp(offsetFromRight, 0, maxOffset);
  const end = Math.max(candles.length - offset, 0);
  const start = Math.max(end - count, 0);

  return {
    count,
    offset,
    start,
    end,
    candles: candles.slice(start, end),
    maxOffset,
  };
};

const drawChart = ({
  canvas,
  candles,
  currentCandle,
  hoverIndex,
  liveIndex,
  liveTickAt,
}) => {
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
  const pricePadding = Math.max((maxHigh - minLow) * 0.08, maxHigh * 0.0015, 1);
  const maxPrice = maxHigh + pricePadding;
  const minPrice = Math.max(minLow - pricePadding, 0);
  const priceRange = Math.max(maxPrice - minPrice, 1);
  const maxVolume = Math.max(...candles.map((candle) => candle.volume), 1);
  const slotWidth = metrics.plotWidth / candles.length;
  const bodyWidth = Math.max(Math.min(slotWidth * 0.68, 16), 3);
  const spanMs =
    candles.at(-1)?.timestamp && candles[0]?.timestamp
      ? candles.at(-1).timestamp - candles[0].timestamp
      : 0;

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

  const timeLabelCount = Math.min(5, candles.length);
  for (let index = 0; index < timeLabelCount; index += 1) {
    const candleIndex = Math.round(
      (index / Math.max(timeLabelCount - 1, 1)) * (candles.length - 1)
    );
    const candle = candles[candleIndex];
    const x = metrics.plotLeft + candleIndex * slotWidth + slotWidth / 2;

    ctx.fillStyle = grey;
    ctx.font = "11px Inter, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(formatTimeLabel(candle.timestamp, spanMs), x, height - 10);
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

  if (
    currentCandle &&
    currentCandle.close >= minPrice &&
    currentCandle.close <= maxPrice
  ) {
    const latestY = getY(currentCandle.close);

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
    ctx.fillText(formatPrice(currentCandle.close), metrics.plotRight + 13, latestY + 4);

    if (liveIndex >= 0 && liveIndex < candles.length && liveTickAt) {
      const age = Date.now() - liveTickAt;

      if (age < PULSE_MS) {
        const x = metrics.plotLeft + liveIndex * slotWidth + slotWidth / 2;
        const radius = 4 + (age / PULSE_MS) * 18;

        ctx.globalAlpha = 1 - age / PULSE_MS;
        ctx.strokeStyle = blue;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(x, latestY, radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = 1;
        ctx.lineWidth = 1;
      }
    }
  }

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
  intervals = ["1m", "5m", "15m", "1h", "4h", "1d"],
  source = "Binance",
  liveTickAt = 0,
  onIntervalChange,
}) {
  const canvasRef = useRef(null);
  const dragRef = useRef(null);
  const [hoverIndex, setHoverIndex] = useState(null);
  const [visibleCount, setVisibleCount] = useState(DEFAULT_VISIBLE_CANDLES);
  const [offsetFromRight, setOffsetFromRight] = useState(0);
  const [autoFollow, setAutoFollow] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const normalizedCandles = useMemo(
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
        .sort((a, b) => a.timestamp - b.timestamp),
    [candles]
  );
  const windowState = useMemo(
    () =>
      getVisibleWindow(normalizedCandles, visibleCount, offsetFromRight),
    [normalizedCandles, offsetFromRight, visibleCount]
  );
  const visibleCandles = windowState.candles;
  const currentCandle = normalizedCandles.at(-1);
  const activeCandle =
    hoverIndex !== null && visibleCandles[hoverIndex]
      ? visibleCandles[hoverIndex]
      : visibleCandles.at(-1) || currentCandle;
  const change = activeCandle
    ? activeCandle.close - activeCandle.open
    : 0;
  const changePercent =
    activeCandle?.open > 0 ? (change / activeCandle.open) * 100 : 0;
  const isFresh = liveTickAt && Date.now() - liveTickAt < 4500;
  const liveIndex = normalizedCandles.length - 1 - windowState.start;

  useEffect(() => {
    if (autoFollow) {
      setOffsetFromRight(0);
    }
  }, [autoFollow, normalizedCandles.length]);

  useEffect(() => {
    setVisibleCount(DEFAULT_VISIBLE_CANDLES);
    setOffsetFromRight(0);
    setAutoFollow(true);
    setHoverIndex(null);
  }, [interval, symbol]);

  useEffect(() => {
    if (offsetFromRight > windowState.maxOffset) {
      setOffsetFromRight(windowState.maxOffset);
    }
  }, [offsetFromRight, windowState.maxOffset]);

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas || !visibleCandles.length) return undefined;

    const render = () =>
      drawChart({
        canvas,
        candles: visibleCandles,
        currentCandle,
        hoverIndex,
        liveIndex,
        liveTickAt,
      });

    render();

    const observer = new ResizeObserver(render);
    observer.observe(canvas);

    return () => {
      observer.disconnect();
    };
  }, [currentCandle, hoverIndex, liveIndex, liveTickAt, visibleCandles]);

  const getPointerIndex = (clientX) => {
    if (!canvasRef.current || !visibleCandles.length) return null;

    const rect = canvasRef.current.getBoundingClientRect();
    const metrics = getPlotMetrics(rect.width, rect.height);
    const x = clientX - rect.left;
    const index = Math.floor(
      ((x - metrics.plotLeft) / metrics.plotWidth) * visibleCandles.length
    );

    if (index < 0 || index >= visibleCandles.length) {
      return null;
    }

    return index;
  };

  const setZoom = (nextCount, focusRatio = 1) => {
    const clampedCount = clamp(
      Math.round(nextCount),
      MIN_VISIBLE_CANDLES,
      Math.min(MAX_VISIBLE_CANDLES, Math.max(normalizedCandles.length, MIN_VISIBLE_CANDLES))
    );
    const safeFocus = clamp(focusRatio, 0, 1);
    const currentRightDistance =
      windowState.offset + Math.round((windowState.count - 1) * (1 - safeFocus));
    const nextOffset = clamp(
      currentRightDistance - Math.round((clampedCount - 1) * (1 - safeFocus)),
      0,
      Math.max(normalizedCandles.length - clampedCount, 0)
    );

    setVisibleCount(clampedCount);
    setOffsetFromRight(nextOffset);
    setAutoFollow(nextOffset === 0);
  };

  const handleWheel = (event) => {
    if (!normalizedCandles.length) return;

    event.preventDefault();

    const rect = canvasRef.current.getBoundingClientRect();
    const metrics = getPlotMetrics(rect.width, rect.height);
    const focusRatio = clamp(
      (event.clientX - rect.left - metrics.plotLeft) / metrics.plotWidth,
      0,
      1
    );
    const zoomFactor = event.deltaY > 0 ? 1.18 : 0.82;

    setZoom(windowState.count * zoomFactor, focusRatio);
  };

  const handlePointerDown = (event) => {
    if (!canvasRef.current || !visibleCandles.length) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const metrics = getPlotMetrics(rect.width, rect.height);

    dragRef.current = {
      startX: event.clientX,
      startOffset: windowState.offset,
      slotWidth: metrics.plotWidth / visibleCandles.length,
    };
    setIsDragging(true);
    canvasRef.current.setPointerCapture?.(event.pointerId);
  };

  const handlePointerMove = (event) => {
    if (dragRef.current) {
      const dx = event.clientX - dragRef.current.startX;
      const shift = Math.round(dx / dragRef.current.slotWidth);
      const nextOffset = clamp(
        dragRef.current.startOffset + shift,
        0,
        windowState.maxOffset
      );

      setOffsetFromRight(nextOffset);
      setAutoFollow(nextOffset === 0);
      return;
    }

    setHoverIndex(getPointerIndex(event.clientX));
  };

  const stopDragging = (event) => {
    dragRef.current = null;
    setIsDragging(false);
    canvasRef.current?.releasePointerCapture?.(event.pointerId);
  };

  const resetView = () => {
    setVisibleCount(DEFAULT_VISIBLE_CANDLES);
    setOffsetFromRight(0);
    setAutoFollow(true);
    setHoverIndex(null);
  };

  const goLive = () => {
    setOffsetFromRight(0);
    setAutoFollow(true);
  };

  if (!visibleCandles.length) {
    return <p className="candlestick-empty">No candle data available.</p>;
  }

  return (
    <div className="candlestick-chart">
      <div className="candlestick-toolbar">
        <div className="candlestick-market">
          <strong>{symbol || "Market"}</strong>
          <span>{interval}</span>
          <span className={isFresh ? "candlestick-source fresh" : "candlestick-source"}>
            <span className="candlestick-live-dot" />
            {source}
          </span>
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

      <div className="candlestick-control-row">
        <div className="candlestick-intervals" aria-label="Candle interval">
          {intervals.map((item) => (
            <button
              type="button"
              className={item === interval ? "active" : ""}
              key={item}
              onClick={() => onIntervalChange?.(item)}
            >
              {item}
            </button>
          ))}
        </div>
        <div className="candlestick-actions">
          <button
            type="button"
            className={autoFollow ? "active live-action" : "live-action"}
            onClick={goLive}
            title="Follow latest candle"
          >
            <MyLocationIcon fontSize="small" />
            <span>Live</span>
          </button>
          <button
            type="button"
            onClick={() => setZoom(windowState.count * 1.18)}
            title="Zoom out"
          >
            <ZoomOutIcon fontSize="small" />
          </button>
          <button
            type="button"
            onClick={() => setZoom(windowState.count * 0.82)}
            title="Zoom in"
          >
            <ZoomInIcon fontSize="small" />
          </button>
          <button type="button" onClick={resetView} title="Reset chart">
            <RestartAltIcon fontSize="small" />
          </button>
        </div>
      </div>

      <canvas
        ref={canvasRef}
        className={isDragging ? "candlestick-canvas dragging" : "candlestick-canvas"}
        data-auto-follow={autoFollow}
        data-offset-from-right={windowState.offset}
        data-visible-count={windowState.count}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={stopDragging}
        onPointerCancel={stopDragging}
        onMouseLeave={() => {
          setHoverIndex(null);
          dragRef.current = null;
          setIsDragging(false);
        }}
        onWheel={handleWheel}
      />
    </div>
  );
}

export default CandlestickChart;
