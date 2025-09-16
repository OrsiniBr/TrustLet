import { useState } from "react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import useCompensate from "../hooks/useCompensate";
import { axiosInstance } from "../lib/axios";
import { DollarSign, Trophy, Clock } from "lucide-react";
import toast from "react-hot-toast";

const CompensationPrompt = ({ selectedUser }) => {
  const { getWinner, winners } = useChatStore();
  const { authUser } = useAuthStore();
  const compensate = useCompensate();
  const [isProcessing, setIsProcessing] = useState(false);

  const chatId = selectedUser._id;
  const winner = getWinner(chatId);
  const isWinner = winner === authUser._id;

  const handleCompensation = async () => {
    if (isProcessing) return;
    setIsProcessing(true);

    try {
      // First trigger the compensation event on the server
      await axiosInstance.post(`/game/compensate/${chatId}`);

      // Then execute the on-chain compensation
      const recipientAddress = authUser.walletAddress; // Assuming user has wallet address
      const snubberAddress = selectedUser.walletAddress; // Assuming peer has wallet address

      if (!recipientAddress || !snubberAddress) {
        toast.error("Wallet addresses not available");
        return;
      }

      const success = await compensate(recipientAddress, snubberAddress);
      if (success) {
        toast.success("Compensation processed successfully!");
      }
    } catch (error) {
      console.error("Compensation error:", error);
      toast.error("Failed to process compensation");
    } finally {
      setIsProcessing(false);
    }
  };

  if (!winner) return null;

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
      <div className="bg-base-200 rounded-lg p-8 max-w-md">
        <div className="mb-6">
          <div className="w-16 h-16 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Trophy className="w-8 h-8 text-yellow-500" />
          </div>
          <h3 className="text-xl font-semibold mb-2">
            {isWinner ? "Congratulations! You Won!" : "Game Ended"}
          </h3>
          <p className="text-base-content/70">
            {isWinner
              ? `You won the chat with ${selectedUser.fullName}!`
              : `${selectedUser.fullName} won the chat.`}
          </p>
        </div>

        <div className="bg-base-300 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-center gap-2 mb-2">
            <DollarSign className="w-5 h-5 text-green-500" />
            <span className="font-semibold">Compensation Available</span>
          </div>
          <p className="text-sm text-base-content/70">
            {isWinner
              ? "You can claim your compensation from the snubber's stake."
              : "The winner can claim compensation from your stake."}
          </p>
        </div>

        {isWinner && (
          <button
            onClick={handleCompensation}
            disabled={isProcessing}
            className="btn btn-primary w-full"
          >
            <DollarSign className="w-4 h-4 mr-2" />
            {isProcessing ? "Processing..." : "Claim Compensation"}
          </button>
        )}

        {!isWinner && (
          <div className="text-sm text-base-content/50">
            Waiting for winner to claim compensation...
          </div>
        )}
      </div>
    </div>
  );
};

export default CompensationPrompt;
