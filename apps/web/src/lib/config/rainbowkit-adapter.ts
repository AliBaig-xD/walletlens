"use client";

import { createAuthenticationAdapter } from "@rainbow-me/rainbowkit";
import { signOut as nextAuthSignOut, signIn } from "next-auth/react";
import { Address } from "viem";

const siweMessage = (args: {
  nonce: string;
  address: Address;
  chainId: number;
}) => {
  const { nonce, address, chainId } = args;
  const domain = window.location.host;
  const uri = window.location.origin;
  const issuedAt = new Date().toISOString();

  return `${domain} wants you to sign in with your Ethereum account:
${address}

Sign in to WalletLens

URI: ${uri}
Version: 1
Chain ID: ${chainId}
Nonce: ${nonce}
Issued At: ${issuedAt}`;
};

const rainbowkitAdapter = (address: string | undefined) => {
  const authAdapter = createAuthenticationAdapter({
    getNonce: async () => {
      const url = address ? `/api/auth/siwe?address=${address}` : "/api/auth/siwe";
      const response = await fetch(url);
      return await response.text();
    },
    createMessage: siweMessage,
    verify: async ({ message, signature }) => {
      const result = await signIn("credentials", {
        message,
        signature,
        redirect: false,
      });
      return result?.ok ?? false;
    },
    signOut: async () => {
      await nextAuthSignOut();
    },
  });
  return authAdapter;
};

export default rainbowkitAdapter;
