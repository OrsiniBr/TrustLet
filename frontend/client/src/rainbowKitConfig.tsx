"use client";

import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { mainnet, polygon, arbitrum, optimism, sepolia } from "wagmi/chains";

export default getDefaultConfig({
  appName: "Cross-Credit Lending",
  projectId: import.meta.env.VITE_WALLETCONNECT_PROJECT_ID, // ← Fixed this line
  chains: [mainnet, polygon, arbitrum, optimism, sepolia],
  ssr: false,
});
