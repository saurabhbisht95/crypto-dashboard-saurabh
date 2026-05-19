import { marketService } from "../services/marketService";

export const getPrices = async (id, days, priceType) => {
  const data = await marketService.getCoinChart(id, { days });

  if (priceType === "market_caps") {
    return data.market_caps || [];
  }

  if (priceType === "total_volumes") {
    return data.total_volumes || [];
  }

  return data.prices || [];
};
