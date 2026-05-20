import ApiError from "../utils/ApiError.js";
import { cache } from "../utils/cache.js";
import { env } from "../config/env.js";

const BASE_URL = "https://api.coingecko.com/api/v3";
const MARKET_CACHE_TTL = 5 * 60 * 1000;
const COIN_CACHE_TTL = 10 * 60 * 1000;
const CHART_CACHE_TTL = 10 * 60 * 1000;
const LIVE_CACHE_TTL = 30 * 1000;
const DISCOVERY_CACHE_TTL = 20 * 60 * 1000;
const EXTENDED_CACHE_TTL = 20 * 60 * 1000;
const FALLBACK_CACHE_TTL = 60 * 1000;

const pendingRequests = new Map();
let nextProviderRequestAt = 0;

const FIAT_USD_RATES = {
  usd: 1,
  eur: 0.86,
  gbp: 0.75,
  inr: 83.2,
  jpy: 156,
  cad: 1.37,
  aud: 1.51,
  sgd: 1.3,
  aed: 3.67,
  brl: 5.05,
};

const FALLBACK_MARKET_COINS = [
  {
    id: "bitcoin",
    symbol: "btc",
    name: "Bitcoin",
    image: "https://assets.coingecko.com/coins/images/1/large/bitcoin.png",
    current_price: 76800,
    market_cap: 1539000000000,
    market_cap_rank: 1,
    fully_diluted_valuation: 1539000000000,
    total_volume: 33000000000,
    price_change_percentage_24h: 0.25,
  },
  {
    id: "ethereum",
    symbol: "eth",
    name: "Ethereum",
    image: "https://assets.coingecko.com/coins/images/279/large/ethereum.png",
    current_price: 2115,
    market_cap: 255000000000,
    market_cap_rank: 2,
    fully_diluted_valuation: 255000000000,
    total_volume: 14800000000,
    price_change_percentage_24h: 0.5,
  },
  {
    id: "tether",
    symbol: "usdt",
    name: "Tether",
    image: "https://assets.coingecko.com/coins/images/325/large/Tether.png",
    current_price: 1,
    market_cap: 189000000000,
    market_cap_rank: 3,
    fully_diluted_valuation: 195000000000,
    total_volume: 55000000000,
    price_change_percentage_24h: 0,
  },
  {
    id: "binancecoin",
    symbol: "bnb",
    name: "BNB",
    image: "https://assets.coingecko.com/coins/images/825/large/bnb-icon2_2x.png",
    current_price: 640,
    market_cap: 86200000000,
    market_cap_rank: 4,
    fully_diluted_valuation: 86200000000,
    total_volume: 630000000,
    price_change_percentage_24h: 0,
  },
  {
    id: "ripple",
    symbol: "xrp",
    name: "XRP",
    image: "https://assets.coingecko.com/coins/images/44/large/xrp-symbol-white-128.png",
    current_price: 1.37,
    market_cap: 84500000000,
    market_cap_rank: 5,
    fully_diluted_valuation: 136000000000,
    total_volume: 1700000000,
    price_change_percentage_24h: -1,
  },
  {
    id: "solana",
    symbol: "sol",
    name: "Solana",
    image: "https://assets.coingecko.com/coins/images/4128/large/solana.png",
    current_price: 84.6,
    market_cap: 48900000000,
    market_cap_rank: 7,
    fully_diluted_valuation: 53000000000,
    total_volume: 2300000000,
    price_change_percentage_24h: 0.4,
  },
  {
    id: "dogecoin",
    symbol: "doge",
    name: "Dogecoin",
    image: "https://assets.coingecko.com/coins/images/5/large/dogecoin.png",
    current_price: 0.104,
    market_cap: 16000000000,
    market_cap_rank: 10,
    fully_diluted_valuation: 17600000000,
    total_volume: 720000000,
    price_change_percentage_24h: -0.25,
  },
  {
    id: "hyperliquid",
    symbol: "hype",
    name: "Hyperliquid",
    image: "https://assets.coingecko.com/coins/images/50882/large/hyperliquid.jpg",
    current_price: 48.7,
    market_cap: 11600000000,
    market_cap_rank: 12,
    fully_diluted_valuation: 46900000000,
    total_volume: 706000000,
    price_change_percentage_24h: 7.27,
  },
];

