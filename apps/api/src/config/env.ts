import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform(Number).pipe(z.number().min(1000).max(65535)).default('4000'),
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'http', 'debug']).default('info'),
  CORS_ORIGINS: z.string().default('http://localhost:3000'),

  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url().default('redis://localhost:6379'),

  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('30d'),

  COOKIE_SECURE: z.string().transform((val: string) => val === 'true').default('false'),
  COOKIE_SAME_SITE: z.enum(['strict', 'lax', 'none']).default('lax'),
  COOKIE_DOMAIN: z.string().default('localhost'),

  MONKEPAY_API_KEY_ID: z.string(),
  MONKEPAY_API_KEY_SECRET: z.string(),
  NETWORK: z.enum(['base', 'base-sepolia']).default('base-sepolia'),

  ARKHAM_API_KEY: z.string(),
  ARKHAM_BASE_URL: z.string().url().default('https://api.arkm.com'),
  ARKHAM_CACHE_TTL_SECONDS: z.string().transform(Number).pipe(z.number().positive()).default('300'),

  ANTHROPIC_API_KEY: z.string(),

  RATE_LIMIT_WINDOW_MS: z.string().transform(Number).pipe(z.number().positive()).default('900000'),
  RATE_LIMIT_MAX_REQUESTS: z.string().transform(Number).pipe(z.number().positive()).default('100'),
});

export const env = envSchema.parse(process.env);
export type Env = z.infer<typeof envSchema>;