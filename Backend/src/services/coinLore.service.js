import dns from "node:dns";
import https from "node:https";
import ApiError from "../utils/ApiError.js";
import { cache } from "../utils/cache.js";
import { env } from "../config/env.js";

const BASE_URL = "https://api.coinlore.net/api";
const MARKET_CACHE_TTL = 5 * 60 * 1000;
const COIN_CACHE_TTL = 10 * 60 * 1000;
const CHART_CACHE_TTL = 10 * 60 * 1000;
const LIVE_CACHE_TTL = 30 * 1000;
const DISCOVERY_CACHE_TTL = 20 * 60 * 1000;
const EXTENDED_CACHE_TTL = 20 * 60 * 1000;
const ASSET_CACHE_TTL = 24 * 60 * 60 * 1000;
const FALLBACK_CACHE_TTL = 60 * 1000;

const FIAT_USD_RATES = {
  usd: 1,
  eur: 0.86,
  gbp: 0.75,
  inr: 83.2,
  jpy: 156,
  cad: 1.37,
  aud: 1.51,
  sgd: 1.3,
  aed: 3.67,
  brl: 5.05,
};

const COIN_ID_ALIASES = {
  binancecoin: ["bnb", "binance-coin"],
  ripple: ["xrp"],
  "matic-network": ["polygon", "matic"],
  "usd-coin": ["usdc", "usd-coin"],
};

const CATEGORY_SYMBOLS = {
  "smart-contract-platform": new Set([
    "eth",
    "bnb",
    "sol",
    "ada",
    "avax",
    "dot",
    "trx",
    "near",
    "apt",
    "sui",
  ]),
  stablecoins: new Set(["usdt", "usdc", "dai", "tusd", "usde", "fdusd"]),
  "meme-token": new Set(["doge", "shib", "pepe", "bonk", "floki", "wif"]),
};

const FALLBACK_CATEGORIES = [
  {
    id: "smart-contract-platform",
    name: "Smart Contract Platform",
    market_cap: 0,
    volume_24h: 0,
    market_cap_change_24h: 0,
    top_3_coins: [],
  },
  {
    id: "stablecoins",
    name: "Stablecoins",
    market_cap: 0,
    volume_24h: 0,
    market_cap_change_24h: 0,
    top_3_coins: [],
  },
  {
    id: "meme-token",
    name: "Meme",
    market_cap: 0,
    volume_24h: 0,
    market_cap_change_24h: 0,
    top_3_coins: [],
  },
];

const FALLBACK_ASSET_PLATFORMS = [
  { id: "bitcoin", name: "Bitcoin", shortname: "BTC" },
  { id: "ethereum", name: "Ethereum", shortname: "ETH" },
  { id: "solana", name: "Solana", shortname: "SOL" },
  { id: "polygon-pos", name: "Polygon POS", shortname: "MATIC" },
  { id: "base", name: "Base", shortname: "BASE" },
];

const FALLBACK_NFT_COLLECTIONS = [
  {
    id: "cryptopunks",
    name: "CryptoPunks",
    symbol: "PUNK",
    floorPriceUsd: 126000,
    floorPriceNative: 38.2,
    marketCapUsd: 1250000000,
    volume24hUsd: 11500000,
    change24h: -0.7,
  },
  {
    id: "bored-ape-yacht-club",
    name: "Bored Ape Yacht Club",
    symbol: "BAYC",
    floorPriceUsd: 28500,
    floorPriceNative: 8.7,
    marketCapUsd: 284000000,
    volume24hUsd: 3900000,
    change24h: 0.4,
  },
  {
    id: "azuki",
    name: "Azuki",
    symbol: "AZUKI",
    floorPriceUsd: 11200,
    floorPriceNative: 3.4,
    marketCapUsd: 112000000,
    volume24hUsd: 2100000,
    change24h: 2.2,
  },
];

const pendingRequests = new Map();
const coinLoreIdByLookup = new Map([
  ["bitcoin", "90"],
  ["btc", "90"],
]);
let nextProviderRequestAt = 0;

dns.setDefaultResultOrder?.("ipv4first");

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const toNumber = (value, fallback = 0) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
};

const slugify = (value = "") =>
  value
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const rememberTicker = (ticker) => {
  if (!ticker?.id) return;

  const lookups = [
    ticker.nameid,
    ticker.symbol?.toLowerCase(),
    slugify(ticker.name),
    ...(COIN_ID_ALIASES[ticker.nameid] || []),
  ].filter(Boolean);

  lookups.forEach((lookup) => {
    coinLoreIdByLookup.set(lookup.toLowerCase(), ticker.id);
  });
};

