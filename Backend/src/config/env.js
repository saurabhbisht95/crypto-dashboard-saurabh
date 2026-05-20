import dotenv from "dotenv";

dotenv.config();

const parseOrigins = (value) => {
  const defaults = ["http://localhost:3000", "http://localhost:3001"];

  if (!value) {
    return defaults;
  }

  return [
    ...new Set([
      ...defaults,
      ...value
        .split(",")
        .map((origin) => origin.trim())
        .filter(Boolean),
    ]),
  ];
};

export const env = {
  port: process.env.PORT || 9000,
  nodeEnv: process.env.NODE_ENV || "development",
  mongoUri: process.env.MONGODB_URI,
  corsOrigins: parseOrigins(process.env.CORS_ORIGIN),
  jwtSecret:
    process.env.JWT_SECRET || "development-secret-change-before-production",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
  coinGeckoApiKey: process.env.COINGECKO_API_KEY || "",
  alertCheckIntervalMs: Number(process.env.ALERT_CHECK_INTERVAL_MS) || 300000,
  marketFetchTimeoutMs: Number(process.env.MARKET_FETCH_TIMEOUT_MS) || 12000,
  marketProviderMinIntervalMs:
    Number(process.env.MARKET_PROVIDER_MIN_INTERVAL_MS) || 2500,
  marketStaleCacheTtlMs:
    Number(process.env.MARKET_STALE_CACHE_TTL_MS) || 60 * 60 * 1000,
};

export const isProduction = env.nodeEnv === "production";
