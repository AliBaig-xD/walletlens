"use client";

import { RainbowKitProvider } from "@rainbow-me/rainbowkit";
import { useTheme } from "next-themes";
import { ReactNode, useEffect, useState } from "react";
import rainbowkitTheme from "@/lib/config/rainbowkit-theme";

export default function RainbowKitThemeProvider({
  children,
}: {
  children: ReactNode;
}) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <RainbowKitProvider
      coolMode
      theme={rainbowkitTheme(resolvedTheme)}
      appInfo={{
        appName: "WalletLens",
        disclaimer: undefined,
      }}
    >
      {children}
    </RainbowKitProvider>
  );
}
