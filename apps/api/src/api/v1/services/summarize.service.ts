import Anthropic from "@anthropic-ai/sdk";
import { env } from "../../../config/env.js";
import { logger } from "../../../utils/logger.js";
import { cleanTagLabel, computeRiskScore } from "../../../utils/arkham.util.js";
import {
  ArkhamEnrichedResponse,
  ArkhamEntitySummary,
  ArkhamTransfersResponse,
} from "../../../types/arkham.js";

const claude = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });

export async function generateSummary(
  address: string,
  intel: ArkhamEnrichedResponse,
  transfers: ArkhamTransfersResponse,
  entitySummary: ArkhamEntitySummary | null,
): Promise<string> {
  const riskScore = computeRiskScore(intel);
  const entity = intel.arkhamEntity ?? intel.predictedEntity;
  const isPredicted = !intel.arkhamEntity && !!intel.predictedEntity;
  const tags =
    intel.populatedTags?.map((t) => cleanTagLabel(t.label)).join(", ") ||
    "None";
  const totalUSD = transfers.transfers.reduce((s, t) => s + t.historicalUSD, 0);

  const entityContext = entity
    ? `Entity: ${entity.name} (${entity.type})${isPredicted ? " [PREDICTED — lower confidence]" : " [VERIFIED]"}`
    : "Entity: Unknown / Unattributed";

  const entityStats = entitySummary
    ? `Entity-wide stats: $${entitySummary.balanceUsd.toLocaleString()} total balance, $${entitySummary.volumeUsd.toLocaleString()} total volume, ${entitySummary.numAddresses} addresses`
    : "";

  const recentLines = transfers.transfers
    .slice(0, 8)
    .map((t) => {
      const from =
        t.fromAddress.arkhamEntity?.name ??
        t.fromAddress.address.slice(0, 10) + "...";
      const to =
        t.toAddress.arkhamEntity?.name ??
        t.toAddress.address.slice(0, 10) + "...";
      return `  ${t.blockTimestamp}: ${t.unitValue} ${t.tokenSymbol} ($${t.historicalUSD.toFixed(2)}) | ${from} → ${to}`;
    })
    .join("\n");

  const prompt = `You are a blockchain intelligence analyst. Write a concise 3-paragraph wallet analysis.

WALLET: ${address}
CHAIN: ${intel.chain}
${entityContext}
LABEL: ${intel.arkhamLabel?.name ?? "None"}
TAGS: ${tags}
RISK SCORE: ${riskScore}/100
${entityStats}

RECENT ACTIVITY (24h):
Transactions: ${transfers.transfers.length}
Volume: $${totalUSD.toLocaleString()}
${recentLines || "  No recent transfers"}

INSTRUCTIONS:
- Paragraph 1: Identity — who or what controls this address, confidence level (verified vs predicted)
- Paragraph 2: Recent activity patterns and notable counterparties
- Paragraph 3: Risk assessment — flags found, overall risk level, recommendation

Keep it factual and professional. Max 200 words. Do not make legal conclusions.
Mention when attribution is predicted vs verified.`;

  const model =
    env.NODE_ENV === "production"
      ? "claude-opus-4-20250514"
      : "claude-sonnet-4-20250514";

  const message = await claude.messages.create({
    model,
    max_tokens: 512,
    messages: [{ role: "user", content: prompt }],
  });

  const content = message.content[0];
  if (content?.type !== "text")
    throw new Error("Unexpected Claude response type");

  logger.info("Summary generated", {
    address,
    riskScore,
    tokens: message.usage.output_tokens,
  });

  return content.text;
}

export async function generateReportMarkdown(
  address: string,
  intel: ArkhamEnrichedResponse,
  transfers: ArkhamTransfersResponse,
  entitySummary: ArkhamEntitySummary | null,
  summary: string,
): Promise<string> {
  const riskScore = computeRiskScore(intel);
  const entity = intel.arkhamEntity ?? intel.predictedEntity;
  const isPredicted = !intel.arkhamEntity && !!intel.predictedEntity;
  const tags =
    intel.populatedTags?.map((t) => cleanTagLabel(t.label)).join(", ") ||
    "None";
  const totalUSD = transfers.transfers.reduce((s, t) => s + t.historicalUSD, 0);
  const now = new Date().toUTCString();

  const riskLabel =
    riskScore >= 60 ? "🔴 HIGH" : riskScore >= 30 ? "🟡 MEDIUM" : "🟢 LOW";

  return `# WalletLens Intelligence Report

**Generated:** ${now}
**Powered by:** Arkham Intelligence × Claude AI × WalletLens

---

## Wallet Overview

| Field | Value |
|-------|-------|
| Address | \`${address}\` |
| Chain | ${intel.chain} |
| Entity | ${entity ? `${entity.name} (${entity.type})${isPredicted ? " *predicted*" : ""}` : "Unknown"} |
| Label | ${intel.arkhamLabel?.name ?? "None"} |
| Risk Score | **${riskScore}/100 — ${riskLabel}** |
| Tags | ${tags} |
| Contract | ${intel.contract ? "Yes" : "No"} |

${
  entitySummary
    ? `## Entity Statistics

| Metric | Value |
|--------|-------|
| Total Balance | $${entitySummary.balanceUsd.toLocaleString()} |
| Total Volume | $${entitySummary.volumeUsd.toLocaleString()} |
| Addresses | ${entitySummary.numAddresses} |
| First Transaction | ${entitySummary.firstTx} |
| Last Transaction | ${entitySummary.lastTx} |

`
    : ""
}---

## AI Analysis

${summary}

---

## Recent Activity (Last 24h)

**Transactions:** ${transfers.transfers.length}
**Volume:** $${totalUSD.toLocaleString()}

### Transfer Log

| Time | From | To | Amount | USD |
|------|------|----|--------|-----|
${transfers.transfers
  .slice(0, 25)
  .map((t) => {
    const from =
      t.fromAddress.arkhamEntity?.name ??
      t.fromAddress.address.slice(0, 8) + "...";
    const to =
      t.toAddress.arkhamEntity?.name ?? t.toAddress.address.slice(0, 8) + "...";
    return `| ${new Date(t.blockTimestamp).toLocaleString()} | ${from} | ${to} | ${t.unitValue.toFixed(4)} ${t.tokenSymbol} | $${t.historicalUSD.toFixed(2)} |`;
  })
  .join("\n")}

---

## Disclaimer

This report uses Arkham's probabilistic attribution. Predicted entities (marked *predicted*) are lower confidence than verified entities. This report is for informational and research purposes only and does not constitute legal advice, investment advice, or admissible evidence. Always corroborate findings independently.

*WalletLens — walletlens.online*
`;
}
