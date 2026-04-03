import { v4 as uuidv4 } from "uuid";
import { redis } from "../config/redis.js";
import { logger } from "./logger.js";

const NONCE_TTL_SECONDS = 300; // 5 minutes

export async function generateNonce(address: string): Promise<string> {
  const nonce = uuidv4();
  const key = `siwe:nonce:${address.toLowerCase()}`;
  await redis.set(key, nonce, "EX", NONCE_TTL_SECONDS);
  logger.debug("Generated SIWE nonce", { address });
  return nonce;
}

// GETDEL is atomic — prevents the same nonce being used twice concurrently
export async function verifyAndConsumeNonce(
  address: string,
  nonce: string,
): Promise<boolean> {
  const key = `siwe:nonce:${address.toLowerCase()}`;
  const stored = await redis.getdel(key);
  if (!stored) {
    logger.warn("Nonce not found or expired", { address });
    return false;
  }
  if (stored !== nonce) {
    logger.warn("Nonce mismatch", { address });
    return false;
  }
  return true;
}
