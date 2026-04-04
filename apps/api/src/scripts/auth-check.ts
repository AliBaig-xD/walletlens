import "dotenv/config";
import { Wallet } from "ethers";

const SERVER_URL = (process.env.SERVER_URL ?? "http://localhost:4000").replace(
  /\/$/,
  "",
);

const PRIVATE_KEY = process.env.PRIVATE_KEY_TEST;
const WALLET_ADDRESS = process.env.WALLET_ADDRESS_TEST;

type Json = Record<string, unknown>;

async function requestJson(
  path: string,
  init: RequestInit,
): Promise<{ status: number; json: Json }> {
  const res = await fetch(`${SERVER_URL}${path}`, init);
  const text = await res.text();
  let json: Json = {};
  try {
    json = text ? (JSON.parse(text) as Json) : {};
  } catch {
    json = { raw: text };
  }
  return { status: res.status, json };
}

function buildMessage(address: string, nonce: string): string {
  return [
    "WalletLens Sign-In",
    `Address: ${address}`,
    `Nonce: ${nonce}`,
  ].join("\n");
}

async function main(): Promise<void> {
  if (!PRIVATE_KEY) {
    throw new Error("Set PRIVATE_KEY_TEST in apps/api/.env");
  }
  if (!WALLET_ADDRESS) {
    throw new Error("Set WALLET_ADDRESS_TEST in apps/api/.env");
  }

  const wallet = new Wallet(PRIVATE_KEY);
  if (wallet.address.toLowerCase() !== WALLET_ADDRESS.toLowerCase()) {
    console.warn(
      "Warning: WALLET_ADDRESS_TEST does not match PRIVATE_KEY_TEST address.",
    );
  }

  console.log("Auth check starting...");
  console.log(`Server: ${SERVER_URL}`);
  console.log(`Wallet: ${WALLET_ADDRESS}`);

  // 1) Get nonce
  const nonceRes = await requestJson(
    `/api/v1/auth/nonce?address=${WALLET_ADDRESS}`,
    { method: "GET" },
  );
  if (nonceRes.status !== 200) {
    throw new Error(`Nonce failed: ${JSON.stringify(nonceRes.json)}`);
  }
  const nonce = (nonceRes.json.data as any)?.nonce as string | undefined;
  if (!nonce) throw new Error("Nonce missing in response");
  console.log("Nonce:", nonce);

  // 2) Sign message
  const message = buildMessage(WALLET_ADDRESS, nonce);
  const signature = await wallet.signMessage(message);

  // 3) Verify
  const verifyRes = await requestJson("/api/v1/auth/verify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message,
      signature,
      address: WALLET_ADDRESS,
    }),
  });
  if (verifyRes.status !== 200) {
    throw new Error(`Verify failed: ${JSON.stringify(verifyRes.json)}`);
  }

  const data = verifyRes.json.data as any;
  const token = data?.token as string | undefined;
  const refreshToken = data?.refreshToken as string | undefined;
  if (!token || !refreshToken) {
    throw new Error("Verify response missing token/refreshToken");
  }
  console.log("Verify OK. Token issued.");

  // 4) Me
  const meRes = await requestJson("/api/v1/auth/me", {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (meRes.status !== 200) {
    throw new Error(`Me failed: ${JSON.stringify(meRes.json)}`);
  }
  console.log("Me OK.");

  // 5) Refresh
  const refreshRes = await requestJson("/api/v1/auth/refresh", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
  });
  if (refreshRes.status !== 200) {
    throw new Error(`Refresh failed: ${JSON.stringify(refreshRes.json)}`);
  }
  const refreshed = refreshRes.json.data as any;
  const newToken = refreshed?.token as string | undefined;
  if (!newToken) throw new Error("Refresh response missing token");
  console.log("Refresh OK.");

  // 6) Logout
  const logoutRes = await requestJson("/api/v1/auth/logout", {
    method: "POST",
    headers: { Authorization: `Bearer ${newToken}` },
  });
  if (logoutRes.status !== 200) {
    throw new Error(`Logout failed: ${JSON.stringify(logoutRes.json)}`);
  }
  console.log("Logout OK.");

  console.log("Auth check complete.");
}

main().catch((err) => {
  console.error("Auth check failed:", err instanceof Error ? err.message : err);
  process.exit(1);
});