const fallbackMarketCoins = (params = {}) => {
  const ids = params.ids ? params.ids.split(",").filter(Boolean) : [];
  const perPage = Number(params.per_page) || FALLBACK_MARKET_COINS.length;
  const source = ids.length
    ? FALLBACK_MARKET_COINS.filter((coin) => ids.includes(coin.id))
    : FALLBACK_MARKET_COINS;

  return source.slice(0, perPage).map((coin) => ({
    ...coin,
    high_24h: coin.current_price * 1.02,
    low_24h: coin.current_price * 0.98,
    price_change_24h:
      (coin.current_price * coin.price_change_percentage_24h) / 100,
    market_cap_change_24h:
      (coin.market_cap * coin.price_change_percentage_24h) / 100,
    market_cap_change_percentage_24h: coin.price_change_percentage_24h,
    circulating_supply: 0,
    total_supply: 0,
    max_supply: null,
    ath: coin.current_price * 2,
    ath_change_percentage: -50,
    atl: coin.current_price * 0.01,
    atl_change_percentage: 9900,
    sparkline_in_7d: { price: [] },
    price_change_percentage_1h_in_currency: coin.price_change_percentage_24h / 8,
    price_change_percentage_24h_in_currency: coin.price_change_percentage_24h,
    price_change_percentage_7d_in_currency: coin.price_change_percentage_24h * 2,
    price_change_percentage_30d_in_currency: coin.price_change_percentage_24h * 5,
    fallback: true,
  }));
};

const fallbackSimplePrices = (params = {}) => {
  const ids = params.ids ? params.ids.split(",").filter(Boolean) : [];
  const vsCurrencies = params.vs_currencies
    ? params.vs_currencies.split(",").filter(Boolean)
    : ["usd"];

  return ids.reduce((prices, id) => {
    const coin = FALLBACK_MARKET_COINS.find((item) => item.id === id);

    if (!coin) return prices;

    prices[id] = vsCurrencies.reduce((values, currencyCode) => {
      const usdRate = FIAT_USD_RATES[currencyCode] || 0;
      values[currencyCode] = usdRate ? coin.current_price * usdRate : 0;
      return values;
    }, {});
    prices[id].usd_24h_change = coin.price_change_percentage_24h;
    return prices;
  }, {});
};

const fallbackCategories = () => [
  {
    id: "smart-contract-platform",
    name: "Smart Contract Platform",
    market_cap: 2200000000000,
    volume_24h: 60000000000,
    market_cap_change_24h: -0.9,
    top_3_coins: FALLBACK_MARKET_COINS.slice(0, 3).map((coin) => coin.image),
  },
  {
    id: "stablecoins",
    name: "Stablecoins",
    market_cap: 318000000000,
    volume_24h: 70000000000,
    market_cap_change_24h: 0.05,
    top_3_coins: FALLBACK_MARKET_COINS.slice(2, 5).map((coin) => coin.image),
  },
  {
    id: "meme-token",
    name: "Meme",
    market_cap: 65000000000,
    volume_24h: 4500000000,
    market_cap_change_24h: 1.2,
    top_3_coins: FALLBACK_MARKET_COINS.slice(5, 8).map((coin) => coin.image),
  },
];

const fallbackTrending = () => ({
  coins: FALLBACK_MARKET_COINS.slice(0, 7).map((coin) => ({
    item: {
      id: coin.id,
      name: coin.name,
      symbol: coin.symbol,
      market_cap_rank: coin.market_cap_rank,
      thumb: coin.image,
      small: coin.image,
      large: coin.image,
      data: {
        price: coin.current_price,
        price_change_percentage_24h: {
          usd: coin.price_change_percentage_24h,
        },
        market_cap: `$${coin.market_cap.toLocaleString("en-US")}`,
        total_volume: `$${coin.total_volume.toLocaleString("en-US")}`,
      },
    },
  })),
  nfts: [],
  categories: [],
});

const fallbackAssetPlatforms = () => [
  { id: "ethereum", name: "Ethereum", shortname: "ETH" },
  { id: "solana", name: "Solana", shortname: "SOL" },
  { id: "polygon-pos", name: "Polygon POS", shortname: "MATIC" },
  { id: "arbitrum-one", name: "Arbitrum One", shortname: "ARB" },
  { id: "base", name: "Base", shortname: "BASE" },
];

