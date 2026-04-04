import { ACTION } from "@/types/pages";

export const ACTIONS: ACTION[] = [
  {
    id: "analyze",
    label: "Analyze",
    price: "$0.10",
    description: "Entity attribution, risk score, AI summary",
    path: (address: string) => `/analyze/${address}`,
  },
  {
    id: "transfers",
    label: "Transfers",
    price: "$0.05",
    description: "Last 30d transfer flows and counterparties",
    path: (address: string) => `/transfers/${address}`,
  },
  {
    id: "report",
    label: "Full Report",
    price: "$1.00",
    description: "Complete intelligence report with markdown",
    path: (address: string) => `/report/${address}`,
  },
];

export const TYPE_CONFIG: Record<string, { label: string; color: string }> = {
  analyze: {
    label: "Analysis",
    color: "text-blue-400 bg-blue-900/20 border-blue-800/30",
  },
  transfers: {
    label: "Transfers",
    color: "text-yellow-400 bg-yellow-900/20 border-yellow-800/30",
  },
  report: {
    label: "Full Report",
    color: "text-[#00d4aa] bg-[#00d4aa]/10 border-[#00d4aa]/20",
  },
};
