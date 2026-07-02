const BINANCE_STREAM_BASE_URL = "wss://stream.binance.com:9443/stream?streams=";
const BINANCE_RAW_STREAM_BASE_URL = "wss://stream.binance.com:9443/ws/";
const BINANCE_REST_BASE_URL = "https://api.binance.com/api/v3";
const RECONNECT_BASE_DELAY_MS = 1000;
const RECONNECT_MAX_DELAY_MS = 30000;
const DEFAULT_KLINE_INTERVAL = "1m";

const COIN_ID_TO_BINANCE_SYMBOL = {
  "1inch": "1inchusdt",
  aave: "aaveusdt",
  algorand: "algousdt",
  avalanche: "avaxusdt",
  "avalanche-2": "avaxusdt",
  axieinfinity: "axsusdt",
  "axie-infinity": "axsusdt",
  "basic-attention-token": "batusdt",
  binancecoin: "bnbusdt",
  "binance-coin": "bnbusdt",
  bitcoin: "btcusdt",
  "bitcoin-cash": "bchusdt",
  cardano: "adausdt",
  chainlink: "linkusdt",
  cosmos: "atomusdt",
  dogecoin: "dogeusdt",
  ethereum: "ethusdt",
  "ethereum-classic": "etcusdt",
  filecoin: "filusdt",
  "first-digital-usd": "fdusdusdt",
  "ftx-token": "fttusdt",
  litecoin: "ltcusdt",
  near: "nearusdt",
  "near-protocol": "nearusdt",
  optimism: "opusdt",
  pepe: "pepeusdt",
  polkadot: "dotusdt",
  polygon: "polusdt",
  "matic-network": "polusdt",
  render: "renderusdt",
  "render-token": "renderusdt",
  ripple: "xrpusdt",
  shiba: "shibusdt",
  "shiba-inu": "shibusdt",
  solana: "solusdt",
  stellar: "xlmusdt",
  sui: "suiusdt",
  toncoin: "tonusdt",
  tron: "trxusdt",
  uniswap: "uniusdt",
  "usd-coin": "usdcusdt",
  vechain: "vetusdt",
  worldcoin: "wldusdt",
};

const SYMBOL_TO_BINANCE_SYMBOL = {
  "1inch": "1inchusdt",
  aave: "aaveusdt",
  ada: "adausdt",
  algo: "algousdt",
  arb: "arbusdt",
  atom: "atomusdt",
  avax: "avaxusdt",
  axs: "axsusdt",
  bat: "batusdt",
  bch: "bchusdt",
  bnb: "bnbusdt",
  btc: "btcusdt",
  doge: "dogeusdt",
  dot: "dotusdt",
  etc: "etcusdt",
  eth: "ethusdt",
  fdusd: "fdusdusdt",
  fil: "filusdt",
  ftt: "fttusdt",
  link: "linkusdt",
  ltc: "ltcusdt",
  near: "nearusdt",
  op: "opusdt",
  pepe: "pepeusdt",
  pol: "polusdt",
  render: "renderusdt",
  shib: "shibusdt",
  sol: "solusdt",
  sui: "suiusdt",
  ton: "tonusdt",
  trx: "trxusdt",
  uni: "uniusdt",
  usdc: "usdcusdt",
  vet: "vetusdt",
  wld: "wldusdt",
  xlm: "xlmusdt",
  xrp: "xrpusdt",
};

const toMarketDescriptor = (market) =>
  typeof market === "string" ? { id: market } : market || {};

const normalizeId = (value) =>
  value
    ?.toString()
    .trim()
    .toLowerCase()
    .replace(/_/g, "-") || "";

const normalizeSymbol = (value) =>
  value
    ?.toString()
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "") || "";

const parseNumber = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
};

const getSymbolLabel = (binanceSymbol) =>
  binanceSymbol?.replace(/usdt$/i, "").toUpperCase() || "";

const mapBinanceKline = (kline) => {
  if (!Array.isArray(kline) || kline.length < 6) return null;

  const open = parseNumber(kline[1]);
  const high = parseNumber(kline[2]);
  const low = parseNumber(kline[3]);
  const close = parseNumber(kline[4]);

  if ([open, high, low, close].some((value) => value === null)) {
    return null;
  }

  return {
    timestamp: kline[0],
    open,
    high,
    low,
    close,
    volume: parseNumber(kline[5]) || 0,
    closeTime: kline[6],
    isClosed: true,
    source: "binance",
  };
};