const fallbackExchanges = () => [
  {
    id: "coinbase",
    name: "Coinbase Exchange",
    image: "",
    country: "United States",
    year_established: 2012,
    trust_score: 10,
    trust_score_rank: 1,
    trade_volume_24h_btc: 17600,
    url: "https://www.coinbase.com/",
    has_trading_incentive: false,
  },
  {
    id: "binance",
    name: "Binance",
    image: "",
    country: "Global",
    year_established: 2017,
    trust_score: 10,
    trust_score_rank: 2,
    trade_volume_24h_btc: 100000,
    url: "https://www.binance.com/",
    has_trading_incentive: false,
  },
  {
    id: "kraken",
    name: "Kraken",
    image: "",
    country: "United States",
    year_established: 2011,
    trust_score: 10,
    trust_score_rank: 3,
    trade_volume_24h_btc: 12000,
    url: "https://www.kraken.com/",
    has_trading_incentive: false,
  },
];

const FALLBACK_NFT_COLLECTIONS = [
  {
    id: "pudgy-penguins",
    name: "Pudgy Penguins",
    symbol: "PPG",
    floorPriceUsd: 42000,
    floorPriceNative: 12.4,
    marketCapUsd: 370000000,
    volume24hUsd: 7200000,
    change24h: 1.8,
  },
  {
    id: "cryptopunks",
    name: "CryptoPunks",
    symbol: "PUNK",
    floorPriceUsd: 126000,
    floorPriceNative: 38.2,
    marketCapUsd: 1250000000,
    volume24hUsd: 11500000,
    change24h: -0.7,
  },
  {
    id: "bored-ape-yacht-club",
    name: "Bored Ape Yacht Club",
    symbol: "BAYC",
    floorPriceUsd: 28500,
    floorPriceNative: 8.7,
    marketCapUsd: 284000000,
    volume24hUsd: 3900000,
    change24h: 0.4,
  },
  {
    id: "azuki",
    name: "Azuki",
    symbol: "AZUKI",
    floorPriceUsd: 11200,
    floorPriceNative: 3.4,
    marketCapUsd: 112000000,
    volume24hUsd: 2100000,
    change24h: 2.2,
  },
];

const findFallbackCoin = (coinId) =>
  FALLBACK_MARKET_COINS.find((coin) => coin.id === coinId) ||
  FALLBACK_MARKET_COINS.find((coin) => coin.symbol === coinId);

const fallbackCoinDetails = (coinId) => {
  const coin = findFallbackCoin(coinId);

  if (!coin) return null;

  return {
    id: coin.id,
    symbol: coin.symbol,
    name: coin.name,
    image: {
      thumb: coin.image,
      small: coin.image,
      large: coin.image,
    },
    description: {
      en: `${coin.name} market data is being served from the backend fallback snapshot while the live provider recovers.`,
    },
    categories: [],
    genesis_date: null,
    links: {
      homepage: [],
      blockchain_site: [],
      subreddit_url: "",
      repos_url: { github: [] },
    },
    community_data: {
      reddit_subscribers: 0,
    },
    developer_data: {
      forks: 0,
      stars: 0,
      commit_count_4_weeks: 0,
    },
    market_data: {
      current_price: { usd: coin.current_price },
      market_cap: { usd: coin.market_cap },
      total_volume: { usd: coin.total_volume },
      fully_diluted_valuation: { usd: coin.fully_diluted_valuation },
      high_24h: { usd: coin.current_price * 1.02 },
      low_24h: { usd: coin.current_price * 0.98 },
      price_change_24h:
        (coin.current_price * coin.price_change_percentage_24h) / 100,
      price_change_percentage_24h: coin.price_change_percentage_24h,
      market_cap_change_24h:
        (coin.market_cap * coin.price_change_percentage_24h) / 100,
      market_cap_change_percentage_24h: coin.price_change_percentage_24h,
      circulating_supply: 0,
      total_supply: 0,
      max_supply: null,
      ath: { usd: coin.current_price * 2 },
      ath_change_percentage: { usd: -50 },
      atl: { usd: coin.current_price * 0.01 },
      atl_change_percentage: { usd: 9900 },
    },
    tickers: [
      {
        base: coin.symbol.toUpperCase(),
        target: "USD",
        market: { name: "Backend Fallback" },
        last: coin.current_price,
        volume: coin.total_volume,
        trust_score: "green",
        trade_url: "",
      },
    ],
    fallback: true,
  };
};

