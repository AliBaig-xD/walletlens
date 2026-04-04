// Mirrors analyze.schema.ts inferred types exactly

export type Entity = {
  id: string;
  name: string;
  type: string;
  twitter: string | null;
  website: string | null;
  isPredicted: boolean;
} | null;

export type Tag = {
  id: string;
  label: string;
};

export type Transfer = {
  timestamp: string;
  from: string;
  fromEntity: string | null;
  to: string;
  toEntity: string | null;
  amount: number;
  amountUSD: number;
  token: string;
  txHash: string;
};

export type AnalyzeData = {
  address: string;
  chain: string;
  entity: Entity;
  label: string | null;
  tags: Tag[];
  riskScore: number;
  isContract: boolean;
  isService: boolean;
  summary: string;
  transfers: {
    count: number;
    transfers: Transfer[];
  };
  generatedAt: string;
};

export type TransfersData = {
  address: string;
  timeLast: string;
  count: number;
  transfers: Transfer[];
  generatedAt: string;
};

export type ReportData = {
  reportId: number;
  address: string;
  chain: string;
  entity: Entity;
  label: string | null;
  tags: Tag[];
  riskScore: number;
  summary: string;
  markdown: string;
  generatedAt: string;
};

// What GET /api/v1/reports/:id returns
export type StoredReport = {
  id: number;
  address: string;
  reportType: "analyze" | "transfers" | "report";
  summary: string | null;
  result: unknown; // raw JSON blob
  markdown: string | null;
  txHash: string | null;
  amountPaid: string | null;
  network: string | null;
  createdAt: string;
};

export type PaginatedReports = {
  data: StoredReport[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
};
