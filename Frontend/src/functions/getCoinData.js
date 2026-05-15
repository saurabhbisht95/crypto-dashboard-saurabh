import { fetchCoinGecko } from "./api";

export const getCoinData = (id, options = {}) => {
  return fetchCoinGecko(`/coins/${id}`, {
    params: {
      localization: false,
      tickers: false,
      market_data: true,
      community_data: false,
      developer_data: false,
      sparkline: false,
    },
    cacheKey: `coin-${id}`,
    cacheTtl: 2 * 60 * 1000,
    ...options,
  });
};