const getKnownCoinLoreId = (coinId) => {
  const requested = coinId?.toString().trim().toLowerCase();

  if (!requested) return null;
  if (/^\d+$/.test(requested)) return requested;

  const candidates = [requested, ...(COIN_ID_ALIASES[requested] || [])];
  return (
    candidates.map((candidate) => coinLoreIdByLookup.get(candidate)).find(Boolean) ||
    null
  );
};

const getRequestedCoinId = (coinId) => {
  const requested = coinId?.toString().trim().toLowerCase();
  return requested && !/^\d+$/.test(requested) ? requested : null;
};

const coinLogo = (slug) => `https://www.coinlore.com/img/25x25/${slug}.png`;

const waitForProviderSlot = async () => {
  const now = Date.now();
  const waitMs = Math.max(0, nextProviderRequestAt - now);
  nextProviderRequestAt =
    Math.max(now, nextProviderRequestAt) + env.marketProviderMinIntervalMs;

  if (waitMs) {
    await wait(waitMs);
  }
};

const buildUrl = (path, params = {}) => {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const url = new URL(`${BASE_URL}${normalizedPath}`);

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, value);
    }
  });

  return url;
};

const requestJson = (url) =>
  new Promise((resolve, reject) => {
    const request = https.get(
      url,
      {
        timeout: env.marketFetchTimeoutMs,
        headers: { accept: "application/json" },
      },
      (response) => {
        let body = "";

        response.setEncoding("utf8");
        response.on("data", (chunk) => {
          body += chunk;
        });
        response.on("end", () => {
          if (response.statusCode < 200 || response.statusCode >= 300) {
            reject(
              new ApiError(
                response.statusCode,
                response.statusCode === 429
                  ? "CoinLore rate limit reached. Please retry shortly."
                  : "Unable to fetch market data."
              )
            );
            return;
          }

          try {
            resolve(JSON.parse(body));
          } catch {
            reject(new ApiError(502, "Market data provider returned invalid JSON."));
          }
        });
      }
    );

    request.on("timeout", () => {
      const error = new Error("Market data provider timed out.");
      error.name = "AbortError";
      request.destroy(error);
    });
    request.on("error", reject);
  });

const fetchJson = async (path, params = {}, ttl = MARKET_CACHE_TTL) => {
  const url = buildUrl(path, params);
  const cacheKey = url.toString();
  const cached = cache.get(cacheKey);
  const stale = cache.getStale(cacheKey);

  if (cached) {
    return cached;
  }

  const requestProviderData = async () => {
    try {
      await waitForProviderSlot();

      const data = await requestJson(url);
      cache.set(cacheKey, data, ttl, env.marketStaleCacheTtlMs);
      return data;
    } catch (error) {
      if (error.name === "AbortError") {
        if (stale) return stale;

        throw new ApiError(
          504,
          "Market data provider timed out. Please retry in a moment."
        );
      }

      if ([429, 500, 502, 503, 504].includes(error.statusCode) && stale) {
        return stale;
      }

      throw error;
    } finally {
      pendingRequests.delete(cacheKey);
    }
  };

  if (stale) {
    if (!pendingRequests.has(cacheKey)) {
      pendingRequests.set(cacheKey, requestProviderData().catch(() => null));
    }

    return stale;
  }

  if (pendingRequests.has(cacheKey)) {
    return pendingRequests.get(cacheKey);
  }

  const requestPromise = requestProviderData();
  pendingRequests.set(cacheKey, requestPromise);
  return requestPromise;
};

const getAssets = () => fetchJson("/assets/", {}, ASSET_CACHE_TTL);

const findAssetFromTickerPages = async (requested) => {
  const candidates = [requested, ...(COIN_ID_ALIASES[requested] || [])];
  const pageStarts = [0, 100, 200, 300, 400];

  for (const start of pageStarts) {
    const response = await fetchJson(
      "/tickers/",
      { start, limit: 100 },
      MARKET_CACHE_TTL
    );
    const tickers = response?.data || [];

    tickers.forEach(rememberTicker);

    const match = tickers.find((ticker) =>
      candidates.some(
        (candidate) =>
          ticker.nameid?.toLowerCase() === candidate ||
          ticker.symbol?.toLowerCase() === candidate ||
          slugify(ticker.name) === candidate
      )
    );

    if (match) {
      return {
        id: match.id,
        nameid: match.nameid || slugify(match.name),
        symbol: match.symbol || "",
        name: match.name,
      };
    }
  }

  return null;
};