const getFallbackPrecision = (price) => (price >= 1 ? 2 : 6);

const fallbackMarketChart = (coinId, days = 30) => {
  const coin = findFallbackCoin(coinId);

  if (!coin) return null;

  const requestedDays = Math.max(Number(days) || 30, 1);
  const points = Math.min(Math.max(requestedDays, 7), 90);
  const totalMs = requestedDays * 24 * 60 * 60 * 1000;
  const stepMs = totalMs / Math.max(points - 1, 1);
  const startAt = Date.now() - totalMs;
  const supply = coin.current_price > 0 ? coin.market_cap / coin.current_price : 0;
  const precision = getFallbackPrecision(coin.current_price);

  const prices = Array.from({ length: points }, (_, index) => {
    const progress = points > 1 ? index / (points - 1) : 1;
    const wave = 1 + Math.sin(index * 0.72) * 0.018 + Math.cos(index * 0.23) * 0.012;
    const trend = 1 + ((progress - 1) * coin.price_change_percentage_24h) / 100;
    const value = Number((coin.current_price * wave * trend).toFixed(precision));

    return [Math.round(startAt + stepMs * index), Math.max(value, 0)];
  });

  return {
    prices,
    market_caps: prices.map(([timestamp, price]) => [timestamp, price * supply]),
    total_volumes: prices.map(([timestamp], index) => [
      timestamp,
      coin.total_volume * (1 + Math.sin(index * 0.5) * 0.08),
    ]),
    fallback: true,
  };
};

const fallbackOhlc = (coinId, days = 30) => {
  const chart = fallbackMarketChart(coinId, days);

  if (!chart) return null;

  return chart.prices.map(([timestamp, close], index, prices) => {
    const open = index === 0 ? close * 0.995 : prices[index - 1][1];
    const high = Math.max(open, close) * 1.01;
    const low = Math.min(open, close) * 0.99;

    return [timestamp, open, high, low, close];
  });
};

const fallbackNewCoins = () =>
  FALLBACK_MARKET_COINS.map((coin, index) => ({
    id: coin.id,
    symbol: coin.symbol,
    name: coin.name,
    large: coin.image,
    small: coin.image,
    thumb: coin.image,
    activated_at: new Date(Date.now() - index * 24 * 60 * 60 * 1000).toISOString(),
  }));

const toNftPayload = (collection) => ({
  id: collection.id,
  name: collection.name,
  symbol: collection.symbol,
  image: { small: "", small_2x: "", thumb: "" },
  asset_platform_id: "ethereum",
  native_currency: "ethereum",
  market_cap_rank: 0,
  floor_price: {
    usd: collection.floorPriceUsd,
    native_currency: collection.floorPriceNative,
  },
  market_cap: { usd: collection.marketCapUsd },
  volume_24h: { usd: collection.volume24hUsd },
  floor_price_in_usd_24h_percentage_change: collection.change24h,
  description: `${collection.name} is shown from a backend fallback snapshot while the live NFT market endpoint recovers.`,
  fallback: true,
});

const fallbackNftMarkets = (params = {}) => {
  const perPage = Number(params.per_page) || FALLBACK_NFT_COLLECTIONS.length;
  return FALLBACK_NFT_COLLECTIONS.slice(0, perPage).map(toNftPayload);
};

const fallbackNftDetails = (nftId) => {
  const collection = FALLBACK_NFT_COLLECTIONS.find((nft) => nft.id === nftId);
  return collection ? toNftPayload(collection) : null;
};

