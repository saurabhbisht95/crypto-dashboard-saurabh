import ApiResponse from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  getCoin,
  getMarketChart,
  getMarketCoins,
} from "../services/coinGecko.service.js";

export const getCoins = asyncHandler(async (req, res) => {
  const page = Number(req.query.page) || 1;
  const perPage = Math.min(Number(req.query.perPage) || 100, 250);
  const ids = req.query.ids
    ? req.query.ids
        .split(",")
        .map((id) => id.trim())
        .filter(Boolean)
    : undefined;

  const coins = await getMarketCoins({ page, perPage, ids });
  return res.status(200).json(new ApiResponse(200, { coins }));
});

export const getCoinById = asyncHandler(async (req, res) => {
  const coin = await getCoin(req.params.coinId);
  return res.status(200).json(new ApiResponse(200, { coin }));
});

export const getCoinChart = asyncHandler(async (req, res) => {
  const days = Number(req.query.days) || 30;
  const data = await getMarketChart(req.params.coinId, days);
  return res.status(200).json(new ApiResponse(200, { chart: data }));
});

export const getMarketSummary = asyncHandler(async (req, res) => {
  const coins = await getMarketCoins({ perPage: 100 });
  const sortedByChange = [...coins].sort(
    (a, b) =>
      (b.price_change_percentage_24h || 0) -
      (a.price_change_percentage_24h || 0)
  );

  const marketCap = coins.reduce((sum, coin) => sum + (coin.market_cap || 0), 0);
  const volume24h = coins.reduce((sum, coin) => sum + (coin.total_volume || 0), 0);

  return res.status(200).json(
    new ApiResponse(200, {
      marketCap,
      volume24h,
      topGainers: sortedByChange.slice(0, 5),
      topLosers: sortedByChange.slice(-5).reverse(),
      bitcoinDominance:
        marketCap > 0
          ? ((coins.find((coin) => coin.id === "bitcoin")?.market_cap || 0) /
              marketCap) *
            100
          : 0,
    })
  );
});
