import { z } from "zod";

// ─── Request schemas ───────────────────────────────────────────────────────────

export const nonceQuerySchema = z.object({
  address: z.string().regex(/^0x[a-fA-F0-9]{40}$/i, "Invalid Ethereum address"),
});

export const verifyBodySchema = z.object({
  message: z.string().min(1),
  signature: z.string().regex(/^0x[a-fA-F0-9]{130}$/i, "Invalid signature"),
  address: z.string().regex(/^0x[a-fA-F0-9]{40}$/i, "Invalid Ethereum address"),
});

export const refreshBodySchema = z.object({
  refreshToken: z.string().min(1),
});

// ─── Response schemas ──────────────────────────────────────────────────────────

export const nonceResponseSchema = z.object({
  data: z.object({ nonce: z.string().uuid() }),
});

const userSchema = z.object({
  id: z.number(),
  walletAddress: z.string(),
  role: z.enum(["USER", "ADMIN"]),
  createdAt: z.string().datetime(),
});

const sessionSchema = z.object({
  id: z.number(),
  expiresAt: z.string().datetime(),
  refreshTokenExpiresAt: z.string().datetime().nullable(),
});

export const verifyResponseSchema = z.object({
  data: z.object({
    token: z.string(),
    refreshToken: z.string(),
    user: userSchema,
    session: sessionSchema,
  }),
});

export const refreshResponseSchema = z.object({
  data: z.object({
    token: z.string(),
    refreshToken: z.string(),
  }),
});

// ─── Inferred types ────────────────────────────────────────────────────────────

export type NonceQuery = z.infer<typeof nonceQuerySchema>;
export type VerifyBody = z.infer<typeof verifyBodySchema>;
export type RefreshBody = z.infer<typeof refreshBodySchema>;
export type NonceResponse = z.infer<typeof nonceResponseSchema>;
export type VerifyResponse = z.infer<typeof verifyResponseSchema>;
export type RefreshResponse = z.infer<typeof refreshResponseSchema>;
