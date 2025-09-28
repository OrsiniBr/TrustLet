import { tokenAbi } from "../config/abi";
import React, { useCallback } from "react";
import { toast } from "sonner";
import {
  useAccount,
  usePublicClient,
  useWalletClient,
  useWriteContract,
} from "wagmi";

export const useApprove = () => {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const walletClient = useWalletClient();
  const { writeContractAsync } = useWriteContract();

  return useCallback(
    async (amount) => {
      if (!address || !walletClient) {
        toast.error("Not Connected", {
          description: "Ode!, connect wallet",
        });
        return false;
      }

        const CHAT_ADDRESS = import.meta.env.VITE_CHAT_CONTRACT_ADDRESS;
        const TOKEN_ADDRESS = import.meta.env.VITE_TOKEN_ADDRESS;

      if (!CHAT_ADDRESS || !TOKEN_ADDRESS) {
        toast.error("Contract addresses not set");
        return false;
      }

      if (!publicClient) {
        toast.error("Public client not available");
        return false;
      }

      try {
        const amountInWei = BigInt(amount * 10 ** 18);

        // Approve tokens
        const approveHash = await writeContractAsync({
          address: TOKEN_ADDRESS,
          abi: tokenAbi,
          functionName: "approve",
          args: [CHAT_ADDRESS, amountInWei],
        });

        console.log("Approve txHash: ", approveHash);

        // Wait for approval
        const approveReceipt = await publicClient.waitForTransactionReceipt({
          hash: approveHash,
        });

        if (approveReceipt.status === "success") {
          toast.success("Approval successful", {
            description: "Tokens approved for staking",
          });
          return true;
        } else {
          toast.error("Approval failed", {
            description: "Token approval transaction failed",
          });
          return false;
        }
      } catch (error) {
        console.error("Approval error:", error);
        toast.error("Approval failed", {
          description: "Something went wrong during approval",
        });
        return false;
      }
    },
    [address, walletClient, publicClient, writeContractAsync]
  );
};
