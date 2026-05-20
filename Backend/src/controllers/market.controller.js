import ApiResponse from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  getAssetPlatforms,
  getCoin,
  getCoinAdvanced,
  getCoinCategories,
  getCoinOhlc,
  getCoinPrices,
  getExchanges,
  getLivePrices,
  getMarketChart,
  getMarketCoins,
  getNftMarkets,
  getRecentlyAddedCoins,
  getTrendingSearch,
} from "../services/coinGecko.service.js";

const FIAT_CURRENCIES = new Set([
  "usd",
  "eur",
  "gbp",
  "inr",
  "jpy",
  "cad",
  "aud",
  "sgd",
  "aed",
  "brl",
]);

const parseList = (value) =>
  value
    ? value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean)
    : [];

const toNumberOrUndefined = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : undefined;
};

const unwrapSettled = (result, fallback) =>
  result.status === "fulfilled" ? result.value : fallback;

const getPercent = (value) => (Number.isFinite(Number(value)) ? Number(value) : 0);

const normalizeTrendingCoin = (coin) => ({
  id: coin.id,
  name: coin.name,
  symbol: coin.symbol,
  marketCapRank: coin.market_cap_rank,
  image: coin.large || coin.small || coin.thumb,
  price: coin.data?.price || 0,
  change24h: getPercent(coin.data?.price_change_percentage_24h?.usd),
  marketCap: coin.data?.market_cap || "",
  totalVolume: coin.data?.total_volume || "",
});

const normalizeNft = (nft, index) => ({
  id: nft.id,
  name: nft.name,
  symbol: nft.symbol || "",
  image: nft.image?.small_2x || nft.image?.small || nft.image?.thumb || "",
  contractAddress: nft.contract_address || "",
  platform: nft.asset_platform_id || nft.native_currency || "ethereum",
  rank: nft.market_cap_rank || index + 1,
  floorPriceUsd: nft.floor_price?.usd || 0,
  floorPriceNative: nft.floor_price?.native_currency || 0,
  marketCapUsd: nft.market_cap?.usd || 0,
  volume24hUsd: nft.volume_24h?.usd || 0,
  change24h:
    nft.floor_price_in_usd_24h_percentage_change ||
    nft.floor_price_24h_percentage_change?.usd ||
    0,
  description: nft.description || "",
});

