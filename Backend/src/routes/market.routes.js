import { Router } from "express";
import {
  convertCrypto,
  getCoinAdvancedDetails,
  getCoinById,
  getCoinChart,
  getCoinOhlcChart,
  getCoins,
  getExchangeRankings,
  getLiveMarketPrices,
  getMarketCategories,
  getMarketChains,
  getMarketDiscovery,
  getMarketHeatmap,
  getMarketIntelligence,
  getMarketSummary,
  getMarketScreener,
  getNftCollections,
} from "../controllers/market.controller.js";

const router = Router();

router.get("/coins", getCoins);
router.get("/summary", getMarketSummary);
router.get("/discovery", getMarketDiscovery);
router.get("/screener", getMarketScreener);
router.get("/categories", getMarketCategories);
router.get("/chains", getMarketChains);
router.get("/exchanges", getExchangeRankings);
router.get("/nfts", getNftCollections);
router.get("/convert", convertCrypto);
router.get("/live-prices", getLiveMarketPrices);
router.get("/heatmap", getMarketHeatmap);
router.get("/intelligence", getMarketIntelligence);
router.get("/coins/:coinId/advanced", getCoinAdvancedDetails);
router.get("/coins/:coinId/chart", getCoinChart);
router.get("/coins/:coinId/ohlc", getCoinOhlcChart);
router.get("/coins/:coinId", getCoinById);

export default router;
