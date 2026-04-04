const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

export const ENDPOINTS = {
  auth: {
    nonce: (address: string) =>
      `${API_BASE}/api/v1/auth/nonce?address=${address}` as const,
    verify: `${API_BASE}/api/v1/auth/verify` as const,
    refresh: `${API_BASE}/api/v1/auth/refresh` as const,
    logout: `${API_BASE}/api/v1/auth/logout` as const,
    me: `${API_BASE}/api/v1/auth/me` as const,
  },
  analyze: {
    analyze: `${API_BASE}/api/v1/analyze` as const,
    transfers: `${API_BASE}/api/v1/transfers` as const,
    report: `${API_BASE}/api/v1/report` as const,
  },
  reports: {
    list: (page = 1, limit = 5) =>
      `${API_BASE}/api/v1/reports?page=${page}&limit=${limit}` as const,
    byId: (id: number) => `${API_BASE}/api/v1/reports/${id}` as const,
  },
} as const;
