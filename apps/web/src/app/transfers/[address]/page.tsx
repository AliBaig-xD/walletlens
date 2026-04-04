"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { LoadingView } from "@/components/ui/loading-view";
import { NoWalletView } from "@/components/ui/no-wallet-view";
import { ErrorView } from "@/components/ui/error-view";
import { ENDPOINTS } from "@/lib/api/endpoints";
import type { TransfersData } from "@/lib/api/types";
import { useGatedFetch } from "@/hooks/useGatedFetch";
import { TransfersTable } from "@/components/ui/transfer-table";

export default function TransfersPage() {
  const { address } = useParams() as { address: string };
  
  const state = useGatedFetch<TransfersData>({
    url: ENDPOINTS.analyze.transfers,
    body: { address, timeLast: "30d" },
  });

  if (state.status === "loading")
    return <LoadingView message="Fetching transfers... $0.05 USDC" />;
  if (state.status === "no-wallet") return <NoWalletView />;
  if (state.status === "error") return <ErrorView error={state.message} />;

  const { data } = state;

  const meta = `${data.count} transfers · last ${data.timeLast}`;

  return (
    <main className="min-h-screen bg-[#080b10] text-white px-8 py-12">
      <div className="max-w-5xl mx-auto space-y-8">
        <div>
          <Link
            href={`/analyze/${address}`}
            className="text-xs text-gray-500 hover:text-white mb-6 block"
          >
            ← Back to analysis
          </Link>
          <h1 className="text-3xl font-black mb-2">Transfer History</h1>
          <p className="font-mono text-sm text-gray-500">{address}</p>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            fontFamily: '"JetBrains Mono", monospace',
            fontSize: 9,
            color: "rgba(160,200,210,0.25)",
            letterSpacing: "0.08em",
          }}
        >
          Generated {new Date(data.generatedAt).toLocaleString()}
        </div>

        <TransfersTable
          transfers={data.transfers}
          address={address}
          meta={meta}
        />
      </div>
    </main>
  );
}