const findAsset = async (coinId) => {
  const requested = coinId?.toString().trim().toLowerCase();

  if (!requested) {
    return null;
  }

  if (/^\d+$/.test(requested)) {
    return { id: requested, nameid: requested, symbol: "", name: requested };
  }

  const knownId = getKnownCoinLoreId(requested);

  if (knownId) {
    return { id: knownId, nameid: requested, symbol: "", name: requested };
  }

  const tickerAsset = await findAssetFromTickerPages(requested);

  if (tickerAsset) {
    return tickerAsset;
  }

  const assets = await getAssets();
  const candidates = [requested, ...(COIN_ID_ALIASES[requested] || [])];

  return (
    assets.find((asset) =>
      candidates.some(
        (candidate) =>
          asset.nameid?.toLowerCase() === candidate ||
          asset.symbol?.toLowerCase() === candidate ||
          slugify(asset.name) === candidate
      )
    ) || null
  );
};

const resolveCoinLoreId = async (coinId) => {
  const asset = await findAsset(coinId);

  if (!asset?.id) {
    throw new ApiError(404, `Coin '${coinId}' was not found on CoinLore.`);
  }

  return asset.id;
};

const normalizeTicker = (ticker, info = null) => {
  rememberTicker(ticker);

  const slug = ticker.nameid || slugify(ticker.name) || ticker.id;
  const price = toNumber(ticker.price_usd);
  const marketCap = toNumber(ticker.market_cap_usd);
  const totalSupply = toNumber(ticker.tsupply);
  const maxSupply = toNumber(ticker.msupply, null);
  const circulatingSupply = toNumber(ticker.csupply);
  const change24h = toNumber(ticker.percent_change_24h);
  const ath = toNumber(info?.ath, null);
  const atl = toNumber(info?.first_price, null);
  const image = info?.logo || coinLogo(slug);
  const fullyDilutedValuation =
    maxSupply && price ? maxSupply * price : totalSupply && price ? totalSupply * price : marketCap;

  return {
    id: slug,
    coin_lore_id: ticker.id,
    symbol: ticker.symbol?.toLowerCase() || "",
    name: ticker.name || slug,
    image,
    current_price: price,
    market_cap: marketCap,
    market_cap_rank: Number(ticker.rank) || null,
    fully_diluted_valuation: fullyDilutedValuation || marketCap,
    total_volume: toNumber(ticker.volume24),
    high_24h: null,
    low_24h: null,
    price_change_24h: (price * change24h) / 100,
    price_change_percentage_24h: change24h,
    market_cap_change_24h: (marketCap * change24h) / 100,
    market_cap_change_percentage_24h: change24h,
    circulating_supply: circulatingSupply,
    total_supply: totalSupply,
    max_supply: maxSupply,
    ath,
    ath_change_percentage:
      ath && price ? ((price - ath) / ath) * 100 : null,
    atl,
    atl_change_percentage:
      atl && price ? ((price - atl) / atl) * 100 : null,
    sparkline_in_7d: { price: [] },
    price_change_percentage_1h_in_currency: toNumber(
      ticker.percent_change_1h
    ),
    price_change_percentage_24h_in_currency: change24h,
    price_change_percentage_7d_in_currency: toNumber(ticker.percent_change_7d),
    price_change_percentage_30d_in_currency: 0,
  };
};

const getTickerByCoinLoreId = async (coinLoreId) => {
  const response = await fetchJson(
    "/ticker/",
    { id: coinLoreId },
    MARKET_CACHE_TTL
  );
  const ticker = Array.isArray(response) ? response[0] : response?.data?.[0];

  if (!ticker) {
    throw new ApiError(404, "Coin ticker was not found on CoinLore.");
  }

  return ticker;
};

const getCoinInfoByCoinLoreId = async (coinLoreId) => {
  const response = await fetchJson(
    "/coin/info/",
    { id: coinLoreId },
    COIN_CACHE_TTL
  );

  return Array.isArray(response) ? response[0] || null : response || null;
};

const getCoinMarketsByCoinLoreId = (coinLoreId) =>
  fetchJson("/coin/markets/", { id: coinLoreId }, EXTENDED_CACHE_TTL);