const mapBinanceKlineEvent = (payload) => {
  const kline = payload?.k;

  if (!kline) return null;

  const open = parseNumber(kline.o);
  const high = parseNumber(kline.h);
  const low = parseNumber(kline.l);
  const close = parseNumber(kline.c);

  if ([open, high, low, close].some((value) => value === null)) {
    return null;
  }

  return {
    timestamp: kline.t,
    open,
    high,
    low,
    close,
    volume: parseNumber(kline.v) || 0,
    closeTime: kline.T,
    isClosed: Boolean(kline.x),
    symbol: payload.s || kline.s,
    eventTime: payload.E || Date.now(),
    source: "binance",
  };
};

export const getBinanceTickerSymbol = (market) => {
  const descriptor = toMarketDescriptor(market);
  const idKey = normalizeId(descriptor.id);
  const symbolKey = normalizeSymbol(descriptor.symbol || descriptor.id);

  if (COIN_ID_TO_BINANCE_SYMBOL[idKey]) {
    return COIN_ID_TO_BINANCE_SYMBOL[idKey];
  }

  if (SYMBOL_TO_BINANCE_SYMBOL[symbolKey]) {
    return SYMBOL_TO_BINANCE_SYMBOL[symbolKey];
  }

  return null;
};

export const isBinanceMarketSupported = (market) =>
  Boolean(getBinanceTickerSymbol(market));

export const getUnsupportedBinanceMarkets = (markets = []) =>
  markets.filter((market) => !isBinanceMarketSupported(market));

export const getBinanceCandles = async (
  market,
  { interval = DEFAULT_KLINE_INTERVAL, limit = 180, signal } = {}
) => {
  const binanceSymbol = getBinanceTickerSymbol(market);

  if (!binanceSymbol) {
    return [];
  }

  const params = new URLSearchParams({
    symbol: binanceSymbol.toUpperCase(),
    interval,
    limit: String(Math.min(Math.max(Number(limit) || 180, 1), 1000)),
  });
  const response = await fetch(`${BINANCE_REST_BASE_URL}/klines?${params}`, {
    signal,
  });

  if (!response.ok) {
    throw new Error("Binance candles could not be loaded.");
  }

  const candles = await response.json();

  return candles.map(mapBinanceKline).filter(Boolean);
};

export const subscribeToBinanceKlines = (
  market,
  onCandle,
  { interval = DEFAULT_KLINE_INTERVAL, onStatus, reconnect = true } = {}
) => {
  if (typeof WebSocket === "undefined") {
    onStatus?.("unsupported", { reason: "WebSocket is not available." });
    return () => {};
  }

  const descriptor = toMarketDescriptor(market);
  const binanceSymbol = getBinanceTickerSymbol(descriptor);

  if (!binanceSymbol) {
    onStatus?.("unsupported", {
      market,
      reason: "No mapped Binance USDT symbol.",
    });
    return () => {};
  }

  let socket;
  let reconnectTimer;
  let reconnectAttempt = 0;
  let closedByClient = false;

  const statusPayload = () => ({
    market: descriptor,
    supportedSymbols: [binanceSymbol],
    interval,
  });

  const scheduleReconnect = () => {
    if (!reconnect || closedByClient) return;

    reconnectAttempt += 1;
    const delay = Math.min(
      RECONNECT_BASE_DELAY_MS * 2 ** (reconnectAttempt - 1),
      RECONNECT_MAX_DELAY_MS
    );

    onStatus?.("reconnecting", { ...statusPayload(), delay });
    reconnectTimer = window.setTimeout(connect, delay);
  };

  const handleMessage = (event) => {
    try {
      const payload = JSON.parse(event.data);
      const candle = mapBinanceKlineEvent(payload);

      if (!candle) return;

      onCandle({
        ...candle,
        id: descriptor.id,
        binanceSymbol,
      });
    } catch {
      onStatus?.("message-error", statusPayload());
    }
  };

  function connect() {
    onStatus?.("connecting", statusPayload());
    socket = new WebSocket(
      `${BINANCE_RAW_STREAM_BASE_URL}${binanceSymbol}@kline_${interval}`
    );

    socket.onopen = () => {
      reconnectAttempt = 0;
      onStatus?.("connected", statusPayload());
    };

    socket.onmessage = handleMessage;

    socket.onerror = () => {
      onStatus?.("error", statusPayload());
    };

    socket.onclose = () => {
      onStatus?.(closedByClient ? "closed" : "disconnected", statusPayload());
      scheduleReconnect();
    };
  }

  connect();

  return () => {
    closedByClient = true;
    window.clearTimeout(reconnectTimer);

    if (socket && socket.readyState < WebSocket.CLOSING) {
      socket.close(1000, "client disconnect");
    }
  };
};

