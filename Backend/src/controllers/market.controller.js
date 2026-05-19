import ApiResponse from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  getCoin,
  getLivePrices,
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

export const getLiveMarketPrices = asyncHandler(async (req, res) => {
  const ids = req.query.ids
    ? req.query.ids
        .split(",")
        .map((id) => id.trim())
        .filter(Boolean)
    : ["bitcoin", "ethereum", "solana", "ripple", "dogecoin"];

  const prices = await getLivePrices(ids.slice(0, 25));

  return res.status(200).json(
    new ApiResponse(200, {
      prices,
      polledAt: new Date().toISOString(),
      mode: "polling",
    })
  );
});

export const getMarketHeatmap = asyncHandler(async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 50, 100);
  const coins = await getMarketCoins({ perPage: limit });

  const heatmap = coins.map((coin) => ({
    id: coin.id,
    name: coin.name,
    symbol: coin.symbol,
    image: coin.image,
    marketCap: coin.market_cap || 0,
    currentPrice: coin.current_price || 0,
    volume24h: coin.total_volume || 0,
    change24h: coin.price_change_percentage_24h || 0,
  }));

  return res.status(200).json(new ApiResponse(200, { heatmap }));
});

export const getMarketIntelligence = asyncHandler(async (req, res) => {
  const coins = await getMarketCoins({ perPage: 100 });
  const sortedByChange = [...coins].sort(
    (a, b) =>
      (b.price_change_percentage_24h || 0) -
      (a.price_change_percentage_24h || 0)
  );
  const sortedByVolume = [...coins].sort(
    (a, b) => (b.total_volume || 0) - (a.total_volume || 0)
  );
  const averageChange =
    coins.reduce((sum, coin) => sum + (coin.price_change_percentage_24h || 0), 0) /
    Math.max(coins.length, 1);
  const positiveCount = coins.filter(
    (coin) => (coin.price_change_percentage_24h || 0) >= 0
  ).length;
  const sentiment =
    positiveCount / Math.max(coins.length, 1) >= 0.6
      ? "Bullish"
      : positiveCount / Math.max(coins.length, 1) <= 0.4
        ? "Bearish"
        : "Neutral";

  const signals = [
    {
      title: "Market Pulse",
      sentiment,
      description: `${positiveCount} of the top ${coins.length} coins are green over 24h. Average move is ${averageChange.toFixed(
        2
      )}%.`,
    },
    {
      title: "Momentum Leader",
      sentiment: "Bullish",
      description: `${sortedByChange[0]?.name || "Top asset"} is leading the board at ${(
        sortedByChange[0]?.price_change_percentage_24h || 0
      ).toFixed(2)}% over 24h.`,
    },
    {
      title: "Liquidity Watch",
      sentiment: "Neutral",
      description: `${sortedByVolume[0]?.name || "The highest-volume asset"} is carrying the strongest 24h volume among tracked coins.`,
    },
    {
      title: "Risk Note",
      sentiment: "Bearish",
      description: `${sortedByChange.at(-1)?.name || "The weakest asset"} is the weakest top-100 mover at ${(
        sortedByChange.at(-1)?.price_change_percentage_24h || 0
      ).toFixed(2)}%.`,
    },
  ];

  return res.status(200).json(
    new ApiResponse(200, {
      sentiment,
      positiveCount,
      negativeCount: coins.length - positiveCount,
      averageChange,
      topGainers: sortedByChange.slice(0, 5),
      topLosers: sortedByChange.slice(-5).reverse(),
      highVolume: sortedByVolume.slice(0, 5),
      signals,
      generatedAt: new Date().toISOString(),
    })
  );
});
