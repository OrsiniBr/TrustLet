import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import {
  expireAndSetWinner,
  getStatus,
  markDeposited,
  onReplyStopRound,
  startRoundIfNeeded,
} from "../controllers/game.controller.js";

const router = express.Router();

router.get("/status/:peerId", protectRoute, getStatus);
router.post("/deposit/:peerId", protectRoute, markDeposited);
router.post("/start/:peerId", protectRoute, startRoundIfNeeded);
router.post("/reply/:peerId", protectRoute, onReplyStopRound);
router.post("/expire/:peerId", protectRoute, expireAndSetWinner);

export default router;
