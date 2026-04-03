import {
  getAddressEnriched,
  getAddressTransfers,
  getEntitySummary,
} from "../api/v1/services/arkham.service.js";
import { disconnectRedis } from "../config/redis.js";
import { logger } from "../utils/logger.js";

// Vitalik's address and entity ID are used here as a well-known test case to verify that the Arkham integration is working end-to-end.
const ADDRESS = "0x220866B1A2219f40e72f5c628B65D54268cA3A9D";
const ENTITY_ID = "vitalik-buterin";

function summarizeTransfers(count: number, firstTransfer: unknown) {
  return {
    count,
    firstTransfer,
  };
}

async function main() {
  logger.info("Running live Arkham check", {
    address: ADDRESS,
    entityId: ENTITY_ID,
  });

  const enriched = await getAddressEnriched(ADDRESS);
  if (
    !enriched.address ||
    enriched.address.toLowerCase() !== ADDRESS.toLowerCase()
  ) {
    throw new Error(`Unexpected enriched response for ${ADDRESS}`);
  }

  const transfers = await getAddressTransfers(ADDRESS);
  if (!Array.isArray(transfers.transfers)) {
    throw new Error("Arkham transfers response is missing transfers array");
  }

  const entitySummary = await getEntitySummary(ENTITY_ID);
  if (!entitySummary) {
    throw new Error(`Arkham entity summary returned null for ${ENTITY_ID}`);
  }

  console.log(
    JSON.stringify(
      {
        address: ADDRESS,
        enriched: {
          address: enriched.address,
          chain: enriched.chain,
          entity:
            enriched.arkhamEntity?.name ??
            enriched.predictedEntity?.name ??
            null,
          label: enriched.arkhamLabel?.name ?? null,
          tags: enriched.populatedTags?.length ?? 0,
        },
        transfers: summarizeTransfers(
          transfers.transfers.length,
          transfers.transfers[0] ?? null,
        ),
        entitySummary: {
          entityId: entitySummary.entityId,
          balanceUsd: entitySummary.balanceUsd,
          volumeUsd: entitySummary.volumeUsd,
          numAddresses: entitySummary.numAddresses,
        },
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
    logger.error("Live Arkham check failed", { error });
    return shutdown(1);
  });
