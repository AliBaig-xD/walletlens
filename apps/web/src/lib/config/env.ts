/**
 * Environment Variables Validation
 * Validates and provides type-safe access to environment variables
 */

import { z } from "zod";

const envSchema = z.object({
  NEXT_PUBLIC_ALCHEMY_API_KEY: z.string().optional(),
  NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID: z.string().optional(),

  // API
  NEXT_PUBLIC_API_BASE_URL: z.string().url(),
  NEXT_PUBLIC_API_TIMEOUT: z
    .string()
    .transform(Number)
    .pipe(z.number().int().positive())
    .default("30000"),

  // App
  NEXT_PUBLIC_APP_NAME: z.string().default("WalletLens"),
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),

  NEXT_PUBLIC_X402_MAX_PAYMENT_USDC: z.string().default("10"),
});

// Parse and validate environment variables
const parseEnv = () => {
  const parsed = envSchema.safeParse({
    NEXT_PUBLIC_ALCHEMY_API_KEY: process.env.NEXT_PUBLIC_ALCHEMY_API_KEY,
    NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID:
      process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID,
    NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
    NEXT_PUBLIC_API_TIMEOUT: process.env.NEXT_PUBLIC_API_TIMEOUT,
    
    NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_X402_MAX_PAYMENT_USDC: process.env.NEXT_PUBLIC_X402_MAX_PAYMENT_USDC,
  });

  if (!parsed.success) {
    console.error(
      "❌ Invalid environment variables:",
      parsed.error.flatten().fieldErrors,
    );
    throw new Error("Invalid environment variables");
  }

  return parsed.data;
};

// Export typed environment variables
export const env = parseEnv();

// Type for the environment object
export type Env = z.infer<typeof envSchema>;
