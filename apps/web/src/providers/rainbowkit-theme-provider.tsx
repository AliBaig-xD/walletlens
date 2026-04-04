"use client";

import { darkTheme, RainbowKitProvider } from "@rainbow-me/rainbowkit";
import { ReactNode, useEffect, useState } from "react";

export default function RainbowKitThemeProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const theme = darkTheme({
    accentColor: "#00ffa3",
    accentColorForeground: "#003920",
    borderRadius: "medium",
  });

  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <RainbowKitProvider
      coolMode
      theme={theme}
      appInfo={{
        appName: "WalletLens",
        disclaimer: undefined,
      }}
    >
      {children}
    </RainbowKitProvider>
  );
}
