import cron from "node-cron";
import { ChatGame } from "../models/chatGame.model.js";
import { getReceiverSocketId, io } from "./socket.js";

// Run every 30 seconds to check for expired rounds
cron.schedule("*/30 * * * * *", async () => {
  try {
    const now = new Date();
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
  } catch (error) {
    console.error("Error in game expiry scheduler:", error);
  }
});

console.log("Game expiry scheduler started - checking every 30 seconds");
