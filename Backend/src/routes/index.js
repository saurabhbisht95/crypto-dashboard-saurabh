import { Router } from "express";
import ApiResponse from "../utils/ApiResponse.js";
import alertRoutes from "./alert.routes.js";
import authRoutes from "./auth.routes.js";
import marketRoutes from "./market.routes.js";
import portfolioRoutes from "./portfolio.routes.js";
import watchlistRoutes from "./watchlist.routes.js";

const router = Router();

router.get("/health", (req, res) => {
  res.status(200).json(
    new ApiResponse(200, {
      service: "CryptoTracker API",
      status: "ok",
      timestamp: new Date().toISOString(),
    })
  );
});

router.use("/auth", authRoutes);
router.use("/market", marketRoutes);
router.use("/watchlist", watchlistRoutes);
router.use("/portfolio", portfolioRoutes);
router.use("/alerts", alertRoutes);

export default router;
