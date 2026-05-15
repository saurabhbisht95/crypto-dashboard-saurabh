import { fetchCoinGecko } from "./api";

export const getPrices = async (id, days, priceType, options = {}) => {
  const data = await fetchCoinGecko(`/coins/${id}/market_chart`, {
    params: {
      vs_currency: "usd",
      days,
      interval: "daily",
    },
    cacheKey: `coin-${id}-market-chart-${days}`,
    cacheTtl: 60 * 1000,
    ...options,
  });

  if (priceType === "market_caps") {
    return data.market_caps || [];
  }

  if (priceType === "total_volumes") {
    return data.total_volumes || [];
  }

  return data.prices || [];
};
