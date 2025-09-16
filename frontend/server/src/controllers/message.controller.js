import User from "../models/user.model.js";
import Message from "../models/message.model.js";

import cloudinary from "../lib/cloudinary.js";
import { getReceiverSocketId, io } from "../lib/socket.js";
import { ChatGame, pairKey } from "../models/chatGame.model.js";

export const getUsersForSidebar = async (req, res) => {
  try {
    const loggedInUserId = req.user._id;
    const filteredUsers = await User.find({
      _id: { $ne: loggedInUserId },
    }).select("-password");

    res.status(200).json(filteredUsers);
  } catch (error) {
    console.error("Error in getUsersForSidebar: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getMessages = async (req, res) => {
  try {
    const { id: userToChatId } = req.params;
    const myId = req.user._id;

    const messages = await Message.find({
      $or: [
        { senderId: myId, receiverId: userToChatId },
        { senderId: userToChatId, receiverId: myId },
      ],
    });

    res.status(200).json(messages);
  } catch (error) {
    console.log("Error in getMessages controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const sendMessage = async (req, res) => {
  try {
    const { text, image } = req.body;
    const { id: receiverId } = req.params;
    const senderId = req.user._id;

    // Enforce server-side deposit before sending a message
    const { a, b } = pairKey(senderId, receiverId);
    const game = await ChatGame.findOne({ userA: a, userB: b });
    if (!game || !game.deposits.get(String(senderId))) {
      return res
        .status(403)
        .json({ message: "Deposit required before sending messages." });
    }

    let imageUrl;
    if (image) {
      // Upload base64 image to cloudinary
      const uploadResponse = await cloudinary.uploader.upload(image);
      imageUrl = uploadResponse.secure_url;
    }

    const newMessage = new Message({
      senderId,
      receiverId,
      text,
      image: imageUrl,
    });

    await newMessage.save();

    // Manage shared timer state
    const hasA = !!game.deposits.get(String(a));
    const hasB = !!game.deposits.get(String(b));
    const bothDeposited = hasA && hasB;
    const now = new Date();

    if (bothDeposited) {
      if (game.state !== "running") {
        // Start round
        game.state = "running";
        game.startedBy = String(senderId);
        game.startedAt = now;
        game.expiresAt = new Date(now.getTime() + 5 * 60 * 1000);
        await game.save();

        const payload = {
          startedAt: game.startedAt.toISOString(),
          expiresAt: game.expiresAt.toISOString(),
          startedBy: String(senderId),
        };
        const aSock = getReceiverSocketId(String(a));
        const bSock = getReceiverSocketId(String(b));
        if (aSock) io.to(aSock).emit("game:timer:start", payload);
        if (bSock) io.to(bSock).emit("game:timer:start", payload);
      } else {
        // If the opponent replies before expiry, stop round
        const isReplyFromOpponent = String(senderId) !== String(game.startedBy);
        if (isReplyFromOpponent && game.expiresAt && now < game.expiresAt) {
          game.state = "idle";
          game.startedBy = undefined;
          game.startedAt = undefined;
          game.expiresAt = undefined;
          await game.save();

          const aSock = getReceiverSocketId(String(a));
          const bSock = getReceiverSocketId(String(b));
          if (aSock) io.to(aSock).emit("game:timer:stop", {});
          if (bSock) io.to(bSock).emit("game:timer:stop", {});
        }
      }
    }

    const receiverSocketId = getReceiverSocketId(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", newMessage);
    }

    res.status(201).json(newMessage);
  } catch (error) {
    console.log("Error in sendMessage controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};