const normalizeMarketsAsTickers = (markets = []) =>
  markets.slice(0, 12).map((market) => ({
    base: market.base,
    target: market.quote,
    market: { name: market.name || "" },
    last: toNumber(market.price_usd || market.price),
    volume: toNumber(market.volume_usd || market.volume),
    trust_score: "green",
    trade_url: "",
  }));

const toCoinDetails = (ticker, info = null, markets = [], idOverride = null) => {
  const marketCoin = normalizeTicker(ticker, info);
  const homepage = [info?.website].filter(Boolean);
  const explorers = [info?.explorer].filter(Boolean);
  const twitterUrl = info?.twitter
    ? `https://twitter.com/${info.twitter.replace(/^@/, "")}`
    : "";

  return {
    id: idOverride || marketCoin.id,
    coin_lore_id: marketCoin.coin_lore_id,
    symbol: marketCoin.symbol,
    name: marketCoin.name,
    image: {
      thumb: marketCoin.image,
      small: marketCoin.image,
      large: marketCoin.image,
    },
    description: {
      en:
        info?.desc ||
        `${marketCoin.name} market data is served by CoinLore. Current price, market cap, supply, OHLCV, and exchange-pair data are normalized by the CryptoTracker backend.`,
    },
    categories: info?.platform ? [info.platform] : [],
    hashing_algorithm: null,
    genesis_date: info?.startdate || null,
    links: {
      homepage,
      blockchain_site: explorers,
      official_forum_url: [],
      subreddit_url: "",
      twitter_screen_name: info?.twitter || "",
      repos_url: { github: [] },
    },
    community_data: {
      reddit_subscribers: 0,
      twitter_followers: toNumber(info?.twitter_followers),
    },
    developer_data: {
      forks: 0,
      stars: 0,
      commit_count_4_weeks: 0,
    },
    market_data: {
      current_price: { usd: marketCoin.current_price },
      market_cap: { usd: marketCoin.market_cap },
      total_volume: { usd: marketCoin.total_volume },
      fully_diluted_valuation: { usd: marketCoin.fully_diluted_valuation },
      high_24h: { usd: marketCoin.high_24h },
      low_24h: { usd: marketCoin.low_24h },
      price_change_24h: marketCoin.price_change_24h,
      price_change_percentage_24h: marketCoin.price_change_percentage_24h,
      market_cap_change_24h: marketCoin.market_cap_change_24h,
      market_cap_change_percentage_24h:
        marketCoin.market_cap_change_percentage_24h,
      circulating_supply: marketCoin.circulating_supply,
      total_supply: marketCoin.total_supply,
      max_supply: marketCoin.max_supply,
      ath: { usd: marketCoin.ath },
      ath_change_percentage: { usd: marketCoin.ath_change_percentage },
      atl: { usd: marketCoin.atl },
      atl_change_percentage: { usd: marketCoin.atl_change_percentage },
    },
    tickers: normalizeMarketsAsTickers(markets),
    links_source: twitterUrl,
  };
};

const sortCoins = (coins, order) => {
  const sorted = [...coins];

  if (order === "volume_desc") {
    return sorted.sort((a, b) => (b.total_volume || 0) - (a.total_volume || 0));
  }

  if (order === "id_asc") {
    return sorted.sort((a, b) => a.name.localeCompare(b.name));
  }

  if (order === "market_cap_asc") {
    return sorted.sort((a, b) => (a.market_cap || 0) - (b.market_cap || 0));
  }

  return sorted.sort((a, b) => (a.market_cap_rank || 999999) - (b.market_cap_rank || 999999));
};

const applyCategoryFilter = (coins, category) => {
  const symbols = CATEGORY_SYMBOLS[category];

  if (!symbols) {
    return coins;
  }

  return coins.filter((coin) => symbols.has(coin.symbol));
};

const fetchTickerPage = async (start, limit) => {
  const response = await fetchJson(
    "/tickers/",
    { start, limit },
    MARKET_CACHE_TTL
  );

  return response?.data || [];
};

