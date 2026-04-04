import { arkhamGet } from "../../../utils/arkham.util.js";
import {
  ArkhamEnrichedResponse,
  ArkhamEntitySummary,
  ArkhamTransfersResponse,
} from "../../../types/arkham.js";

export async function getAddressEnriched(
  address: string,
): Promise<ArkhamEnrichedResponse> {
  return arkhamGet<ArkhamEnrichedResponse>(
    `/intelligence/address_enriched/${address}`,
    `enriched:${address.toLowerCase()}`,
  );
}

export async function getAddressTransfers(
  address: string,
  timeLast = "24h",
): Promise<ArkhamTransfersResponse> {
  const data = await arkhamGet<ArkhamTransfersResponse>(
    `/transfers?base=${address}&timeLast=${timeLast}&limit=50&sortKey=time&sortDir=desc`,
    `transfers:${address.toLowerCase()}:${timeLast}`,
  );
  return {
    transfers: data.transfers ?? [],
  };
}

// Optional — called only if arkhamEntity.id is present
export async function getEntitySummary(
  entityId: string,
): Promise<ArkhamEntitySummary | null> {
  try {
    return await arkhamGet<ArkhamEntitySummary>(
      `/intelligence/entity/${entityId}/summary`,
      `entity:${entityId}`,
    );
  } catch {
    // Entity summary is optional — don't fail the whole request
    return null;
  }
}
