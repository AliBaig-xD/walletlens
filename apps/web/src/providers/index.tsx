"use client";

import { ReactNode, useState } from "react";
import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "next-themes";
import { wagmiConfig } from "@/lib/config/wagmi";
import AuthenticationProvider from "./authentication-provider";
import RainbowKitThemeProvider from "./rainbowkit-theme-provider";
import "@rainbow-me/rainbowkit/styles.css";

export function Providers({ children }: { children: ReactNode }) {
  const [config] = useState(() => wagmiConfig);
  const [queryClient] = useState(() => new QueryClient());

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem
      disableTransitionOnChange
    >
      <WagmiProvider config={config}>
        <SessionProvider refetchInterval={0}>
          <QueryClientProvider client={queryClient}>
            <AuthenticationProvider>
              <RainbowKitThemeProvider>{children}</RainbowKitThemeProvider>
            </AuthenticationProvider>
          </QueryClientProvider>
        </SessionProvider>
      </WagmiProvider>
    </ThemeProvider>
  );
}
