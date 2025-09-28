import { useCallback } from "react";
import {
  useAccount,
  usePublicClient,
  useWalletClient,
  useWriteContract,
} from "wagmi";
import {CHAT_ABI } from "../config/abi";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";

const useStake = () => {
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();
  const walletCLient = useWalletClient();
  const { writeContractAsync } = useWriteContract();

  return useCallback(
    async (peerId) => {
               const CHAT_ADDRESS = import.meta.env.VITE_CHAT_CONTRACT_ADDRESS;

      if (!address || !walletCLient) {
        toast.error("Please connect your wallet");
        return;
      }
      if (!publicClient) {
        toast.error("Public client not available");
        return;
      }
      if (!walletCLient) {
        toast.error("Wallet client not available");
        return;
      }
      if (!CHAT_ADDRESS) {
        toast.error("Contract address not set");
        return;
      }



      try {
        const stakeHash = await writeContractAsync({
          address: CHAT_ADDRESS,
          abi: CHAT_ABI,
          functionName: "stake",
        });
        console.log("Stake hash : ".stakeHash);

        const stakeReciept = await publicClient.waitForTransactionReceipt({
          hash: stakeHash,
        });
        if (stakeReciept.status === "success") {
          toast.success("Chat stake successful");

          // Automatically call deposit endpoint after successful on-chain confirmation
          if (peerId) {
            try {
              await axiosInstance.post(`/game/deposit/${peerId}`);
              toast.success("Deposit confirmed on server");
            } catch (error) {
              console.error("Failed to confirm deposit on server:", error);
              toast.error("Stake successful but server confirmation failed");
            }
          }
        } else {
          toast.error("Chat stake failed");
        }
      } catch (error) {
        console.error("Stake error:", error);

        if (error.message?.includes("Must send exact ether amount")) {
          toast.error("Insufficient ETH amount");
        }
        if (error.message?.includes("rejected")) {
          toast.error("Transaction rejected by user");
        }
      }
    },
    [address, publicClient, writeContractAsync]
  );
};

export default useStake;
