import { decodeXPaymentResponse, wrapFetchWithPayment } from "x402-fetch";
import { createSigner, type Network, type Wallet } from "x402/types";
import readline from "readline";
import "dotenv/config";

type Fetch402 = ReturnType<typeof wrapFetchWithPayment>;

type EndpointOption = {
  label: string;
  path: string;
  method: "GET" | "POST";
  price: string;
  mode: "per_request" | "one_time";
  description: string;
};

const ENDPOINTS: EndpointOption[] = [
  {
    label: "/api/v1/analyze   - $0.10 per request",
    path: "/api/v1/analyze",
    method: "POST",
    price: "0.10",
    mode: "per_request",
    description: "Analyze endpoint",
  },
  {
    label: "/api/v1/transfers - $0.05 per request",
    path: "/api/v1/transfers",
    method: "POST",
    price: "0.05",
    mode: "per_request",
    description: "Transfers endpoint",
  },
  {
    label: "/api/v1/report    - $1.00 one-time",
    path: "/api/v1/report",
    method: "POST",
    price: "1.00",
    mode: "one_time",
    description: "Report endpoint (one-time unlock)",
  },
];

function normalizePrivateKey(input: string): `0x${string}` {
  const trimmed = input.trim();
  const withPrefix = trimmed.startsWith("0x") ? trimmed : `0x${trimmed}`;
  if (!/^0x[0-9a-fA-F]{64}$/.test(withPrefix)) {
    throw new Error("Invalid PRIVATE_KEY_TEST format. Expected 0x + 64 hex.");
  }
  return withPrefix as `0x${string}`;
}

function parseUsdcToAtomic(input: string): bigint {
  const normalized = input.trim();
  if (!/^\d+(\.\d{1,6})?$/.test(normalized)) {
    throw new Error("Invalid USDC amount format. Use up to 6 decimals.");
  }
  const [whole, fractional = ""] = normalized.split(".");
  const paddedFractional = (fractional + "000000").slice(0, 6);
  return BigInt(whole) * 1_000_000n + BigInt(paddedFractional);
}

function prompt(rl: readline.Interface, question: string): Promise<string> {
  return new Promise((resolve) => rl.question(question, resolve));
}

const DIVIDER = "=".repeat(52);
const DIVIDER_THIN = "-".repeat(52);

function printHeader() {
  console.clear();
  console.log("");
  console.log("  ================================================");
  console.log("  MonkePay x402 Endpoint Tester");
  console.log("  ================================================");
  console.log("");
}

async function selectEndpoint(rl: readline.Interface): Promise<EndpointOption> {
  console.log("");
  console.log(`  ${DIVIDER_THIN}`);
  console.log("  Select an endpoint to call:");
  console.log(`  ${DIVIDER_THIN}`);
  console.log("");
  ENDPOINTS.forEach((e, i) => {
    console.log(`  [${i + 1}] ${e.label}`);
  });
  console.log("");

  while (true) {
    const input = await prompt(rl, "  > Enter number: ");
    const index = parseInt(input.trim(), 10) - 1;
    if (index >= 0 && index < ENDPOINTS.length) {
      return ENDPOINTS[index];
    }
    console.log("  Invalid selection. Try again.");
  }
}

