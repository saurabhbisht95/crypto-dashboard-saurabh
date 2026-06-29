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

const parseBoolean = (value, fallback) => {
  if (value === undefined) return fallback;
  return value === "true";
};

const parseSameSite = (value, fallback) => {
  const normalized = value?.toLowerCase();
  return ["lax", "strict", "none"].includes(normalized) ? normalized : fallback;
};

const corsOrigins = parseOrigins(process.env.CORS_ORIGIN);
const hasSecureCorsOrigin = corsOrigins.some((origin) =>
  origin.startsWith("https://")
);
const shouldUseCrossSiteCookies =
  process.env.NODE_ENV === "production" || hasSecureCorsOrigin;
const cookieSameSite = parseSameSite(
  process.env.COOKIE_SAME_SITE,
  shouldUseCrossSiteCookies ? "none" : "lax"
);

export const env = {
  port: process.env.PORT || 9000,
  nodeEnv: process.env.NODE_ENV || "development",
  mongoUri: process.env.MONGODB_URI,
  corsOrigins,
  jwtSecret:
    process.env.JWT_SECRET || "development-secret-change-before-production",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
  cookieSecure: parseBoolean(
    process.env.COOKIE_SECURE,
    shouldUseCrossSiteCookies || cookieSameSite === "none"
  ),
  cookieSameSite,
  marketProvider: process.env.MARKET_PROVIDER || "coinlore",
  alertCheckIntervalMs: Number(process.env.ALERT_CHECK_INTERVAL_MS) || 300000,
  marketFetchTimeoutMs: Number(process.env.MARKET_FETCH_TIMEOUT_MS) || 12000,
  marketProviderMinIntervalMs:
    Number(process.env.MARKET_PROVIDER_MIN_INTERVAL_MS) || 1000,
  marketStaleCacheTtlMs:
    Number(process.env.MARKET_STALE_CACHE_TTL_MS) || 60 * 60 * 1000,
};

export const isProduction = env.nodeEnv === "production";
