"use client";

import { useMemo } from "react";
import { useWalletClient } from "wagmi";
import { wrapFetchWithPayment } from "x402-fetch";

function parseUsdcToAtomic(input: string): bigint {
  const normalized = input.trim();
  if (!/^[0-9]+(\\.[0-9]{1,6})?$/.test(normalized)) {
    throw new Error("Invalid USDC amount format");
  }
  const [whole, fractional = ""] = normalized.split(".");
  const paddedFractional = (fractional + "000000").slice(0, 6);
  return BigInt(whole) * BigInt(1_000_000) + BigInt(paddedFractional);
}

export function useX402Fetch() {
  const { data: walletClient } = useWalletClient();

  return useMemo(() => {
    if (!walletClient) return null;
    const maxPayment =
      process.env.NEXT_PUBLIC_X402_MAX_PAYMENT_USDC ?? "10";
    return wrapFetchWithPayment(
      fetch,
      walletClient as any,
      parseUsdcToAtomic(maxPayment),
    );
  }, [walletClient]);
}
