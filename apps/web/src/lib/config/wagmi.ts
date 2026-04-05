"use client";

import { http, createConfig } from "wagmi";
import { baseSepolia } from "wagmi/chains";
import { injected, walletConnect, coinbaseWallet } from "wagmi/connectors";
import { env } from "./env";

const chains = [baseSepolia] as const;

const transports = {
  [baseSepolia.id]: http(
    env.NEXT_PUBLIC_ALCHEMY_API_KEY
      ? `https://base-sepolia.g.alchemy.com/v2/${env.NEXT_PUBLIC_ALCHEMY_API_KEY}`
      : "https://sepolia.base.org",
  ),
};

const connectors = [
  injected({ shimDisconnect: true }),
  walletConnect({
    projectId: env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "",
    metadata: {
      name: env.NEXT_PUBLIC_APP_NAME || "WalletLens",
      description: "Wallet intelligence on demand",
      url: env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
      icons: [`${env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/logo.png`],
    },
    showQrModal: true,
  }),
  coinbaseWallet({
    appName: env.NEXT_PUBLIC_APP_NAME || "WalletLens",
    appLogoUrl: `${env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/logo.png`,
  }),
];

export const wagmiConfig = createConfig({
  chains,
  connectors,
  transports,
  ssr: true,
});

export { chains, baseSepolia as defaultChain };
