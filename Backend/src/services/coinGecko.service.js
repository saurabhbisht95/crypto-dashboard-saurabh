import ApiError from "../utils/ApiError.js";
import { cache } from "../utils/cache.js";
import { env } from "../config/env.js";

const BASE_URL = "https://api.coingecko.com/api/v3";
const MARKET_CACHE_TTL = 60 * 1000;
const COIN_CACHE_TTL = 2 * 60 * 1000;
const CHART_CACHE_TTL = 60 * 1000;

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

  if (cached) {
    return cached;
  }

  const response = await fetch(url, {
    headers: {
      accept: "application/json",
      ...(env.coinGeckoApiKey ? { "x-cg-demo-api-key": env.coinGeckoApiKey } : {}),
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
};

export const getMarketCoins = ({
  page = 1,
  perPage = 100,
  ids,
  sparkline = false,
} = {}) => {
  return fetchJson(
    "/coins/markets",
    {
      vs_currency: "usd",
      order: "market_cap_desc",
      per_page: perPage,
      page,
      sparkline,
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

export const getCoinSnapshot = async (coinId) => {
  const [marketCoin] = await getMarketCoins({ ids: [coinId], perPage: 1 });

  if (!marketCoin) {
    throw new ApiError(404, "Coin not found.");
  }

  return marketCoin;
};
