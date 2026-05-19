import { Router } from "express";
import { getSystemStatus } from "../controllers/system.controller.js";

const router = Router();

router.get("/status", getSystemStatus);

export default router;
