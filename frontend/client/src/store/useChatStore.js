import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "./useAuthStore";

export const useChatStore = create((set, get) => ({
  messages: [],
  users: [],
  selectedUser: null,
  isUsersLoading: false,
  isMessagesLoading: false,
  deposits: {}, // { [peerId]: boolean } whether current user deposited for chat with peer
  timers: {}, // { [peerId]: { startedAt, expiresAt, startedBy } } server-authoritative
  winners: {}, // Track winners for each chat

  // Check if user has deposited for a specific chat
  hasDeposited: (chatId) => {
    const { deposits } = get();
    return deposits[chatId] || false;
  },

  // Server-authoritative deposit after on-chain stake
  makeDeposit: async (chatId) => {
    try {
      await axiosInstance.post(`/game/deposit/${chatId}`);
      const { deposits } = get();
      set({ deposits: { ...deposits, [chatId]: true } });
      toast.success("Deposit confirmed.");
    } catch (e) {
      toast.error(e?.response?.data?.message || "Failed to record deposit");
    }
  },

  // Server-driven timer is handled via sockets; helpers below compute remaining time

  // No-op placeholder retained for API compatibility
  stopTimer: () => {},

  // Get remaining time for a chat
  getRemainingTime: (chatId) => {
    const { timers } = get();
    const timer = timers[chatId];
    if (!timer || !timer.expiresAt) return 0;
    const remaining = new Date(timer.expiresAt).getTime() - Date.now();
    return Math.max(0, Math.ceil(remaining / 1000));
  },

  // Check if user is winner for a chat
  isWinner: (chatId, userId) => {
    const { winners } = get();
    return winners[chatId] === userId;
  },

  // Get winner for a chat
  getWinner: (chatId) => {
    const { winners } = get();
    return winners[chatId];
  },

  getUsers: async () => {
    set({ isUsersLoading: true });
    try {
      const res = await axiosInstance.get("/messages/users");
      set({ users: res.data });
    } catch (error) {
      toast.error(error.response.data.message);
    } finally {
      set({ isUsersLoading: false });
    }
  },

  getMessages: async (userId) => {
    set({ isMessagesLoading: true });
    try {
      const res = await axiosInstance.get(`/messages/${userId}`);
      set({ messages: res.data });
    } catch (error) {
      toast.error(error.response.data.message);
    } finally {
      set({ isMessagesLoading: false });
    }
  },

  // Fetch server-authoritative game status for the selected peer
  fetchGameStatus: async (peerId) => {
    try {
      const res = await axiosInstance.get(`/game/status/${peerId}`);
      const { authUser } = useAuthStore.getState();
      const myId = authUser?._id;
      const deposited = !!res.data?.deposits?.[myId];
      const timers = { ...get().timers };
      if (res.data?.expiresAt) {
        timers[peerId] = {
          startedAt: res.data.startedAt,
          expiresAt: res.data.expiresAt,
          startedBy: res.data.startedBy,
        };
      } else {
        timers[peerId] = null;
      }
      const winners = { ...get().winners };
      if (res.data?.winner) winners[peerId] = res.data.winner;
      set({
        deposits: { ...get().deposits, [peerId]: deposited },
        timers,
        winners,
      });
    } catch (e) {
      // ignore silently for now
    }
  },

  sendMessage: async (messageData) => {
    const { selectedUser, messages, hasDeposited } = get();
    const { authUser } = useAuthStore.getState();

    // Check if this is the first message in this chat
    const chatId = selectedUser._id;
    if (!hasDeposited(chatId)) {
      toast.error(
        "Please deposit $5 before sending your first message in this chat."
      );
      return false;
    }

    try {
      const res = await axiosInstance.post(
        `/messages/send/${selectedUser._id}`,
        messageData
      );
      set({ messages: [...messages, res.data] });
      // Timer is started by server when both deposited; status will come via socket
      return true;
    } catch (error) {
      toast.error(error.response.data.message);
      return false;
    }
  },

  subscribeToMessages: () => {
    const { selectedUser } = get();
    if (!selectedUser) return;

    const socket = useAuthStore.getState().socket;

    socket.on("newMessage", (newMessage) => {
      const isMessageSentFromSelectedUser =
        newMessage.senderId === selectedUser._id;
      if (!isMessageSentFromSelectedUser) return;

      set({
        messages: [...get().messages, newMessage],
      });
    });

    // Game events
    socket.on("game:timer:start", (payload) => {
      const chatId = selectedUser._id;
      const timers = { ...get().timers };
      timers[chatId] = {
        startedAt: payload.startedAt,
        expiresAt: payload.expiresAt,
        startedBy: payload.startedBy,
      };
      set({ timers });
    });

    socket.on("game:timer:stop", () => {
      const chatId = selectedUser._id;
      const timers = { ...get().timers };
      timers[chatId] = null;
      set({ timers });
    });

    socket.on("game:ended", ({ winner }) => {
      const chatId = selectedUser._id;
      const winners = { ...get().winners };
      winners[chatId] = winner;
      const timers = { ...get().timers };
      timers[chatId] = null;
      set({ winners, timers });
      const me = useAuthStore.getState().authUser?._id;
      toast.success(
        winner === me ? "Time's up! You won!" : "Time's up! Opponent won!"
      );
    });
  },

  unsubscribeFromMessages: () => {
    const socket = useAuthStore.getState().socket;
    socket.off("newMessage");
    socket.off("game:timer:start");
    socket.off("game:timer:stop");
    socket.off("game:ended");
  },

  setSelectedUser: async (selectedUser) => {
    set({ selectedUser });
    if (selectedUser?._id) {
      await get().fetchGameStatus(selectedUser._id);
    }
  },
}));