const buildSyntheticOhlcvRows = (ticker, days = 30) => {
  const requestedDays = Math.min(Math.max(Number(days) || 30, 1), 365);
  const points = Math.min(Math.max(requestedDays, 7), 365);
  const currentPrice = Math.max(toNumber(ticker.price_usd), 0);
  const change =
    requestedDays <= 7
      ? toNumber(ticker.percent_change_7d)
      : toNumber(ticker.percent_change_24h) * Math.sqrt(requestedDays);
  const startPrice =
    currentPrice > 0 && change > -99
      ? currentPrice / (1 + change / 100)
      : currentPrice;
  const volume24h = toNumber(ticker.volume24);
  const startAt = Date.now() - (points - 1) * 24 * 60 * 60 * 1000;

  return Array.from({ length: points }, (_, index) => {
    const progress = points > 1 ? index / (points - 1) : 1;
    const wave = 1 + Math.sin(index * 0.76) * 0.015 + Math.cos(index * 0.31) * 0.01;
    const close =
      index === points - 1
        ? currentPrice
        : Math.max(startPrice + (currentPrice - startPrice) * progress, 0) * wave;
    const open =
      index === 0
        ? close * (1 - toNumber(ticker.percent_change_24h) / 100 / 12)
        : Math.max(startPrice + (currentPrice - startPrice) * ((index - 1) / Math.max(points - 1, 1)), 0);
    const high = Math.max(open, close) * 1.01;
    const low = Math.min(open, close) * 0.99;

    return {
      timestamp: startAt + index * 24 * 60 * 60 * 1000,
      open,
      high,
      low,
      close,
      volume: volume24h * (0.85 + Math.abs(Math.sin(index * 0.61)) * 0.3),
      synthetic: true,
    };
  });
};

const shouldUseSyntheticOhlcv = (rows, ticker) => {
  const currentPrice = toNumber(ticker.price_usd);
  const lastRow = rows.at(-1);

  if (!rows.length || !currentPrice || !lastRow?.close) {
    return true;
  }

  const ageMs = Date.now() - lastRow.timestamp;
  const priceDelta = Math.abs(lastRow.close - currentPrice) / currentPrice;

  return ageMs > 48 * 60 * 60 * 1000 || priceDelta > 0.35;
};

const getOhlcvRowsByCoinLoreId = async (coinLoreId, ticker, days = 30) => {
  const response = await fetchJson(
    "/coin/ohlcv/",
    { coin: coinLoreId },
    CHART_CACHE_TTL
  );
  const rows = Object.values(response || {})
    .map((row) => ({
      timestamp: toNumber(row[0]) * 1000,
      open: toNumber(row[1]),
      high: toNumber(row[2]),
      low: toNumber(row[3]),
      close: toNumber(row[4]),
      volume: toNumber(row[5]),
    }))
    .filter((row) => row.timestamp && row.close)
    .sort((a, b) => a.timestamp - b.timestamp);

  const requestedDays = Math.min(Math.max(Number(days) || 30, 1), 365);
  const slicedRows = rows.slice(-requestedDays);

  if (shouldUseSyntheticOhlcv(slicedRows, ticker)) {
    return buildSyntheticOhlcvRows(ticker, days);
  }

  return slicedRows;
};

const toNftPayload = (collection) => ({
  id: collection.id,
  name: collection.name,
  symbol: collection.symbol,
  image: { small: "", small_2x: "", thumb: "" },
  asset_platform_id: "ethereum",
  native_currency: "ethereum",
  market_cap_rank: 0,
  floor_price: {
    usd: collection.floorPriceUsd,
    native_currency: collection.floorPriceNative,
  },
  market_cap: { usd: collection.marketCapUsd },
  volume_24h: { usd: collection.volume24hUsd },
  floor_price_in_usd_24h_percentage_change: collection.change24h,
  description:
    "CoinLore does not provide NFT collection rankings, so this page uses the existing public fallback snapshot.",
  fallback: true,
});

export const getMarketCoins = async ({
  page = 1,
  perPage = 100,
  ids,
  category,
  order = "market_cap_desc",
} = {}) => {
  if (ids?.length) {
    const coinLoreIds = await Promise.all(ids.map(resolveCoinLoreId));
    const tickers = await Promise.all(coinLoreIds.map(getTickerByCoinLoreId));
    return sortCoins(
      applyCategoryFilter(
        tickers.map((ticker, index) => {
          const coin = normalizeTicker(ticker);
          return {
            ...coin,
            id: getRequestedCoinId(ids[index]) || coin.id,
          };
        }),
        category
      ),
      order
    ).slice(0, perPage);
  }

  const requestedPerPage = Math.min(Math.max(Number(perPage) || 100, 1), 250);
  const start = Math.max(((Number(page) || 1) - 1) * requestedPerPage, 0);
  const chunks = [];
  let remaining = requestedPerPage;
  let offset = start;

  while (remaining > 0) {
    const limit = Math.min(remaining, 100);
    chunks.push(...(await fetchTickerPage(offset, limit)));
    offset += limit;
    remaining -= limit;
  }

  const coins = chunks.map((ticker) => normalizeTicker(ticker));
  return sortCoins(applyCategoryFilter(coins, category), order);
};

