"use client";

import { signOut } from "next-auth/react";
import { useDisconnect } from "wagmi";
import { logout } from "@/lib/api/auth";

export function useLogout() {
  const { disconnect } = useDisconnect();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Backend logout failed:", error);
    } finally {
      disconnect();
      await signOut({ redirect: true, callbackUrl: "/" });
    }
  };

  return handleLogout;
}
