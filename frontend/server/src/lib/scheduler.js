import cron from "node-cron";
import { ChatGame } from "../models/chatGame.model.js";
import { getReceiverSocketId, io } from "./socket.js";

// Run every 30 seconds to check for expired rounds and refund timers
cron.schedule("*/30 * * * * *", async () => {
  try {
    const now = new Date();

    // Check for expired game rounds (compensation scenario)
    const expiredGames = await ChatGame.find({
      state: "running",
      expiresAt: { $lte: now },
    });

    for (const game of expiredGames) {
      // Set winner and end game
      game.state = "ended";
      game.winner = game.startedBy;
      await game.save();

      // Notify both users
      const aId = String(game.userA);
      const bId = String(game.userB);
      const aSock = getReceiverSocketId(aId);
      const bSock = getReceiverSocketId(bId);

      const payload = { winner: String(game.winner) };
      if (aSock) io.to(aSock).emit("game:ended", payload);
      if (bSock) io.to(bSock).emit("game:ended", payload);

      console.log(`Game expired: ${aId} vs ${bId}, winner: ${game.winner}`);
    }

    // Check for expired refund timers
    const expiredRefundTimers = await ChatGame.find({
      refundTimerExpiresAt: { $lte: now },
      refundTimerExpiresAt: { $exists: true },
    });

    for (const game of expiredRefundTimers) {
      // Clear refund timer and mark as eligible for refund
      game.refundTimerStartedBy = undefined;
      game.refundTimerStartedAt = undefined;
      game.refundTimerExpiresAt = undefined;
      await game.save();

      // Notify both users that refund is now available
      const aId = String(game.userA);
      const bId = String(game.userB);
      const aSock = getReceiverSocketId(aId);
      const bSock = getReceiverSocketId(bId);

      const payload = {
        eligibleForRefund: String(game.refundTimerStartedBy),
        message:
          "Recipient didn't stake back within 5 minutes. Refund is now available.",
      };
      if (aSock) io.to(aSock).emit("refund:available", payload);
      if (bSock) io.to(bSock).emit("refund:available", payload);

      console.log(
        `Refund timer expired: ${aId} vs ${bId}, eligible: ${game.refundTimerStartedBy}`
      );
    }
  } catch (error) {
    console.error("Error in game expiry scheduler:", error);
  }
});

console.log("Game expiry scheduler started - checking every 30 seconds");
