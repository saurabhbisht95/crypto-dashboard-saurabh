import { Router } from "express";
import {
  getCoinById,
  getCoinChart,
  getCoins,
  getMarketSummary,
} from "../controllers/market.controller.js";

const router = Router();

router.get("/coins", getCoins);
router.get("/summary", getMarketSummary);
router.get("/coins/:coinId", getCoinById);
router.get("/coins/:coinId/chart", getCoinChart);

export default router;
