import { z } from "zod";

// ─── Request schemas ───────────────────────────────────────────────────────────

export const analyzeBodySchema = z.object({
  address: z
    .string()
    .regex(/^0x[a-fA-F0-9]{40}$/, "Invalid EVM wallet address"),
});

// ─── Response schemas ──────────────────────────────────────────────────────────

const entitySchema = z
  .object({
    id: z.string(),
    name: z.string(),
    type: z.string(),
    twitter: z.string().nullable(),
    website: z.string().nullable(),
    isPredicted: z.boolean(),
  })
  .nullable();

const tagSchema = z.object({
  id: z.string(),
  label: z.string(),
});

const transferItemSchema = z.object({
  timestamp: z.string(),
  from: z.string(),
  fromEntity: z.string().nullable(),
  to: z.string(),
  toEntity: z.string().nullable(),
  amount: z.number(),
  amountUSD: z.number(),
  token: z.string(),
  txHash: z.string(),
});

export const analyzeResponseSchema = z.object({
  data: z.object({
    address: z.string(),
    chain: z.string(),
    entity: entitySchema,
    label: z.string().nullable(),
    tags: z.array(tagSchema),
    riskScore: z.number(),
    isContract: z.boolean(),
    isService: z.boolean(),
    summary: z.string(),
    transfers: z.object({
      count: z.number(),
      transfers: z.array(transferItemSchema),
    }),
    generatedAt: z.string(),
  }),
});

// ─── Inferred types ────────────────────────────────────────────────────────────

export type AnalyzeBody = z.infer<typeof analyzeBodySchema>;
export type AnalyzeResponse = z.infer<typeof analyzeResponseSchema>;