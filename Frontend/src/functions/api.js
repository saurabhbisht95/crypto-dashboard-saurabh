import axios from "axios";
import { getJsonStorageValue, setJsonStorageValue } from "./storage";

const COINGECKO_API_BASE_URL = "https://api.coingecko.com/api/v3";
const CACHE_PREFIX = "cryptotracker:";
const DEFAULT_CACHE_TTL = 60 * 1000;
const DEFAULT_STALE_TTL = 24 * 60 * 60 * 1000;

const api = axios.create({
  baseURL: COINGECKO_API_BASE_URL,
  timeout: 12000,
  headers: {
    accept: "application/json",
    ...(process.env.REACT_APP_COINGECKO_API_KEY
      ? { "x-cg-demo-api-key": process.env.REACT_APP_COINGECKO_API_KEY }
      : {}),
  },
});

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const getCacheKey = (path, params, cacheKey) => {
  const query = new URLSearchParams(params).toString();
  return `${CACHE_PREFIX}${cacheKey || path}${query ? `?${query}` : ""}`;
};

const readCache = (key) => {
  return getJsonStorageValue(key, null);
};

const writeCache = (key, data) => {
  setJsonStorageValue(key, {
    data,
    timestamp: Date.now(),
  });
};

const isRetryableError = (error) => {
  if (!error.response) return true;
  return [408, 425, 429, 500, 502, 503, 504].includes(error.response.status);
};

export const getApiErrorMessage = (
  error,
  fallback = "Unable to load crypto data right now. Please try again."
) => {
  const status = error?.response?.status;

  if (error && !axios.isAxiosError(error)) {
    return fallback;
  }

  if (status === 429) {
    return "CoinGecko is rate limiting requests. Cached data will be used when available; please retry in a minute.";
  }

  if (status >= 500) {
    return "CoinGecko is temporarily unavailable. Please retry in a moment.";
  }

  if (error?.code === "ECONNABORTED") {
    return "The crypto data request timed out. Please check your connection and retry.";
  }

  if (!error?.response && error?.message) {
    return "Network error while loading crypto data. Please check your connection and retry.";
  }

  return fallback;
};

export const fetchCoinGecko = async (
  path,
  {
    params = {},
    cacheKey,
    cacheTtl = DEFAULT_CACHE_TTL,
    staleTtl = DEFAULT_STALE_TTL,
    retries = 2,
    signal,
  } = {}
) => {
  const key = getCacheKey(path, params, cacheKey);
  const cached = readCache(key);
  const cacheAge = cached ? Date.now() - cached.timestamp : Infinity;

  if (cached && cacheAge < cacheTtl) {
    return cached.data;
  }

  let lastError;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      const response = await api.get(path, { params, signal });
      writeCache(key, response.data);
      return response.data;
    } catch (error) {
      if (axios.isCancel(error) || error?.code === "ERR_CANCELED") {
        throw error;
      }

      lastError = error;

      if (!isRetryableError(error) || attempt === retries) {
        break;
      }

      await sleep(500 * (attempt + 1));
    }
  }

  if (cached && cacheAge < staleTtl) {
    return cached.data;
  }

  throw lastError;
};
