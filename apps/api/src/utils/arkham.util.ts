import { env } from "../config/env.js";
import { redis } from "../config/redis.js";
import { logger } from "./logger.js";
import {
  ArkhamEnrichedResponse,
  ArkhamTransfersResponse,
} from "../types/arkham.js";

const ARKHAM_HEADERS = {
  "API-Key": env.ARKHAM_API_KEY,
  "Content-Type": "application/json",
};

// ─── Cache helpers ─────────────────────────────────────────────────────────────

async function getCached<T>(key: string): Promise<T | null> {
  try {
    const raw = await redis.get(`arkham:${key}`);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

async function setCache(key: string, data: unknown): Promise<void> {
  try {
    await redis.set(
      `arkham:${key}`,
      JSON.stringify(data),
      "EX",
      env.ARKHAM_CACHE_TTL_SECONDS,
    );
  } catch (error) {
    logger.warn("Arkham cache write failed", { key, error });
  }
}

export async function arkhamGet<T>(
  path: string,
  cacheKey?: string,
): Promise<T> {
  if (cacheKey) {
    const cached = await getCached<T>(cacheKey);
    if (cached) {
      logger.debug("Arkham cache hit", { cacheKey });
      return cached;
    }
  }

  const response = await fetch(`${env.ARKHAM_BASE_URL}${path}`, {
    headers: ARKHAM_HEADERS,
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "unknown");
    throw new Error(`Arkham API ${response.status}: ${errorText}`);
  }

  const data = (await response.json()) as T;

  if (cacheKey) {
    await setCache(cacheKey, data);
  }

  return data;
}

// ─── Data processing ───────────────────────────────────────────────────────────

function cleanTagLabel(label: string): string {
  return label
    .replace(/\{[^}]+\}/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

// ─── Risk score ────────────────────────────────────────────────────────────────
// Uses populatedTags from the enriched endpoint (not a top-level tags field)

export function computeRiskScore(intel: ArkhamEnrichedResponse): number {
  const tags =
    intel.populatedTags?.map((t) => cleanTagLabel(t.label).toLowerCase()) ?? [];
  let score = 0;

  if (tags.some((t) => t.includes("sanction") || t.includes("ofac")))
    score += 40;
  if (tags.some((t) => t.includes("hacker") || t.includes("exploit")))
    score += 35;
  if (tags.some((t) => t.includes("banned"))) score += 25;
  if (tags.some((t) => t.includes("mixer") || t.includes("tornado")))
    score += 20;
  if (tags.some((t) => t.includes("phish") || t.includes("scam"))) score += 30;

  // Known verified entity reduces risk
  if (intel.arkhamEntity) score = Math.max(0, score - 10);

  return Math.min(100, score);
}

// ─── Formatters ────────────────────────────────────────────────────────────────

export function formatIntel(intel: ArkhamEnrichedResponse) {
  const entity = intel.arkhamEntity ?? intel.predictedEntity ?? null;
  const isPredicted = !intel.arkhamEntity && !!intel.predictedEntity;

  return {
    address: intel.address,
    chain: intel.chain,
    entity: entity
      ? {
          id: entity.id,
          name: entity.name,
          type: entity.type,
          twitter: entity.twitter ?? null,
          website: entity.website ?? null,
          isPredicted,
        }
      : null,
    label: intel.arkhamLabel?.name ?? null,
    tags:
      intel.populatedTags?.map((t) => ({
        id: t.id,
        label: cleanTagLabel(t.label),
      })) ?? [],
    riskScore: computeRiskScore(intel),
    isContract: intel.contract,
    isService: intel.service ?? false,
  };
}

export function formatTransfers(data: ArkhamTransfersResponse) {
  return {
    count: data.transfers.length,
    transfers: data.transfers.map((t) => ({
      timestamp: t.blockTimestamp,
      from: t.fromAddress.address,
      fromEntity:
        t.fromAddress.arkhamEntity?.name ??
        t.fromAddress.arkhamLabel?.name ??
        null,
      to: t.toAddress.address,
      toEntity:
        t.toAddress.arkhamEntity?.name ?? t.toAddress.arkhamLabel?.name ?? null,
      amount: t.unitValue,
      amountUSD: t.historicalUSD,
      token: t.tokenSymbol,
      txHash: t.transactionHash,
    })),
  };
}
