import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import { DollarSign, Lock, Trophy, RefreshCw } from "lucide-react";
import useStake from "../hooks/useStake";
import useCompensate from "../hooks/useCompensate";
import useRefund from "../hooks/useRefund";
import { useApprove } from "../hooks/useApprove";
import { useState } from "react";
import { toast } from "sonner";

const DepositPrompt = ({ selectedUser }) => {
  const {
    makeDeposit,
    hasDeposited,
    getWinner,
    isWinner,
    getRemainingTime,
    getRefundRemainingTime,
    messages,
  } = useChatStore();
  const { authUser } = useAuthStore();
  const stake = useStake();
  const approve = useApprove();
  const refund = useRefund();
  const compensate = useCompensate();
  const [amountApproved, setAmountApproved] = useState("");
  const [isStaking, setIsStaking] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [isCompensating, setIsCompensating] = useState(false);
  const [isRefunding, setIsRefunding] = useState(false);
  const chatId = selectedUser._id;

  const handleStake = async () => {
    if (hasDeposited(chatId)) {
      return;
    }
    if (isStaking) return;
    setIsStaking(true);

    try {
      await stake(chatId); // Pass chatId to stake function
      // makeDeposit is now called automatically in useStake after on-chain confirmation
    } catch (error) {
      console.error("Staking failed:", error);
    } finally {
      setIsStaking(false);
    }
  };

  const handleApprove = async () => {
    const amount = parseFloat(amountApproved);

    if (!amountApproved || amount <= 0 || isNaN(amount)) {
      alert("Please enter a valid amount greater than 0");
      return;
    }

    if (isApproving) return;
    setIsApproving(true);

    try {
      await approve(amount);
      toast.success("Approval successful!", {
        description: `${amount} tokens approved for spending`,
      });
      setAmountApproved(""); // Clear input after successful approval
    } catch (error) {
      console.error("Approval failed:", error);
      alert("Approval failed. Please try again.");
    } finally {
      setIsApproving(false);
    }
  };

  const handleCompensate = async () => {
    if (isCompensating) return;
    setIsCompensating(true);

    try {
      const success = await compensate();
      if (success) {
        toast.success("Compensation processed successfully!");
      }
    } catch (error) {
      console.error("Compensation failed:", error);
    } finally {
      setIsCompensating(false);
    }
  };

  const handleRefund = async () => {
    if (isRefunding) return;
    setIsRefunding(true);

    try {
      const result = await refund();
      if (result.success) {
        toast.success("Refund processed successfully!");
      }
    } catch (error) {
      console.error("Refund failed:", error);
    } finally {
      setIsRefunding(false);
    }
  };

  // Check if user can be compensated (they won the game - timer expired)
  const canBeCompensated = () => {
    const winner = getWinner(chatId);
    return winner && isWinner(chatId, authUser._id);
  };

  // Check if user can be refunded (they staked and chatted but recipient never staked back)
  const canBeRefunded = () => {
    const hasDepositedForChat = hasDeposited(chatId);

    // User can be refunded if:
    // 1. They deposited (staked 3 tokens)
    // 2. There are messages in this chat (they chatted)
    // 3. The game never started (recipient never staked back)
    // 4. No winner has been set (game never progressed to timer phase)
    // 5. Refund timer has expired (5 minutes passed without recipient staking)
    const hasMessages = messages && messages.length > 0;
    const winner = getWinner(chatId);
    const remainingTime = getRemainingTime(chatId);

    // Check if refund timer has expired (5 minutes passed)
    const refundRemainingTime = getRefundRemainingTime(chatId);
    const refundTimerExpired = refundRemainingTime === 0;

    return (
      hasDepositedForChat &&
      hasMessages &&
      !winner &&
      remainingTime === 0 &&
      refundTimerExpired
    );
  };

  // Show compensation/refund section if game has ended
  if (canBeCompensated() || canBeRefunded()) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
        <div className="bg-base-200 rounded-lg p-8 max-w-md">
          <div className="mb-6">
            <div className="w-16 h-16 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trophy className="w-8 h-8 text-yellow-500" />
            </div>
            <h3 className="text-xl font-semibold mb-2">
              {canBeCompensated() ? "You Won!" : "Refund Available"}
            </h3>
            <p className="text-base-content/70">
              {canBeCompensated()
                ? `${selectedUser.fullName} didn't respond in time. You can claim compensation!`
                : `${selectedUser.fullName} never staked back. You can claim a refund!`}
            </p>
          </div>

          <div className="bg-base-300 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-center gap-2 mb-2">
              <DollarSign className="w-5 h-5 text-green-500" />
              <span className="font-semibold">
                {canBeCompensated() ? "$5.00" : "$3.00"}
              </span>
            </div>
            <p className="text-sm text-base-content/70">
              {canBeCompensated()
                ? "Compensation for being snubbed (5 tokens)"
                : "Refund of your stake (3 tokens)"}
            </p>
          </div>

          {/* Compensation/Refund Button */}
          <button
            onClick={canBeCompensated() ? handleCompensate : handleRefund}
            disabled={isCompensating || isRefunding}
            className={`btn w-full ${
              isCompensating || isRefunding ? "btn-disabled" : "btn-primary"
            }`}
          >
            {isCompensating || isRefunding ? (
              <>
                <span className="loading loading-spinner loading-sm"></span>
                Processing...
              </>
            ) : (
              <>
                {canBeCompensated() ? (
                  <>
                    <Trophy className="w-4 h-4 mr-2" />
                    Claim Compensation
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Claim Refund
                  </>
                )}
              </>
            )}
          </button>

          <p className="text-xs text-base-content/50 mt-4">
            * Compensation/refund processed on-chain
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
      <div className="bg-base-200 rounded-lg p-8 max-w-md">
        <div className="mb-6">
          <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-primary" />
          </div>
          <h3 className="text-xl font-semibold mb-2">Stake Required</h3>
          <p className="text-base-content/70">
            To start chatting with {selectedUser.fullName}, you need to stake 3
            tokens first.
          </p>
        </div>

        <div className="bg-base-300 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-center gap-2 mb-2">
            <DollarSign className="w-5 h-5 text-green-500" />
            <span className="font-semibold">3 Tokens</span>
          </div>
          <p className="text-sm text-base-content/70">
            This stake ensures commitment to meaningful conversations
          </p>
        </div>

        {/* Approval Section */}
        <div className="mb-4">
          <input
            type="number"
            placeholder="Enter amount to approve"
            className="input input-bordered w-full mb-3"
            value={amountApproved}
            onChange={(e) => setAmountApproved(e.target.value)}
            min="0"
            step="0.01"
          />
          <button
            onClick={handleApprove}
            disabled={isApproving || !amountApproved}
            className={`btn w-full mb-4 ${
              isApproving ? "btn-disabled" : "btn-secondary"
            }`}
          >
            {isApproving ? (
              <>
                <span className="loading loading-spinner loading-sm"></span>
                Approving...
              </>
            ) : (
              "Approve Token Spending"
            )}
          </button>
        </div>

        {/* Stake Section */}
        <button
          onClick={handleStake}
          disabled={isStaking}
          className={`btn w-full ${isStaking ? "btn-disabled" : "btn-primary"}`}
        >
          {isStaking ? (
            <>
              <span className="loading loading-spinner loading-sm"></span>
              Processing...
            </>
          ) : (
            <>
              <DollarSign className="w-4 h-4 mr-2" />
              Stake 3 Tokens
            </>
          )}
        </button>

        <p className="text-xs text-base-content/50 mt-4">
          * Staking system ensures commitment to meaningful conversations
        </p>
      </div>
    </div>
  );
};

export default DepositPrompt;