const fallbackForPath = (path, params) => {
  if (path === "/coins/markets") return fallbackMarketCoins(params);
  if (path === "/simple/price") return fallbackSimplePrices(params);
  if (path === "/coins/categories") return fallbackCategories();
  if (path === "/search/trending") return fallbackTrending();
  if (path === "/coins/list/new") return fallbackNewCoins();
  if (path === "/asset_platforms") return fallbackAssetPlatforms();
  if (path === "/exchanges") return fallbackExchanges();
  if (path === "/nfts/markets") return fallbackNftMarkets(params);

  const nftMatch = path.match(/^\/nfts\/([^/]+)$/);
  if (nftMatch) return fallbackNftDetails(nftMatch[1]);

  const chartMatch = path.match(/^\/coins\/([^/]+)\/market_chart$/);
  if (chartMatch) return fallbackMarketChart(chartMatch[1], params.days);

  const ohlcMatch = path.match(/^\/coins\/([^/]+)\/ohlc$/);
  if (ohlcMatch) return fallbackOhlc(ohlcMatch[1], params.days);

  const coinMatch = path.match(/^\/coins\/([^/]+)$/);
  if (coinMatch) return fallbackCoinDetails(coinMatch[1]);

  return null;
};

const buildUrl = (path, params = {}) => {
  const url = new URL(`${BASE_URL}${path}`);

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, value);
    }
  });

  return url;
};

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const waitForProviderSlot = async () => {
  const now = Date.now();
  const waitMs = Math.max(0, nextProviderRequestAt - now);
  nextProviderRequestAt =
    Math.max(now, nextProviderRequestAt) + env.marketProviderMinIntervalMs;

  if (waitMs) {
    await wait(waitMs);
  }
};

const fetchJson = async (path, params = {}, ttl = MARKET_CACHE_TTL) => {
  const url = buildUrl(path, params);
  const cacheKey = url.toString();
  const cached = cache.get(cacheKey);
  const stale = cache.getStale(cacheKey);

  if (cached) {
    return cached;
  }

  const requestProviderData = async ({ allowFallback = true } = {}) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(
      () => controller.abort(),
      env.marketFetchTimeoutMs
    );

    try {
      await waitForProviderSlot();

      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          accept: "application/json",
          ...(env.coinGeckoApiKey
            ? { "x-cg-demo-api-key": env.coinGeckoApiKey }
            : {}),
        },
      });

      if (!response.ok) {
        throw new ApiError(
          response.status,
          response.status === 429
            ? "CoinGecko rate limit reached. Please retry shortly."
            : "Unable to fetch market data."
        );
      }

      const data = await response.json();
      cache.set(cacheKey, data, ttl, env.marketStaleCacheTtlMs);
      return data;
    } catch (error) {
      if (error.name === "AbortError") {
        if (stale) {
          return stale;
        }

        throw new ApiError(
          504,
          "Market data provider timed out. Please retry in a moment."
        );
      }

      if ([429, 500, 502, 503, 504].includes(error.statusCode) && stale) {
        return stale;
      }

      if (
        allowFallback &&
        [429, 500, 502, 503, 504].includes(error.statusCode)
      ) {
        const fallback = fallbackForPath(path, params);

        if (fallback) {
          cache.set(
            cacheKey,
            fallback,
            FALLBACK_CACHE_TTL,
            env.marketStaleCacheTtlMs
          );
          return fallback;
        }
      }

      throw error;
    } finally {
      clearTimeout(timeoutId);
      pendingRequests.delete(cacheKey);
    }
  };

  if (stale) {
    if (!pendingRequests.has(cacheKey)) {
      const refreshPromise = requestProviderData({ allowFallback: false }).catch(
        () => null
      );
      pendingRequests.set(cacheKey, refreshPromise);
    }

    return stale;
  }

  if (pendingRequests.has(cacheKey)) {
    return pendingRequests.get(cacheKey);
  }

  const requestPromise = requestProviderData();

  pendingRequests.set(cacheKey, requestPromise);
  return requestPromise;
};

export const getMarketCoins = ({
  page = 1,
  perPage = 100,
  ids,
  sparkline = false,
  category,
  order = "market_cap_desc",
  priceChangePercentage,
} = {}) => {
  return fetchJson(
    "/coins/markets",
    {
      vs_currency: "usd",
      order,
      per_page: perPage,
      page,
      sparkline,
      category,
      price_change_percentage: priceChangePercentage,
      ...(ids?.length ? { ids: ids.join(",") } : {}),
    },
    MARKET_CACHE_TTL
  );
};

