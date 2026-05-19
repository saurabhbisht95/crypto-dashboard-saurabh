import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { getMarketCoins } from "../services/coinGecko.service.js";

const getWatchlistPayload = async (user) => {
  const ids = user.watchlist || [];
  const coins = ids.length ? await getMarketCoins({ ids, perPage: ids.length }) : [];

  return {
    ids,
    coins,
  };
};

export const getWatchlist = asyncHandler(async (req, res) => {
  const watchlist = await getWatchlistPayload(req.user);
  return res.status(200).json(new ApiResponse(200, { watchlist }));
});

export const addToWatchlist = asyncHandler(async (req, res) => {
  const { coinId } = req.params;

  if (!coinId) {
    throw new ApiError(400, "Coin id is required.");
  }

  if (!req.user.watchlist.includes(coinId)) {
    req.user.watchlist.push(coinId);
    await req.user.save();
  }

  const watchlist = await getWatchlistPayload(req.user);
  return res
    .status(200)
    .json(new ApiResponse(200, { watchlist }, "Coin added to watchlist."));
});

export const removeFromWatchlist = asyncHandler(async (req, res) => {
  const { coinId } = req.params;
  req.user.watchlist = req.user.watchlist.filter((id) => id !== coinId);
  await req.user.save();

  const watchlist = await getWatchlistPayload(req.user);
  return res
    .status(200)
    .json(new ApiResponse(200, { watchlist }, "Coin removed from watchlist."));
});
