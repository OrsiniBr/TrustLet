import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import { DollarSign, Lock } from "lucide-react";
import useStake from "../hooks/useStake";
import { useApprove } from "../hooks/useApprove";
import { useState } from "react";
import { toast } from "sonner";


const DepositPrompt = ({ selectedUser }) => {
  const { makeDeposit, hasDeposited } = useChatStore();
  const { authUser } = useAuthStore();
  const stake = useStake();
  const approve = useApprove();
  const [amountApproved, setAmountApproved] = useState("");
  const [isStaking, setIsStaking] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
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
        description: `${amount} tokens approved for spending`
      });
      setAmountApproved(""); // Clear input after successful approval
    } catch (error) {
      console.error("Approval failed:", error);
      alert("Approval failed. Please try again.");
    } finally {
      setIsApproving(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
      <div className="bg-base-200 rounded-lg p-8 max-w-md">
        <div className="mb-6">
          <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-primary" />
          </div>
          <h3 className="text-xl font-semibold mb-2">Deposit Required</h3>
          <p className="text-base-content/70">
            To start chatting with {selectedUser.fullName}, you need to deposit
            $5 first.
          </p>
        </div>

        <div className="bg-base-300 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-center gap-2 mb-2">
            <DollarSign className="w-5 h-5 text-green-500" />
            <span className="font-semibold">$5.00</span>
          </div>
          <p className="text-sm text-base-content/70">
            This deposit ensures commitment to meaningful conversations
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

        {/* Deposit Section */}
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
              Deposit $5
            </>
          )}
        </button>

        <p className="text-xs text-base-content/50 mt-4">
          * This is a simulated deposit system for demonstration purposes
        </p>
      </div>
    </div>
  );
};

export default DepositPrompt;