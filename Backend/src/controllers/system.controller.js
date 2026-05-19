import mongoose from "mongoose";
import ApiResponse from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { cache } from "../utils/cache.js";
import { env } from "../config/env.js";

const getMongoStatus = () => {
  const states = {
    0: "disconnected",
    1: "connected",
    2: "connecting",
    3: "disconnecting",
  };

  return states[mongoose.connection.readyState] || "unknown";
};

export const getSystemStatus = asyncHandler(async (req, res) => {
  return res.status(200).json(
    new ApiResponse(200, {
      api: "ok",
      mongodb: getMongoStatus(),
      cache: cache.stats(),
      liveMode: "polling",
      alertCheckIntervalMs: env.alertCheckIntervalMs,
      coinGeckoApiKeyConfigured: Boolean(env.coinGeckoApiKey),
      timestamp: new Date().toISOString(),
    })
  );
});