export const getCoins = asyncHandler(async (req, res) => {
  const page = Number(req.query.page) || 1;
  const perPage = Math.min(Number(req.query.perPage) || 100, 250);
  const ids = parseList(req.query.ids);

  const coins = await getMarketCoins({
    page,
    perPage,
    ids,
    category: req.query.category,
    order: req.query.order,
    priceChangePercentage: req.query.priceChangePercentage,
  });

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

export const getCoinAdvancedDetails = asyncHandler(async (req, res) => {
  const coin = await getCoinAdvanced(req.params.coinId);
  const [ohlcResult, categoriesResult] = await Promise.allSettled([
    getCoinOhlc(req.params.coinId, Number(req.query.days) || 30),
    getCoinCategories(),
  ]);
  const ohlc = unwrapSettled(ohlcResult, []);
  const categories = unwrapSettled(categoriesResult, []);
  const primaryCategoryName = coin.categories?.[0];
  const primaryCategory = categories.find(
    (category) =>
      category.name?.toLowerCase() === primaryCategoryName?.toLowerCase()
  );

  let relatedCoins = [];

  if (primaryCategory?.id) {
    try {
      relatedCoins = await getMarketCoins({
        perPage: 12,
        category: primaryCategory.id,
        priceChangePercentage: "24h",
      });
    } catch {
      relatedCoins = [];
    }
  }

  if (!relatedCoins.length) {
    relatedCoins = await getMarketCoins({ perPage: 12 });
  }

  return res.status(200).json(
    new ApiResponse(200, {
      overview: {
        id: coin.id,
        name: coin.name,
        symbol: coin.symbol,
        hashingAlgorithm: coin.hashing_algorithm,
        categories: coin.categories || [],
        genesisDate: coin.genesis_date,
        links: coin.links || {},
        community: coin.community_data || {},
        developer: coin.developer_data || {},
        market: coin.market_data || {},
      },
      ohlc: ohlc.map((candle) => ({
        timestamp: candle[0],
        open: candle[1],
        high: candle[2],
        low: candle[3],
        close: candle[4],
      })),
      tickers: (coin.tickers || []).slice(0, 12).map((ticker) => ({
        base: ticker.base,
        target: ticker.target,
        market: ticker.market?.name || "",
        last: ticker.last,
        volume: ticker.volume,
        trustScore: ticker.trust_score,
        tradeUrl: ticker.trade_url,
      })),
      relatedCoins: relatedCoins
        .filter((relatedCoin) => relatedCoin.id !== coin.id)
        .slice(0, 8),
    })
  );
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

export const getMarketDiscovery = asyncHandler(async (req, res) => {
  const [trendingResult, newCoinsResult, categoriesResult, chainsResult] =
    await Promise.allSettled([
      getTrendingSearch(),
      getRecentlyAddedCoins(),
      getCoinCategories(),
      getAssetPlatforms(),
    ]);

  const trending = unwrapSettled(trendingResult, {});
  const newCoins = unwrapSettled(newCoinsResult, []);
  const categories = unwrapSettled(categoriesResult, []);
  const chains = unwrapSettled(chainsResult, []);

  return res.status(200).json(
    new ApiResponse(200, {
      trendingCoins: (trending.coins || [])
        .slice(0, 15)
        .map((coin) => normalizeTrendingCoin(coin.item)),
      trendingNfts: (trending.nfts || []).slice(0, 8),
      trendingCategories: (trending.categories || []).slice(0, 8),
      newCoins: newCoins.slice(0, 16).map((coin) => ({
        id: coin.id,
        name: coin.name,
        symbol: coin.symbol,
        image: coin.large || coin.small || coin.thumb || "",
        activatedAt: coin.activated_at || coin.created_at || "",
      })),
      categories: categories.slice(0, 16).map((category) => ({
        id: category.id,
        name: category.name,
        marketCap: category.market_cap || 0,
        volume24h: category.volume_24h || 0,
        change24h: category.market_cap_change_24h || 0,
        topCoins: category.top_3_coins || [],
      })),
      chains: chains.slice(0, 24).map((chain) => ({
        id: chain.id,
        name: chain.name,
        shortName: chain.shortname || "",
      })),
      generatedAt: new Date().toISOString(),
    })
  );
});

export const getMarketScreener = asyncHandler(async (req, res) => {
  const page = Number(req.query.page) || 1;
  const perPage = Math.min(Number(req.query.perPage) || 100, 250);
  const minMarketCap = toNumberOrUndefined(req.query.minMarketCap);
  const maxMarketCap = toNumberOrUndefined(req.query.maxMarketCap);
  const minVolume = toNumberOrUndefined(req.query.minVolume);
  const minChange24h = toNumberOrUndefined(req.query.minChange24h);
  const maxChange24h = toNumberOrUndefined(req.query.maxChange24h);

  const coins = await getMarketCoins({
    page,
    perPage,
    category: req.query.category,
    order: req.query.order || "market_cap_desc",
    priceChangePercentage: "1h,24h,7d,30d",
    sparkline: true,
  });

  const filteredCoins = coins
    .filter((coin) =>
      minMarketCap === undefined ? true : (coin.market_cap || 0) >= minMarketCap
    )
    .filter((coin) =>
      maxMarketCap === undefined ? true : (coin.market_cap || 0) <= maxMarketCap
    )
    .filter((coin) =>
      minVolume === undefined ? true : (coin.total_volume || 0) >= minVolume
    )
    .filter((coin) =>
      minChange24h === undefined
        ? true
        : (coin.price_change_percentage_24h_in_currency ||
            coin.price_change_percentage_24h ||
            0) >= minChange24h
    )
    .filter((coin) =>
      maxChange24h === undefined
        ? true
        : (coin.price_change_percentage_24h_in_currency ||
            coin.price_change_percentage_24h ||
            0) <= maxChange24h
    )
    .map((coin) => ({
      ...coin,
      market_cap_to_fdv:
        coin.fully_diluted_valuation > 0
          ? coin.market_cap / coin.fully_diluted_valuation
          : null,
    }));

  return res.status(200).json(
    new ApiResponse(200, {
      coins: filteredCoins,
      filters: {
        category: req.query.category || "",
        order: req.query.order || "market_cap_desc",
        minMarketCap,
        maxMarketCap,
        minVolume,
        minChange24h,
        maxChange24h,
      },
    })
  );
});

export const getMarketCategories = asyncHandler(async (req, res) => {
  const categories = await getCoinCategories();
  return res.status(200).json(new ApiResponse(200, { categories }));
});

export const getMarketChains = asyncHandler(async (req, res) => {
  const chains = await getAssetPlatforms(req.query.filter);
  return res.status(200).json(new ApiResponse(200, { chains }));
});

export const getExchangeRankings = asyncHandler(async (req, res) => {
  const page = Number(req.query.page) || 1;
  const perPage = Math.min(Number(req.query.perPage) || 50, 250);
  const exchanges = await getExchanges({ page, perPage });

  return res.status(200).json(
    new ApiResponse(200, {
      exchanges: exchanges.map((exchange, index) => ({
        id: exchange.id,
        name: exchange.name,
        image: exchange.image,
        country: exchange.country || "Global",
        yearEstablished: exchange.year_established,
        trustScore: exchange.trust_score || 0,
        trustScoreRank: exchange.trust_score_rank || index + 1,
        tradeVolume24hBtc: exchange.trade_volume_24h_btc || 0,
        url: exchange.url,
        hasTradingIncentive: Boolean(exchange.has_trading_incentive),
      })),
    })
  );
});

export const getNftCollections = asyncHandler(async (req, res) => {
  const page = Number(req.query.page) || 1;
  const perPage = Math.min(Number(req.query.perPage) || 40, 100);
  const nfts = await getNftMarkets({
    page,
    perPage,
    assetPlatformId: req.query.assetPlatformId || "ethereum",
    order: req.query.order || "market_cap_usd_desc",
  });

  return res.status(200).json(
    new ApiResponse(200, {
      collections: nfts.map(normalizeNft),
      fallbackMode: nfts.length <= 8,
    })
  );
});

export const convertCrypto = asyncHandler(async (req, res) => {
  const amount = Number(req.query.amount) || 1;
  const from = (req.query.from || "bitcoin").toLowerCase();
  const to = (req.query.to || "usd").toLowerCase();
  const toIsFiat = FIAT_CURRENCIES.has(to);

  if (toIsFiat) {
    const prices = await getCoinPrices([from], [to]);
    const rate = prices?.[from]?.[to] || 0;

    return res.status(200).json(
      new ApiResponse(200, {
        amount,
        from,
        to,
        rate,
        value: amount * rate,
        prices,
        updatedAt: new Date().toISOString(),
      })
    );
  }

  const prices = await getCoinPrices([from, to], ["usd"]);
  const fromUsd = prices?.[from]?.usd || 0;
  const toUsd = prices?.[to]?.usd || 0;
  const rate = toUsd > 0 ? fromUsd / toUsd : 0;

  return res.status(200).json(
    new ApiResponse(200, {
      amount,
      from,
      to,
      rate,
      value: amount * rate,
      prices,
      updatedAt: new Date().toISOString(),
    })
  );
});

export const getLiveMarketPrices = asyncHandler(async (req, res) => {
  const ids = parseList(req.query.ids);
  const defaultIds = ["bitcoin", "ethereum", "solana", "ripple", "dogecoin"];
  const prices = await getLivePrices((ids.length ? ids : defaultIds).slice(0, 25));

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
