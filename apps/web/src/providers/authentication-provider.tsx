"use client";

import { ReactNode, useEffect } from "react";
import { useAccount } from "wagmi";
import { RainbowKitAuthenticationProvider } from "@rainbow-me/rainbowkit";
import { useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import rainbowkitAdapter from "@/lib/config/rainbowkit-adapter";
import { refreshToken } from "@/lib/api/auth";
import { useLogout } from "@/hooks/useLogout";

const REFRESH_INTERVAL = 10 * 60 * 1000;

export default function AuthenticationProvider({
  children,
}: {
  children: ReactNode;
}) {
  const { status } = useSession();
  const { address } = useAccount();
  const handleLogout = useLogout();

  const authAdapter = rainbowkitAdapter(address);

  useQuery({
    queryKey: ["auth", "refresh"],
    queryFn: refreshToken,
    refetchInterval: REFRESH_INTERVAL,
    refetchIntervalInBackground: true,
    enabled: status === "authenticated",
    retry: 1,
    staleTime: REFRESH_INTERVAL,
  });

  useEffect(() => {
    const handleUnauthorized = async () => {
      await handleLogout();
    };

    window.addEventListener("auth:unauthorized", handleUnauthorized);
    return () =>
      window.removeEventListener("auth:unauthorized", handleUnauthorized);
  }, [handleLogout]);

  return (
    <RainbowKitAuthenticationProvider adapter={authAdapter} status={status}>
      {children}
    </RainbowKitAuthenticationProvider>
  );
}