export const getCoin = async (coinId) => {
  const coinLoreId = await resolveCoinLoreId(coinId);
  const [ticker, info] = await Promise.all([
    getTickerByCoinLoreId(coinLoreId),
    getCoinInfoByCoinLoreId(coinLoreId),
  ]);

  return toCoinDetails(ticker, info, [], getRequestedCoinId(coinId));
};

export const getCoinAdvanced = async (coinId) => {
  const coinLoreId = await resolveCoinLoreId(coinId);
  const [ticker, info, markets] = await Promise.all([
    getTickerByCoinLoreId(coinLoreId),
    getCoinInfoByCoinLoreId(coinLoreId),
    getCoinMarketsByCoinLoreId(coinLoreId),
  ]);

  return toCoinDetails(ticker, info, markets, getRequestedCoinId(coinId));
};

export const getMarketChart = async (coinId, days = 30) => {
  const coinLoreId = await resolveCoinLoreId(coinId);
  const ticker = await getTickerByCoinLoreId(coinLoreId);
  const rows = await getOhlcvRowsByCoinLoreId(coinLoreId, ticker, days);
  const supply = toNumber(ticker.csupply);

  return {
    prices: rows.map((row) => [row.timestamp, row.close]),
    market_caps: rows.map((row) => [row.timestamp, row.close * supply]),
    total_volumes: rows.map((row) => [row.timestamp, row.volume]),
  };
};

export const getCoinOhlc = async (coinId, days = 30) => {
  const coinLoreId = await resolveCoinLoreId(coinId);
  const ticker = await getTickerByCoinLoreId(coinLoreId);
  const rows = await getOhlcvRowsByCoinLoreId(coinLoreId, ticker, days);

  return rows.map((row) => [
    row.timestamp,
    row.open,
    row.high,
    row.low,
    row.close,
  ]);
};

export const getTrendingSearch = async () => {
  const response = await fetchJson(
    "/movers/",
    { sort: "24h" },
    DISCOVERY_CACHE_TTL
  );
  const winners = response?.data?.winners || [];

  return {
    coins: winners.map((ticker) => {
      const coin = normalizeTicker(ticker);

      return {
        item: {
          id: coin.id,
          name: coin.name,
          symbol: coin.symbol,
          market_cap_rank: coin.market_cap_rank,
          thumb: coin.image,
          small: coin.image,
          large: coin.image,
          data: {
            price: coin.current_price,
            price_change_percentage_24h: { usd: coin.price_change_percentage_24h },
            market_cap: `$${coin.market_cap.toLocaleString("en-US")}`,
            total_volume: `$${coin.total_volume.toLocaleString("en-US")}`,
          },
        },
      };
    }),
    nfts: [],
    categories: [],
  };
};

export const getRecentlyAddedCoins = async () => {
  const tickers = await fetchTickerPage(0, 16);

  return tickers.map((ticker) => ({
    id: ticker.nameid || ticker.id,
    symbol: ticker.symbol?.toLowerCase() || "",
    name: ticker.name,
    large: coinLogo(ticker.nameid || ticker.id),
    small: coinLogo(ticker.nameid || ticker.id),
    thumb: coinLogo(ticker.nameid || ticker.id),
    activated_at: "",
  }));
};

export const getCoinCategories = () => Promise.resolve(FALLBACK_CATEGORIES);

export const getAssetPlatforms = (filter) => {
  const normalizedFilter = filter?.toLowerCase();
  const chains = normalizedFilter
    ? FALLBACK_ASSET_PLATFORMS.filter((chain) =>
        chain.name.toLowerCase().includes(normalizedFilter)
      )
    : FALLBACK_ASSET_PLATFORMS;

  return Promise.resolve(chains);
};

