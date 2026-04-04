"use client";

import { http, createConfig } from "wagmi";
import { baseSepolia } from "wagmi/chains";
import { injected, walletConnect, coinbaseWallet } from "wagmi/connectors";

const chains = [baseSepolia] as const;

const transports = {
  [baseSepolia.id]: http(
    process.env.NEXT_PUBLIC_ALCHEMY_API_KEY
      ? `https://base-sepolia.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_API_KEY}`
      : "https://sepolia.base.org",
  ),
};

const connectors = [
  injected({ shimDisconnect: true }),
  walletConnect({
    projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "",
    metadata: {
      name: process.env.NEXT_PUBLIC_APP_NAME || "WalletLens",
      description: "Wallet intelligence on demand",
      url: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
      icons: [`${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/logo.png`],
    },
    showQrModal: true,
  }),
  coinbaseWallet({
    appName: process.env.NEXT_PUBLIC_APP_NAME || "WalletLens",
    appLogoUrl: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/logo.png`,
  }),
];

export const wagmiConfig = createConfig({
  chains,
  connectors,
  transports,
  ssr: true,
});

export { chains, baseSepolia as defaultChain };
