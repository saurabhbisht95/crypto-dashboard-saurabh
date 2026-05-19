import { Router } from "express";
import {
  createAlert,
  deleteAlert,
  getAlerts,
  toggleAlert,
} from "../controllers/alert.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(requireAuth);
router.get("/", getAlerts);
router.post("/", createAlert);
router.patch("/:alertId/toggle", toggleAlert);
router.delete("/:alertId", deleteAlert);

export default router;
