import mongoose from "mongoose";

// Chat game between two users (pair keyed in sorted order)
const chatGameSchema = new mongoose.Schema(
  {
    userA: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    userB: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    deposits: {
      type: Map,
      of: Boolean,
      default: {},
    },
    startedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    startedAt: { type: Date },
    expiresAt: { type: Date },
    state: {
      type: String,
      enum: ["idle", "running", "ended"],
      default: "idle",
    },
    winner: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    // Refund timer fields - when someone stakes and chats but recipient doesn't stake back
    refundTimerStartedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    refundTimerStartedAt: { type: Date },
    refundTimerExpiresAt: { type: Date },
  },
  { timestamps: true }
);

chatGameSchema.index({ userA: 1, userB: 1 }, { unique: true });

export function pairKey(userId1, userId2) {
  const [a, b] = [String(userId1), String(userId2)].sort();
  return { a, b };
}

export const ChatGame = mongoose.model("ChatGame", chatGameSchema);