export const getExchanges = async ({ page = 1, perPage = 50 } = {}) => {
  const [exchangeMap, btcTicker] = await Promise.all([
    fetchJson("/exchanges/", {}, EXTENDED_CACHE_TTL),
    resolveCoinLoreId("bitcoin").then(getTickerByCoinLoreId),
  ]);
  const btcPrice = Math.max(toNumber(btcTicker.price_usd), 1);
  const start = Math.max(((Number(page) || 1) - 1) * (Number(perPage) || 50), 0);

  return Object.values(exchangeMap || {})
    .sort((a, b) => toNumber(b.volume_usd) - toNumber(a.volume_usd))
    .slice(start, start + (Number(perPage) || 50))
    .map((exchange, index) => ({
      id: exchange.id || exchange.name_id,
      name: exchange.name,
      image: "",
      country: exchange.country || "Global",
      year_established: null,
      trust_score: Math.max(10 - Math.floor((start + index) / 20), 1),
      trust_score_rank: start + index + 1,
      trade_volume_24h_btc: toNumber(exchange.volume_usd) / btcPrice,
      url: exchange.url,
      has_trading_incentive: false,
    }));
};

export const getNftDetails = (nftId) => {
  const collection = FALLBACK_NFT_COLLECTIONS.find((nft) => nft.id === nftId);
  return Promise.resolve(collection ? toNftPayload(collection) : null);
};

export const getNftMarkets = ({ perPage = 50 } = {}) =>
  Promise.resolve(
    FALLBACK_NFT_COLLECTIONS.slice(0, Number(perPage) || 50).map(toNftPayload)
  );

export const getSimplePrices = async (coinIds) => {
  if (!coinIds.length) {
    return {};
  }

  const coinLoreIds = await Promise.all(coinIds.map(resolveCoinLoreId));
  const tickers = await Promise.all(coinLoreIds.map(getTickerByCoinLoreId));

  return tickers.reduce((prices, ticker, index) => {
    const coin = normalizeTicker(ticker);
    const payload = {
      usd: coin.current_price,
      usd_24h_change: coin.price_change_percentage_24h,
    };
    const requestedId = getRequestedCoinId(coinIds[index]) || coin.id;

    prices[requestedId] = payload;
    prices[coin.id] = payload;
    return prices;
  }, {});
};

export const getCoinPrices = async (coinIds, vsCurrencies = ["usd"]) => {
  if (!coinIds.length || !vsCurrencies.length) {
    return {};
  }

  const coinLoreIds = await Promise.all(coinIds.map(resolveCoinLoreId));
  const tickers = await Promise.all(coinLoreIds.map(getTickerByCoinLoreId));

  return tickers.reduce((prices, ticker, index) => {
    const coin = normalizeTicker(ticker);
    const requestedId = getRequestedCoinId(coinIds[index]) || coin.id;
    const payload = vsCurrencies.reduce((values, currencyCode) => {
      const normalizedCurrency = currencyCode.toLowerCase();
      const rate = FIAT_USD_RATES[normalizedCurrency] || 0;

      values[normalizedCurrency] = rate ? coin.current_price * rate : 0;
      return values;
    }, {});
    payload.usd_24h_change = coin.price_change_percentage_24h;
    payload.usd_market_cap = coin.market_cap;
    payload.usd_24h_vol = coin.total_volume;

    prices[requestedId] = payload;
    prices[coin.id] = payload;
    return prices;
  }, {});
};

export const getLivePrices = async (coinIds) => {
  if (!coinIds.length) {
    return {};
  }

  const coinLoreIds = await Promise.all(coinIds.map(resolveCoinLoreId));
  const tickers = await Promise.all(coinLoreIds.map(getTickerByCoinLoreId));
  const updatedAt = Math.floor(Date.now() / 1000);

  return tickers.reduce((prices, ticker, index) => {
    const coin = normalizeTicker(ticker);
    const requestedId = getRequestedCoinId(coinIds[index]) || coin.id;
    const payload = {
      usd: coin.current_price,
      usd_market_cap: coin.market_cap,
      usd_24h_vol: coin.total_volume,
      usd_24h_change: coin.price_change_percentage_24h,
      last_updated_at: updatedAt,
    };

    prices[requestedId] = payload;
    prices[coin.id] = payload;
    return prices;
  }, {});
};

export const getCoinSnapshot = async (coinId) => {
  const [marketCoin] = await getMarketCoins({ ids: [coinId], perPage: 1 });

  if (!marketCoin) {
    throw new ApiError(404, "Coin not found.");
  }

  return marketCoin;
};
