import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { wrapFetchWithPayment } from "x402-fetch";
import { createSigner, type Network } from "x402/types";
import { z } from "zod";

const MIN_NODE_MAJOR = 18;

const API_URL =
  process.env["WALLETLENS_API_URL"] ?? "https://api.walletlens.online";
const PRIVATE_KEY = process.env["AGENT_PRIVATE_KEY"] as `0x${string}`;
const NETWORK = process.env["NETWORK"] ?? "base-sepolia";
const X402_MAX_PAYMENT_USDC = process.env["X402_MAX_PAYMENT_USDC"] ?? "10";

function assertRuntime(): void {
  const major = Number(process.versions.node.split(".")[0]);
  if (Number.isNaN(major) || major < MIN_NODE_MAJOR) {
    throw new Error(
      `Node.js ${MIN_NODE_MAJOR}+ is required. Detected ${process.versions.node}.`,
    );
  }

  if (typeof fetch !== "function") {
    throw new Error(
      "Global fetch is unavailable in this runtime. Use Node.js 18+.",
    );
  }
}

function assertPrivateKeyFormat(key: string): void {
  if (!/^0x[0-9a-fA-F]{64}$/.test(key)) {
    throw new Error(
      "AGENT_PRIVATE_KEY must be a 32-byte hex string prefixed with 0x.",
    );
  }
}

function parseUsdcToAtomic(input: string): bigint {
  const normalized = input.trim();
  if (!/^[0-9]+(\.[0-9]{1,6})?$/.test(normalized)) {
    throw new Error("Invalid X402_MAX_PAYMENT_USDC format");
  }
  const [whole, fractional = ""] = normalized.split(".");
  const paddedFractional = (fractional + "000000").slice(0, 6);
  return BigInt(whole) * BigInt(1_000_000) + BigInt(paddedFractional);
}

const X402_MAX_PAYMENT_ATOMIC = parseUsdcToAtomic(X402_MAX_PAYMENT_USDC);

assertRuntime();

if (!PRIVATE_KEY) {
  throw new Error(
    "AGENT_PRIVATE_KEY is required.\n" +
      "Set it in claude_desktop_config.json under env.AGENT_PRIVATE_KEY.\n" +
      "The wallet needs USDC on Base Sepolia. Get test USDC at https://faucet.circle.com",
  );
}

assertPrivateKeyFormat(PRIVATE_KEY);

if (NETWORK !== "base" && NETWORK !== "base-sepolia") {
  throw new Error('NETWORK must be "base" or "base-sepolia".');
}

const signer = await createSigner(NETWORK as Network, PRIVATE_KEY);

// x402-fetch automatically handles the 402 → pay → retry flow
const fetch402 = wrapFetchWithPayment(fetch, signer, X402_MAX_PAYMENT_ATOMIC);

async function callApi(endpoint: string, body: unknown) {
  const response = await fetch402(`${API_URL}/api/v1/${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const json = (await response.json()) as any;

  if (!response.ok) {
    return {
      ok: false,
      error: json?.error?.message ?? `HTTP ${response.status}`,
    };
  }

  return { ok: true, data: json.data };
}

const server = new McpServer({ name: "walletlens", version: "1.0.0" });

// ── Tool 1: analyze_wallet ─────────────────────────────────────────────────────

server.tool(
  "analyze_wallet",
  `Analyze a blockchain wallet address using Arkham Intelligence and Claude AI.
Returns entity attribution, labels, tags, risk score (0-100), and an AI-written analysis.
Cost: $0.10 USDC per query, paid automatically via x402 on Base.
Use for: wallet identification, risk assessment, entity lookup.`,
  {
    address: z
      .string()
      .describe("EVM wallet address to analyze (0x followed by 40 hex chars)"),
  },
  async ({ address }) => {
    const result = await callApi("analyze", { address });

    if (!result.ok) {
      return {
        content: [{ type: "text", text: `Error: ${result.error}` }],
        isError: true,
      };
    }

    const d = result.data;
    const lines = [
      `Address: ${d.address}`,
      `Chain: ${d.chain}`,
      `Entity: ${d.entity ? `${d.entity.name} (${d.entity.type})${d.entity.isPredicted ? " [predicted]" : " [verified]"}` : "Unknown"}`,
      `Label: ${d.label ?? "None"}`,
      `Tags: ${d.tags?.map((t: any) => t.label).join(", ") || "None"}`,
      `Risk Score: ${d.riskScore}/100`,
      `Recent Transactions (30d): ${d.transfers?.count ?? 0}`,
      "",
      "AI Analysis:",
      d.summary,
      "",
      `Generated: ${d.generatedAt}`,
    ];

    return { content: [{ type: "text", text: lines.join("\n") }] };
  },
);

// ── Tool 2: get_transfers ──────────────────────────────────────────────────────

server.tool(
  "get_transfers",
  `Get recent transfer activity for a wallet address.
Returns last 30d of on-chain transactions with entity attribution and USD values.
Cost: $0.05 USDC per query, paid automatically via x402.
Use for: tracing fund flows, identifying counterparties, monitoring activity.`,
  {
    address: z.string().describe("EVM wallet address (0x...)"),
    timeLast: z
      .string()
      .optional()
      .describe("Time range: 24h, 7d, 30d (default)"),
  },
  async ({ address, timeLast = "30d" }) => {
    const result = await callApi("transfers", { address, timeLast });

    if (!result.ok) {
      return {
        content: [{ type: "text", text: `Error: ${result.error}` }],
        isError: true,
      };
    }

    const d = result.data;
    if (!d.transfers?.length) {
      return {
        content: [
          {
            type: "text",
            text: `No transfers found for ${address} in the last ${timeLast}`,
          },
        ],
      };
    }

    const header = `${address} — ${d.count} transfers in last ${timeLast}\n\n`;
    const rows = d.transfers.slice(0, 15).map((t: any) => {
      const from = t.fromEntity ?? t.from.slice(0, 10) + "...";
      const to = t.toEntity ?? t.to.slice(0, 10) + "...";
      return `${new Date(t.timestamp).toLocaleString()} | ${from} → ${to} | ${t.amount.toFixed(4)} ${t.token} ($${t.amountUSD.toFixed(2)})`;
    });

    return { content: [{ type: "text", text: header + rows.join("\n") }] };
  },
);

// ── Tool 3: generate_report ────────────────────────────────────────────────────

server.tool(
  "generate_report",
  `Generate a full intelligence report for a wallet address.
Includes entity analysis, risk assessment, full transfer history, and AI analysis.
Returns the complete report inline as markdown.
Cost: $1.00 USDC, paid once. Subsequent requests with the unlock token are free.
Use for: comprehensive wallet investigation, shareable intelligence reports.`,
  {
    address: z.string().describe("EVM wallet address (0x...)"),
  },
  async ({ address }) => {
    const result = await callApi("report", { address });

    if (!result.ok) {
      return {
        content: [{ type: "text", text: `Error: ${result.error}` }],
        isError: true,
      };
    }

    const d = result.data;
    const lines = [
      `Full intelligence report for ${address}`,
      "",
      `Entity: ${d.entity ? `${d.entity.name} (${d.entity.type})` : "Unknown"}`,
      `Risk Score: ${d.riskScore}/100`,
      "",
      "--- REPORT ---",
      "",
      d.markdown,
    ];

    return { content: [{ type: "text", text: lines.join("\n") }] };
  },
);

const transport = new StdioServerTransport();
await server.connect(transport);
console.error("[WalletLens MCP] Running — Claude Desktop ready");
