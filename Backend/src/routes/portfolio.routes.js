import { Router } from "express";
import {
  deleteHolding,
  getPortfolio,
  upsertHolding,
} from "../controllers/portfolio.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(requireAuth);
router.get("/", getPortfolio);
router.post("/holdings", upsertHolding);
router.delete("/holdings/:holdingId", deleteHolding);

export default router;
