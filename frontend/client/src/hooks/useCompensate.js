import { useCallback } from "react";
import { useAccount, usePublicClient, useWriteContract } from "wagmi";
import {CHAT_ABI } from "../config/abi";
import toast from "react-hot-toast";

const useCompensate = () => {
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();
  const { writeContractAsync } = useWriteContract();

  const CHAT_ADDRESS = import.meta.env.CHAT_CONTRACT_ADDRESS;
  // const tokenAddress = import.meta.env.TOKEN_ADDRESS;

  return useCallback(
    async () => {
      if (!address || !isConnected) {
        toast.error("Please connect your wallet");
        return false;
      }

      if (!publicClient) {
        toast.error("Public client not available");
        return false;
      }

      try {
        // Call the compensate function on the contract
        const compensateHash = await writeContractAsync({
          address: CHAT_ADDRESS,
          abi: CHAT_ABI,
          functionName: "compensate",
          args: [address],
        });

        console.log("Compensate hash:", compensateHash);

        // Wait for transaction confirmation
        const compensateReceipt = await publicClient.waitForTransactionReceipt({
          hash: compensateHash,
        });

        if (compensateReceipt.status === "success") {
          toast.success("Compensation successful!");
          return true;
        } else {
          toast.error("Compensation failed");
          return false;
        }
      } catch (error) {
        console.error("Compensation error:", error);

        if (error.message?.includes("Only owner can call this")) {
          toast.error("Only contract owner can execute compensation");
        } else if (error.message?.includes("Recipient has no active chats")) {
          toast.error("Recipient has no active chats");
        } else if (error.message?.includes("Snubber has no active chats")) {
          toast.error("Snubber has no active chats");
        } else if (error.message?.includes("Insufficient stake")) {
          toast.error("Insufficient stake for compensation");
        } else if (error.message?.includes("rejected")) {
          toast.error("Transaction rejected by user");
        } else {
          toast.error("Compensation failed: " + error.message);
        }
        return false;
      }
    },
    [address, isConnected, publicClient, writeContractAsync]
  );
};

export default useCompensate;
