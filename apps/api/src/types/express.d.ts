// Global Express type augmentations
// API request/response types live in src/api/v1/schemas/ as Zod inferred types

declare namespace Express {
  interface Request {
    user?: {
      id: number;
      userId: number;
      walletAddress: string;
      sessionId: number;
      role: string;
    };
  }
}