export const getCoin = (coinId) => {
  return fetchJson(
    `/coins/${coinId}`,
    {
      localization: false,
      tickers: false,
      market_data: true,
      community_data: false,
      developer_data: false,
      sparkline: false,
    },
    COIN_CACHE_TTL
  );
};

export const getCoinAdvanced = (coinId) => {
  return fetchJson(
    `/coins/${coinId}`,
    {
      localization: false,
      tickers: true,
      market_data: true,
      community_data: true,
      developer_data: true,
      sparkline: true,
    },
    COIN_CACHE_TTL
  );
};

export const getMarketChart = (coinId, days = 30) => {
  return fetchJson(
    `/coins/${coinId}/market_chart`,
    {
      vs_currency: "usd",
      days,
      interval: "daily",
    },
    CHART_CACHE_TTL
  );
};

export const getCoinOhlc = (coinId, days = 30) => {
  return fetchJson(
    `/coins/${coinId}/ohlc`,
    {
      vs_currency: "usd",
      days,
    },
    CHART_CACHE_TTL
  );
};

export const getTrendingSearch = () => {
  return fetchJson("/search/trending", {}, DISCOVERY_CACHE_TTL);
};

export const getRecentlyAddedCoins = async () => {
  try {
    return await fetchJson("/coins/list/new", {}, DISCOVERY_CACHE_TTL);
  } catch (error) {
    if ([401, 403, 404].includes(error.statusCode)) {
      const trending = await getTrendingSearch();
      return (trending.coins || []).map((coin) => coin.item);
    }

    throw error;
  }
};

export const getCoinCategories = () => {
  return fetchJson(
    "/coins/categories",
    { order: "market_cap_desc" },
    DISCOVERY_CACHE_TTL
  );
};

export const getAssetPlatforms = (filter) => {
  return fetchJson("/asset_platforms", { filter }, DISCOVERY_CACHE_TTL);
};

export const getExchanges = ({ page = 1, perPage = 50 } = {}) => {
  return fetchJson(
    "/exchanges",
    {
      per_page: perPage,
      page,
    },
    EXTENDED_CACHE_TTL
  );
};

export const getNftDetails = (nftId) => {
  return fetchJson(`/nfts/${nftId}`, {}, EXTENDED_CACHE_TTL);
};

export const getNftMarkets = async ({
  page = 1,
  perPage = 50,
  assetPlatformId = "ethereum",
  order = "market_cap_usd_desc",
} = {}) => {
  try {
    return await fetchJson(
      "/nfts/markets",
      {
        asset_platform_id: assetPlatformId,
        order,
        per_page: perPage,
        page,
      },
      EXTENDED_CACHE_TTL
    );
  } catch (error) {
    if (![401, 403, 404, 429].includes(error.statusCode)) {
      throw error;
    }

    return fallbackNftMarkets({ per_page: perPage });
  }
};

export const getSimplePrices = async (coinIds) => {
  if (!coinIds.length) {
    return {};
  }

  return fetchJson(
    "/simple/price",
    {
      ids: coinIds.join(","),
      vs_currencies: "usd",
      include_24hr_change: true,
    },
    MARKET_CACHE_TTL
  );
};

export const getCoinPrices = async (coinIds, vsCurrencies = ["usd"]) => {
  if (!coinIds.length || !vsCurrencies.length) {
    return {};
  }

  return fetchJson(
    "/simple/price",
    {
      ids: coinIds.join(","),
      vs_currencies: vsCurrencies.join(","),
      include_24hr_change: true,
      include_market_cap: true,
      include_24hr_vol: true,
    },
    MARKET_CACHE_TTL
  );
};

export const getLivePrices = async (coinIds) => {
  if (!coinIds.length) {
    return {};
  }

  return fetchJson(
    "/simple/price",
    {
      ids: coinIds.join(","),
      vs_currencies: "usd",
      include_market_cap: true,
      include_24hr_vol: true,
      include_24hr_change: true,
      include_last_updated_at: true,
    },
    LIVE_CACHE_TTL
  );
};

export const getCoinSnapshot = async (coinId) => {
  const [marketCoin] = await getMarketCoins({ ids: [coinId], perPage: 1 });

  if (!marketCoin) {
    throw new ApiError(404, "Coin not found.");
  }

  return marketCoin;
};
