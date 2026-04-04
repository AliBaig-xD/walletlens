import { z } from "zod";

export const reportParamSchema = z.object({
  id: z.string().transform(Number).pipe(z.number().int().positive()),
});

export const reportsQuerySchema = z.object({
  page: z
    .string()
    .transform(Number)
    .pipe(z.number().int().min(1))
    .optional()
    .default("1" as any),
  limit: z
    .string()
    .transform(Number)
    .pipe(z.number().int().min(1).max(50))
    .optional()
    .default("20" as any),
});

const reportItemSchema = z.object({
  id: z.number(),
  address: z.string(),
  reportType: z.string(),
  summary: z.string().nullable(),
  txHash: z.string().nullable(),
  amountPaid: z.string().nullable(),
  network: z.string().nullable(),
  createdAt: z.string().datetime(),
});

export const reportsListResponseSchema = z.object({
  data: z.array(reportItemSchema),
  pagination: z.object({
    page: z.number(),
    limit: z.number(),
    total: z.number(),
    totalPages: z.number(),
    hasNext: z.boolean(),
    hasPrev: z.boolean(),
  }),
});

export type ReportParam = z.infer<typeof reportParamSchema>;
export type ReportsQuery = z.infer<typeof reportsQuerySchema>;
export type ReportsListResponse = z.infer<typeof reportsListResponseSchema>;
