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
    description: "Last 24h transfer flows and counterparties",
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