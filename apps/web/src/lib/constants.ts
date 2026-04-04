export type ActionID = "analyze" | "transfers" | "report";

export type ACTION = {
  id: ActionID;
  label: string;
  price: string;
  description: string;
  path: (address: string) => string;
};

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