export const subscribeToBinanceTickers = (
  markets,
  onTicker,
  { onStatus, reconnect = true } = {}
) => {
  if (typeof WebSocket === "undefined") {
    onStatus?.("unsupported", { reason: "WebSocket is not available." });
    return () => {};
  }

  const symbolToMarket = new Map();

  markets.forEach((market) => {
    const descriptor = toMarketDescriptor(market);
    const binanceSymbol = getBinanceTickerSymbol(descriptor);

    if (!binanceSymbol || symbolToMarket.has(binanceSymbol)) return;

    symbolToMarket.set(binanceSymbol, {
      id: descriptor.id,
      symbol: descriptor.symbol,
      binanceSymbol,
    });
  });

  const streamSymbols = [...symbolToMarket.keys()];

  if (!streamSymbols.length) {
    onStatus?.("unsupported", {
      unsupportedMarkets: markets,
      reason: "No mapped Binance USDT symbols.",
    });
    return () => {};
  }

  let socket;
  let reconnectTimer;
  let reconnectAttempt = 0;
  let closedByClient = false;

  const statusPayload = () => ({
    supportedSymbols: streamSymbols,
    unsupportedMarkets: getUnsupportedBinanceMarkets(markets),
  });

  const scheduleReconnect = () => {
    if (!reconnect || closedByClient) return;

    reconnectAttempt += 1;
    const delay = Math.min(
      RECONNECT_BASE_DELAY_MS * 2 ** (reconnectAttempt - 1),
      RECONNECT_MAX_DELAY_MS
    );

    onStatus?.("reconnecting", { ...statusPayload(), delay });
    reconnectTimer = window.setTimeout(connect, delay);
  };

  const handleMessage = (event) => {
    try {
      const message = JSON.parse(event.data);
      const payload = message.data || message;
      const binanceSymbol = normalizeSymbol(payload.s);
      const market = symbolToMarket.get(binanceSymbol);
      const price = parseNumber(payload.c);

      if (!market || price === null) return;

      onTicker({
        id: market.id || binanceSymbol,
        symbol: market.symbol || getSymbolLabel(binanceSymbol),
        binanceSymbol,
        price,
        changePercent24h: parseNumber(payload.P),
        priceChange24h: parseNumber(payload.p),
        volume: parseNumber(payload.v),
        quoteVolume: parseNumber(payload.q),
        eventTime: payload.E || Date.now(),
        source: "binance",
      });
    } catch {
      onStatus?.("message-error", statusPayload());
    }
  };

  function connect() {
    const streams = streamSymbols
      .map((symbol) => `${symbol}@ticker`)
      .join("/");

    onStatus?.("connecting", statusPayload());
    socket = new WebSocket(`${BINANCE_STREAM_BASE_URL}${streams}`);

    socket.onopen = () => {
      reconnectAttempt = 0;
      onStatus?.("connected", statusPayload());
    };

    socket.onmessage = handleMessage;

    socket.onerror = () => {
      onStatus?.("error", statusPayload());
    };

    socket.onclose = () => {
      onStatus?.(closedByClient ? "closed" : "disconnected", statusPayload());
      scheduleReconnect();
    };
  }

  connect();

  return () => {
    closedByClient = true;
    window.clearTimeout(reconnectTimer);

    if (socket && socket.readyState < WebSocket.CLOSING) {
      socket.close(1000, "client disconnect");
    }
  };
};
