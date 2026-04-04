export const ENDPOINTS = {
  auth: {
    nonce: (address: string) =>
      `/api/v1/auth/nonce?address=${address}` as const,
    verify: "/api/v1/auth/verify" as const,
    refresh: "/api/v1/auth/refresh" as const,
    logout: "/api/v1/auth/logout" as const,
    me: "/api/v1/auth/me" as const,
  },
} as const;
