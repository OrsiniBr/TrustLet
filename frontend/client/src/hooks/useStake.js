import { useCallback } from "react";
import { useAccount, usePublicClient, useWalletClient, useWriteContract } from "wagmi";
import { CHAT_ADDRESS, CHAT_ABI } from "../config/abi";
import toast from "react-hot-toast";

const useStake = () => {
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();
  const walletCLient = useWalletClient();
  const { writeContractAsync } = useWriteContract();

  return useCallback(async () => {
    
      if (!address || !walletCLient) {
        toast.error("Please connect your wallet");
        return
      }
      if (!publicClient) {
        toast.error("Public client not available");
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
          hash:stakeHash
        })
        if (stakeReciept.status === "success") {
          toast.success("Chat stake successful")
        }
        else {
          toast.error("Chat stake failed")
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
    
      
  }, [address, publicClient, writeContractAsync]);

  // const stake = useCallback(async () => {
  //   if (!address) {
  //     toast.error("Please connect your wallet");
  //     return;
  //   }

  //   try {
  //     // Get the required ETH amount for $3 USD from the contract
  //     const requiredEth = await publicClient.readContract({
  //       address: CHAT_ADDRESS,
  //       abi: CHAT_ABI,
  //       functionName: "getRequiredStakeAmount",
  //     });

  //     const txHash = await writeContractAsync({
  //       address: CHAT_ADDRESS,
  //       abi: CHAT_ABI,
  //       functionName: "stake",
  //       value: requiredEth,
  //     });

  //     console.log("txHash: ", txHash);

  //     const txReceipt = await publicClient.waitForTransactionReceipt({
  //       hash: txHash,
  //     });

  //     if (txReceipt.status === "success") {
  //       toast.success("Chat stake successful", {
  //         description: "You have successfully staked for chat access",
  //       });
  //     } else {
  //       toast.error("Chat stake failed", {
  //         description: "Transaction was unsuccessful",
  //       });
  //     }
  //   } catch (error) {
  //     console.error("Stake error:", error);

  //     if (error.message?.includes("Must send exact ether amount")) {
  //       toast.error("Insufficient ETH amount");
  //     } else if (error.message?.includes("rejected")) {
  //       toast.error("Transaction rejected by user");
  //     } else {
  //       toast.error("Transaction failed", {
  //         description: "Please try again",
  //       });
  //     }
  //   }
  // }, [address, publicClient, writeContractAsync]);

  // return {
  //   stake,
  //   isConnected,
  //   address,
  // };
};

export default useStake;
