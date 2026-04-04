"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useX402Fetch } from "@/lib/x402";
import { LoadingView } from "@/components/ui/loading-view";
import { NoWalletView } from "@/components/ui/no-wallet-view";
import { ErrorView } from "@/components/ui/error-view";
import { ENDPOINTS } from "@/lib/api/endpoints";
import type { TransfersData, Transfer } from "@/lib/api/types";

type PageState =
  | { status: "loading" }
  | { status: "no-wallet" }
  | { status: "done"; data: TransfersData }
  | { status: "error"; message: string };

export default function TransfersPage() {
  const { address } = useParams() as { address: string };
  const x402Fetch = useX402Fetch();
  const [state, setState] = useState<PageState>({ status: "loading" });

  useEffect(() => {
    if (!x402Fetch) {
      setState({ status: "no-wallet" });
      return;
    }

    const run = async () => {
      try {
        const res = await x402Fetch(ENDPOINTS.analyze.transfers, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ address, timeLast: "30d" }),
          credentials: "include",
        });
        const data = await res.json();
        if (!res.ok)
          throw new Error(data?.error?.message ?? `HTTP ${res.status}`);
        setState({ status: "done", data: data.data });
      } catch (err) {
        setState({
          status: "error",
          message: err instanceof Error ? err.message : "Failed",
        });
      }
    };

    void run();
  }, [x402Fetch, address]);

  if (state.status === "loading")
    return <LoadingView message="Fetching transfers... $0.05 USDC" />;
  if (state.status === "no-wallet") return <NoWalletView />;
  if (state.status === "error") return <ErrorView error={state.message} />;

  const { data } = state;

  return (
    <main className="min-h-screen bg-[#080b10] text-white px-8 py-12">
      <div className="max-w-5xl mx-auto">
        <Link
          href={`/analyze/${address}`}
          className="text-xs text-gray-500 hover:text-white mb-6 block"
        >
          ← Back to analysis
        </Link>
        <h1 className="text-3xl font-black mb-2">Transfer History</h1>
        <p className="font-mono text-sm text-gray-500 mb-8">{address}</p>

        <div className="bg-[#0d1117] border border-[#1e2a38] rounded-xl p-6">
          <div className="flex justify-between items-center mb-4">
            <span className="text-xs text-gray-500">
              {data.count} transfers · last {data.timeLast}
            </span>
            <span className="text-xs text-gray-600">
              Generated {new Date(data.generatedAt).toLocaleString()}
            </span>
          </div>

          {data.transfers.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-8">
              No transfers found in this period.
            </p>
          ) : (
            <table className="w-full text-xs">
              <thead>
                <tr className="text-gray-500 border-b border-[#1e2a38]">
                  <th className="text-left py-2 pr-4">Time</th>
                  <th className="text-left py-2 pr-4">From</th>
                  <th className="text-left py-2 pr-4">To</th>
                  <th className="text-left py-2 pr-4">Token</th>
                  <th className="text-right py-2">Amount</th>
                </tr>
              </thead>
              <tbody>
                {data.transfers.map((t: Transfer, i: number) => (
                  <tr
                    key={t.txHash ?? i}
                    className="border-b border-[#0f161f] hover:bg-[#0f161f]"
                  >
                    <td className="py-2 pr-4 text-gray-500">
                      {new Date(t.timestamp).toLocaleString()}
                    </td>
                    <td className="py-2 pr-4">
                      {t.fromEntity ?? t.from.slice(0, 8) + "..."}
                    </td>
                    <td className="py-2 pr-4">
                      {t.toEntity ?? t.to.slice(0, 8) + "..."}
                    </td>
                    <td className="py-2 pr-4 text-gray-400">{t.token}</td>
                    <td className="py-2 text-right">
                      {t.amount.toFixed(4)}
                      <span className="text-gray-500 ml-1">
                        (${t.amountUSD.toFixed(2)})
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </main>
  );
}
