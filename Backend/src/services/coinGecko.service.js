import ApiError from "../utils/ApiError.js";
import { cache } from "../utils/cache.js";
import { env } from "../config/env.js";

const BASE_URL = "https://api.coingecko.com/api/v3";
const MARKET_CACHE_TTL = 60 * 1000;
const COIN_CACHE_TTL = 2 * 60 * 1000;
const CHART_CACHE_TTL = 60 * 1000;
const LIVE_CACHE_TTL = 10 * 1000;
const DISCOVERY_CACHE_TTL = 10 * 60 * 1000;
const EXTENDED_CACHE_TTL = 5 * 60 * 1000;

const POPULAR_NFT_IDS = [
  "pudgy-penguins",
  "cryptopunks",
  "bored-ape-yacht-club",
  "mutant-ape-yacht-club",
  "azuki",
  "milady-maker",
  "doodles-official",
  "moonbirds",
];

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
      values[currencyCode] = currencyCode === "usd" ? coin.current_price : 0;
      return values;
    }, {});
    prices[id].usd_24h_change = coin.price_change_percentage_24h;
    return prices;
  }, {});
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

const fetchJson = async (path, params = {}, ttl = MARKET_CACHE_TTL) => {
  const url = buildUrl(path, params);
  const cacheKey = url.toString();
  const cached = cache.get(cacheKey);
  const stale = cache.getStale(cacheKey);

  if (cached) {
    return cached;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), env.marketFetchTimeoutMs);

  try {
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
    cache.set(cacheKey, data, ttl);
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

    if ([429, 500, 502, 503, 504].includes(error.statusCode)) {
      if (path === "/coins/markets") {
        return fallbackMarketCoins(params);
      }

      if (path === "/simple/price") {
        return fallbackSimplePrices(params);
      }
    }

    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
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

    const settled = await Promise.allSettled(
      POPULAR_NFT_IDS.slice(0, perPage).map((nftId) => getNftDetails(nftId))
    );

    return settled
      .filter((result) => result.status === "fulfilled")
      .map((result) => result.value);
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
