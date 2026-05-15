import { fetchCoinGecko } from "./api";

export const get100Coins = (options = {}) => {
  return fetchCoinGecko("/coins/markets", {
    params: {
      vs_currency: "usd",
      order: "market_cap_desc",
      per_page: 100,
      page: 1,
      sparkline: false,
    },
    cacheKey: "coins-markets-top-100-usd",
    cacheTtl: 60 * 1000,
    ...options,
  });
};
