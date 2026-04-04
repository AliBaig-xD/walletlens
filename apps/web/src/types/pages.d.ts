
// ─── API ACTIONS ──────────────────────────────────────────────────────────────────────

export type ActionID = "analyze" | "transfers" | "report";

export type ACTION = {
  id: ActionID;
  label: string;
  price: string;
  description: string;
  path: (address: string) => string;
};