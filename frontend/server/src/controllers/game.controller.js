import { ChatGame, pairKey } from "../models/chatGame.model.js";
import { getReceiverSocketId, io } from "../lib/socket.js";

const ROUND_MS = 5 * 60 * 1000; // 5 minutes

function toPublic(game) {
  return {
    userA: String(game.userA),
    userB: String(game.userB),
    deposits: Object.fromEntries(game.deposits || []),
    startedBy: game.startedBy ? String(game.startedBy) : null,
    startedAt: game.startedAt ? game.startedAt.toISOString() : null,
    expiresAt: game.expiresAt ? game.expiresAt.toISOString() : null,
    state: game.state,
    winner: game.winner ? String(game.winner) : null,
    now: new Date().toISOString(),
  };
}

async function findOrCreateGame(userId1, userId2) {
  const { a, b } = pairKey(userId1, userId2);
  let game = await ChatGame.findOne({ userA: a, userB: b });
  if (!game) {
    game = await ChatGame.create({ userA: a, userB: b, deposits: {} });
  }
  return game;
}

export const getStatus = async (req, res) => {
  try {
    const myId = req.user._id;
    const { peerId } = req.params;
    const game = await findOrCreateGame(myId, peerId);
    res.json(toPublic(game));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const markDeposited = async (req, res) => {
  try {
    const myId = String(req.user._id);
    const { peerId } = req.params;
    const game = await findOrCreateGame(myId, peerId);

    game.deposits.set(myId, true);
    await game.save();

    // notify both users
    const receiverSocketId = getReceiverSocketId(String(peerId));
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("game:deposit", { chatWith: myId });
    }

    res.json(toPublic(game));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const startRoundIfNeeded = async (req, res) => {
  try {
    const myId = String(req.user._id);
    const { peerId } = req.params;
    const game = await findOrCreateGame(myId, peerId);

    const hasA = !!game.deposits.get(String(game.userA));
    const hasB = !!game.deposits.get(String(game.userB));

    if (hasA && hasB && game.state !== "running") {
      game.state = "running";
      game.startedBy = myId;
      game.startedAt = new Date();
      game.expiresAt = new Date(Date.now() + ROUND_MS);
      await game.save();

      // broadcast timer start with authoritative expiresAt
      const aId = String(game.userA);
      const bId = String(game.userB);
      const payload = {
        expiresAt: game.expiresAt.toISOString(),
        startedAt: game.startedAt.toISOString(),
        startedBy: myId,
      };
      const aSock = getReceiverSocketId(aId);
      const bSock = getReceiverSocketId(bId);
      if (aSock) io.to(aSock).emit("game:timer:start", payload);
      if (bSock) io.to(bSock).emit("game:timer:start", payload);
    }

    res.json(toPublic(game));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const onReplyStopRound = async (req, res) => {
  try {
    const myId = String(req.user._id);
    const { peerId } = req.params;
    const game = await findOrCreateGame(myId, peerId);

    if (
      game.state === "running" &&
      game.expiresAt &&
      new Date() < game.expiresAt
    ) {
      // Receiver replied in time => stop timer, no winner yet
      game.state = "idle";
      game.startedBy = undefined;
      game.startedAt = undefined;
      game.expiresAt = undefined;
      await game.save();

      const aId = String(game.userA);
      const bId = String(game.userB);
      const aSock = getReceiverSocketId(aId);
      const bSock = getReceiverSocketId(bId);
      if (aSock) io.to(aSock).emit("game:timer:stop", {});
      if (bSock) io.to(bSock).emit("game:timer:stop", {});
    }

    res.json(toPublic(game));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const expireAndSetWinner = async (req, res) => {
  try {
    const myId = String(req.user._id);
    const { peerId } = req.params;
    const game = await findOrCreateGame(myId, peerId);

    if (
      game.state === "running" &&
      game.expiresAt &&
      new Date() >= game.expiresAt
    ) {
      // The user who started the round wins
      game.state = "ended";
      game.winner = game.startedBy;
      await game.save();

      const aId = String(game.userA);
      const bId = String(game.userB);
      const aSock = getReceiverSocketId(aId);
      const bSock = getReceiverSocketId(bId);
      const payload = { winner: String(game.winner) };
      if (aSock) io.to(aSock).emit("game:ended", payload);
      if (bSock) io.to(bSock).emit("game:ended", payload);
    }

    res.json(toPublic(game));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const triggerCompensation = async (req, res) => {
  try {
    const myId = String(req.user._id);
    const { peerId } = req.params;
    const game = await findOrCreateGame(myId, peerId);

    if (game.state !== "ended" || !game.winner) {
      return res.status(400).json({ message: "Game not ended or no winner" });
    }

    // Emit compensation event to frontend
    const aId = String(game.userA);
    const bId = String(game.userB);
    const aSock = getReceiverSocketId(aId);
    const bSock = getReceiverSocketId(bId);

    const payload = {
      winner: String(game.winner),
      recipient: String(game.winner),
      snubber: String(game.winner === aId ? bId : aId),
    };

    if (aSock) io.to(aSock).emit("game:compensate", payload);
    if (bSock) io.to(bSock).emit("game:compensate", payload);

    res.json({ message: "Compensation triggered", payload });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
