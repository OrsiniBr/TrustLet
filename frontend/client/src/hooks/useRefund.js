import { useCallback } from "react";
import {
  useAccount,
  usePublicClient,
  useWalletClient,
  useWriteContract,
} from "wagmi";
import { CHAT_ABI } from "../config/abi";
import toast from "react-hot-toast";

const useRefund = () => {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const walletClient = useWalletClient();
  const { writeContractAsync } = useWriteContract();

   const CHAT_ADDRESS = import.meta.env.CHAT_CONTRACT_ADDRESS;
  //  const tokenAddress = import.meta.env.TOKEN_ADDRESS;

  return useCallback(
    async () => {
      if (!address || !walletClient) {
        toast.error("Please connect your wallet");
        return { success: false };
      }

      if (!publicClient) {
        toast.error("Public client not available");
        return { success: false };
      }

      if (!walletClient) {
        toast.error("Wallet client not available");
        return { success: false };
      }


      const recipientAddress = address;

      try {
        toast.loading("Processing refund...", { id: "refund" });

        const refundHash = await writeContractAsync({
          address: CHAT_ADDRESS,
          abi: CHAT_ABI,
          functionName: "refund",
          args: [address],
        });

        console.log("Refund hash:", refundHash);

        const refundReceipt = await publicClient.waitForTransactionReceipt({
          hash: refundHash,
        });

        toast.dismiss("refund");

        if (refundReceipt.status === "success") {
          const isCurrentUserRecipient =
            recipientAddress.toLowerCase() === address.toLowerCase();
          const message = isCurrentUserRecipient
            ? "Refund successful! $2 returned to your wallet."
            : `Refund processed. $2 sent to ${recipientAddress.slice(
                0,
                6
              )}...${recipientAddress.slice(-4)}`;

          toast.success(message);
          return {
            success: true,
            txHash: refundHash,
            receipt: refundReceipt,
            recipientAddress,
          };
        } else {
          toast.error("Refund transaction failed");
          return { success: false };
        }
      } catch (error) {
        toast.dismiss("refund");
        console.error("Refund error:", error);

        // Handle specific contract errors
        if (error.message?.includes("No active chats to refund")) {
          toast.error("No active chats to refund");
        } else if (error.message?.includes("Insufficient stake")) {
          toast.error("Insufficient stake for refund");
        } else if (error.message?.includes("Only owner can call this")) {
          toast.error("Only contract owner can process refunds");
        } else if (error.message?.includes("rejected")) {
          toast.error("Transaction rejected by user");
        } else if (error.message?.includes("insufficient funds")) {
          toast.error("Insufficient funds for gas fees");
        } else {
          toast.error(`Refund failed: ${error.message || "Unknown error"}`);
        }

        return { success: false, error: error.message };
      }
    },
    [address, publicClient, walletClient, writeContractAsync]
  );
};

// In your component
// const refund = useRefund();

// const handleRefundUser = async (userData) => {
//   const recipientData = {
//     walletAddress: "0x123...",
//     // or
//     user: {
//       walletAddress: "0x123..."
//     }
//   };

//   const result = await refund(recipientData);
  
//   if (result.success) {
//     console.log("Refund TX:", result.txHash);
//     console.log("Refunded to:", result.recipientAddress);
//     // Update UI, notify backend, etc.
//   }
// };

export default useRefund;