async function makeRequest(
  fetch402: Fetch402,
  endpoint: EndpointOption,
  serverUrl: string,
  unlockTokens: Map<string, string>,
  address: string,
  timeLast: string,
) {
  const url = `${serverUrl}${endpoint.path}`;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  console.log("");
  console.log(`  ${DIVIDER_THIN}`);
  console.log(`  ${endpoint.method} ${endpoint.path}`);
  console.log(`  ${DIVIDER_THIN}`);
  console.log("");

  const cachedToken = unlockTokens.get(endpoint.path);
  if (endpoint.mode === "one_time" && cachedToken) {
    console.log("  Unlock token found in cache. Skipping payment.");
    headers["X-MonkePay-Unlock"] = cachedToken;
  }

  const body =
    endpoint.path === "/api/v1/transfers"
      ? { address, timeLast }
      : { address };

  const startTime = Date.now();
  let response: Response;
  try {
    response =
      cachedToken && endpoint.mode === "one_time"
        ? await fetch(url, {
            method: endpoint.method,
            headers,
            body: JSON.stringify(body),
          })
        : await fetch402(url, {
            method: endpoint.method,
            headers,
            body: JSON.stringify(body),
          });
  } catch (err) {
    console.log("  Request failed.");
    console.log(
      `  Error: ${err instanceof Error ? err.message : String(err)}`,
    );
    return;
  }

  const elapsed = Date.now() - startTime;

  if (!response.ok) {
    console.log(`  Request failed (${response.status}).`);
    console.log("");
    console.log(`  Body: ${await response.text()}`);
    return;
  }

  const paymentResponseHeader =
    response.headers.get("X-PAYMENT-RESPONSE") ??
    response.headers.get("x-payment-response");

  let txHash: string | undefined;
  let txNetwork: string | undefined;

  if (paymentResponseHeader) {
    try {
      const decoded = decodeXPaymentResponse(paymentResponseHeader);
      txHash = decoded.transaction;
      txNetwork = decoded.network;
    } catch {
      // ignore decode errors
    }
  }

  const unlockToken =
    response.headers.get("X-MonkePay-Unlock") ??
    response.headers.get("x-monkeypay-unlock");

  if (unlockToken) {
    unlockTokens.set(endpoint.path, unlockToken);
  }

  const data = await response.json();

  console.log("");
  console.log(`  ${DIVIDER}`);
  console.log("  SUCCESS");
  console.log(`  ${DIVIDER}`);
  console.log("");
  console.log(`  Status  : ${response.status}`);
  console.log(`  Time    : ${elapsed}ms (incl. payment)`);
  if (txHash) {
    console.log("  Payment : executed");
  }
  console.log("");
  console.log("  Data:");
  JSON.stringify(data, null, 2)
    .split("\n")
    .forEach((line) => console.log(`    ${line}`));

  if (txHash) {
    const explorerBase =
      txNetwork === "base"
        ? "https://basescan.org/tx"
        : "https://sepolia.basescan.org/tx";
    console.log("");
    console.log("  Payment transaction proof:");
    console.log(`  ${explorerBase}/${txHash}`);
  }

  if (unlockToken) {
    console.log("");
    console.log(`  ${DIVIDER}`);
    console.log("  ONE-TIME UNLOCK TOKEN RECEIVED");
    console.log(`  ${DIVIDER}`);
    console.log("  Token cached for this session.");
    console.log("  Next call to this endpoint is free.");
    console.log("");
    console.log("  To use manually:");
    console.log(`  curl -X POST ${serverUrl}${endpoint.path} \\`);
    console.log("    -H 'Content-Type: application/json' \\");
    console.log(`    -H 'X-MonkePay-Unlock: ${unlockToken}' \\`);
    console.log(`    -d '{"address":"${address}"}'`);
  }

  if (process.env.RECEIVING_WALLET_ADDRESS) {
    const network = process.env.NETWORK ?? "base-sepolia";
    const explorerBase =
      network === "base"
        ? "https://basescan.org/address"
        : "https://sepolia.basescan.org/address";
    console.log("");
    console.log("  Check server wallet balance:");
    console.log(`  ${explorerBase}/${process.env.RECEIVING_WALLET_ADDRESS}`);
  }
}

async function main() {
  const serverUrl = (process.env.SERVER_URL ?? "http://localhost:4000").replace(
    /\/$/,
    "",
  );
  const network = (process.env.NETWORK ?? "base-sepolia") as Network;
  const maxPaymentUsdc = process.env.X402_MAX_PAYMENT_USDC ?? "10";
  const timeLast = process.env.TIME_LAST ?? "24h";

  if (network !== "base" && network !== "base-sepolia") {
    throw new Error('NETWORK must be "base" or "base-sepolia".');
  }

  const privateKeyRaw = process.env.PRIVATE_KEY_TEST;
  if (!privateKeyRaw) {
    throw new Error("Set PRIVATE_KEY_TEST in the environment.");
  }
  const privateKey = normalizePrivateKey(privateKeyRaw);

  const targetAddress = process.env.TARGET_ADDRESS;
  if (!targetAddress) {
    throw new Error("Set TARGET_ADDRESS in the environment.");
  }

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  printHeader();
  console.log(`  Server     : ${serverUrl}`);
  console.log(`  Network    : ${network}`);
  console.log(`  Max pay    : ${maxPaymentUsdc} USDC`);
  console.log(`  Address    : ${targetAddress}`);
  console.log("");

  const walletClient = await createSigner(network, privateKey);
  const fetch402 = wrapFetchWithPayment(
    fetch,
    walletClient as Wallet,
    parseUsdcToAtomic(maxPaymentUsdc),
  );

  console.log("  Status     : ready");
  console.log("");

  const unlockTokens = new Map<string, string>();

  while (true) {
    const endpoint = await selectEndpoint(rl);
    await makeRequest(
      fetch402,
      endpoint,
      serverUrl,
      unlockTokens,
      targetAddress,
      timeLast,
    );

    console.log("");
    const again = await prompt(rl, "  Make another request? (y/n): ");
    if (again.trim().toLowerCase() !== "y") break;

    printHeader();
    console.log(`  Server     : ${serverUrl}`);
    console.log(`  Network    : ${network}`);
    console.log(`  Address    : ${targetAddress}`);
    console.log("");
  }

  console.log("");
  console.log("  Done.");
  console.log("");
  rl.close();
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
