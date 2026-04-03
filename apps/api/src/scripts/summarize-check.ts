import { disconnectRedis } from "../config/redis.js";
import { logger } from "../utils/logger.js";
import {
  generateReportMarkdown,
  generateSummary,
} from "../api/v1/services/summarize.service.js";
import type {
  ArkhamEnrichedResponse,
  ArkhamEntitySummary,
  ArkhamTransfersResponse,
} from "../types/arkham.js";

const ADDRESS = "0x220866B1A2219f40e72f5c628B65D54268cA3A9D";

const intelFixture: ArkhamEnrichedResponse = {
  address: ADDRESS,
  chain: "ethereum",
  contract: false,
  isUserAddress: false,
  arkhamEntity: {
    id: "vitalik-buterin",
    name: "Vitalik Buterin",
    type: "individual",
    twitter: "https://twitter.com/VitalikButerin",
    crunchbase: "https://www.crunchbase.com/person/vitalik-buterin",
    linkedin: "https://www.linkedin.com/in/vitalik-buterin-267a7450",
  },
  arkhamLabel: {
    address: ADDRESS,
    chainType: "ethereum",
    name: "Gnosis Safe Proxy",
  },
  populatedTags: [
    {
      id: "fixture-tag-1",
      label: "high-profile individual",
      chain: "ethereum",
      rank: 1,
      disablePage: false,
      excludeEntities: false,
    },
  ],
};

const transfersFixture: ArkhamTransfersResponse = {
  transfers: [
    {
      id: "0x2b04c72ef97e19f5f7682750c38b08e5d99388db6c0c4c3259b01e68af72e1df_685",
      blockTimestamp: "2026-04-03T07:12:15Z",
      blockNumber: 90335171,
      blockID: "90335171",
      chain: "bsc",
      unitValue: 10,
      historicalUSD: 0,
      tokenSymbol: "BINANCE",
      tokenName: "Binance",
      tokenAddress: "0x055871163d99B5E7Dd5626696E542f0ee4004444",
      tokenDecimals: 18,
      transactionHash:
        "0x2b04c72ef97e19f5f7682750c38b08e5d99388db6c0c4c3259b01e68af72e1df",
      fromIsContract: true,
      toIsContract: false,
      fromAddress: {
        address: "0xddBB3710baC7bA01BD47884D9F936aF82297Fa6d",
      },
      toAddress: {
        address: ADDRESS,
        arkhamEntity: { name: "Vitalik Buterin" },
      },
    },
  ],
};

const entitySummaryFixture: ArkhamEntitySummary = {
  entityId: "vitalik-buterin",
  balanceUsd: 463717383.79655343,
  volumeUsd: 15329330409.04001,
  numAddresses: 10,
  firstTx: "2015-07-30T00:00:00Z",
  lastTx: "2026-04-03T07:12:15Z",
};

async function main() {
  logger.info("Running summarize check", { address: ADDRESS });

  const summary = await generateSummary(
    ADDRESS,
    intelFixture,
    transfersFixture,
    entitySummaryFixture,
  );

  const markdown = await generateReportMarkdown(
    ADDRESS,
    intelFixture,
    transfersFixture,
    entitySummaryFixture,
    summary,
  );

  console.log(
    JSON.stringify(
      {
        address: ADDRESS,
        summaryPreview: summary.slice(0, 280),
        summaryLength: summary.length,
        markdownLength: markdown.length,
        markdownPreview: markdown.slice(0, 500),
      },
      null,
      2,
    ),
  );
}

async function shutdown(exitCode: number): Promise<never> {
  try {
    await disconnectRedis();
  } catch (error) {
    logger.warn("Failed to close Redis cleanly", { error });
  }
  process.exit(exitCode);
}

void main()
  .then(() => shutdown(0))
  .catch((error: unknown) => {
    logger.error("Summarize check failed", { error });
    return shutdown(1);
  });