import { Router } from "express";
import {
  addToWatchlist,
  getWatchlist,
  removeFromWatchlist,
} from "../controllers/watchlist.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(requireAuth);
router.get("/", getWatchlist);
router.post("/:coinId", addToWatchlist);
router.delete("/:coinId", removeFromWatchlist);

export default router;
