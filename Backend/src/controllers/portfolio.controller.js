import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { toNumber } from "../utils/validators.js";
import { Holding } from "../models/Holding.model.js";
import { enrichHoldings } from "../services/portfolio.service.js";

export const getPortfolio = asyncHandler(async (req, res) => {
  const holdings = await Holding.find({ user: req.user._id }).sort({
    createdAt: -1,
  });
  const portfolio = await enrichHoldings(holdings);

  return res.status(200).json(new ApiResponse(200, { portfolio }));
});

export const upsertHolding = asyncHandler(async (req, res) => {
  const { coinId, symbol, name } = req.body;
  const amount = toNumber(req.body.amount);
  const averageBuyPrice = toNumber(req.body.averageBuyPrice);

  if (!coinId || !symbol || !name || amount <= 0 || averageBuyPrice <= 0) {
    throw new ApiError(
      400,
      "Coin, symbol, name, amount, and average buy price are required."
    );
  }

  await Holding.findOneAndUpdate(
    { user: req.user._id, coinId },
    {
      user: req.user._id,
      coinId,
      symbol,
      name,
      amount,
      averageBuyPrice,
    },
    { upsert: true, new: true, runValidators: true }
  );

  const holdings = await Holding.find({ user: req.user._id }).sort({
    createdAt: -1,
  });
  const portfolio = await enrichHoldings(holdings);

  return res
    .status(200)
    .json(new ApiResponse(200, { portfolio }, "Holding saved."));
});

export const deleteHolding = asyncHandler(async (req, res) => {
  await Holding.deleteOne({ _id: req.params.holdingId, user: req.user._id });

  const holdings = await Holding.find({ user: req.user._id }).sort({
    createdAt: -1,
  });
  const portfolio = await enrichHoldings(holdings);

  return res
    .status(200)
    .json(new ApiResponse(200, { portfolio }, "Holding removed."));
});
