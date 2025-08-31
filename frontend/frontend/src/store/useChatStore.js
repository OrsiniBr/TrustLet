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
  deposits: {}, // Track deposits for each chat
  timers: {}, // Track timers for each chat
  winners: {}, // Track winners for each chat

  // Check if user has deposited for a specific chat
  hasDeposited: (chatId) => {
    const { deposits } = get();
    return deposits[chatId] || false;
  },

  // Simulate deposit for a chat
  makeDeposit: (chatId) => {
    const { deposits } = get();
    set({ 
      deposits: { 
        ...deposits, 
        [chatId]: true 
      } 
    });
    toast.success("Deposit successful! You can now send messages.");
  },

  // Start timer for a chat after message is sent
  startTimer: (chatId, senderId, receiverId) => {
    const { timers } = get();
    
    // Clear existing timer if any
    if (timers[chatId]) {
      clearTimeout(timers[chatId].timeoutId);
    }

    const timeoutId = setTimeout(() => {
      // Time's up! Declare sender as winner
      const { winners } = get();
      set({ 
        winners: { 
          ...winners, 
          [chatId]: senderId 
        } 
      });
      
      // Clear timer
      set({ 
        timers: { 
          ...timers, 
          [chatId]: null 
        } 
      });
      
      toast.success(`Time's up! ${senderId === useAuthStore.getState().authUser._id ? 'You won!' : 'Opponent won!'}`);
    }, 5 * 60 * 1000); // 5 minutes

    set({ 
      timers: { 
        ...timers, 
        [chatId]: { 
          timeoutId, 
          startTime: Date.now(),
          senderId,
          receiverId
        } 
      } 
    });
  },

  // Stop timer when receiver replies
  stopTimer: (chatId) => {
    const { timers } = get();
    if (timers[chatId]) {
      clearTimeout(timers[chatId].timeoutId);
      set({ 
        timers: { 
          ...timers, 
          [chatId]: null 
        } 
      });
    }
  },

  // Get remaining time for a chat
  getRemainingTime: (chatId) => {
    const { timers } = get();
    const timer = timers[chatId];
    if (!timer) return 0;
    
    const elapsed = Date.now() - timer.startTime;
    const remaining = (5 * 60 * 1000) - elapsed; // 5 minutes in milliseconds
    return Math.max(0, Math.ceil(remaining / 1000)); // Return seconds
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

  sendMessage: async (messageData) => {
    const { selectedUser, messages, hasDeposited, startTimer } = get();
    const { authUser } = useAuthStore.getState();
    
    // Check if this is the first message in this chat
    const chatId = selectedUser._id;
    if (!hasDeposited(chatId)) {
      toast.error("Please deposit $5 before sending your first message in this chat.");
      return false;
    }

    try {
      const res = await axiosInstance.post(`/messages/send/${selectedUser._id}`, messageData);
      set({ messages: [...messages, res.data] });
      
      // Start timer after message is sent
      startTimer(chatId, authUser._id, selectedUser._id);
      
      return true;
    } catch (error) {
      toast.error(error.response.data.message);
      return false;
    }
  },

  subscribeToMessages: () => {
    const { selectedUser, stopTimer } = get();
    if (!selectedUser) return;

    const socket = useAuthStore.getState().socket;

    socket.on("newMessage", (newMessage) => {
      const isMessageSentFromSelectedUser = newMessage.senderId === selectedUser._id;
      if (!isMessageSentFromSelectedUser) return;

      // Stop timer when receiver replies
      const chatId = selectedUser._id;
      stopTimer(chatId);

      set({
        messages: [...get().messages, newMessage],
      });
    });
  },

  unsubscribeFromMessages: () => {
    const socket = useAuthStore.getState().socket;
    socket.off("newMessage");
  },

  setSelectedUser: (selectedUser) => set({ selectedUser }),
}));
