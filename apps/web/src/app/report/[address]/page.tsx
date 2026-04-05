"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import Markdown from "@/components/ui/markdown";
import { LoadingView } from "@/components/ui/loading-view";
import { NoWalletView } from "@/components/ui/no-wallet-view";
import { ErrorView } from "@/components/ui/error-view";
import { ENDPOINTS } from "@/lib/api/endpoints";
import type { ReportData } from "@/lib/api/types";
import { useGatedFetch } from "@/hooks/useGatedFetch";

export default function ReportPage() {
  const { address } = useParams() as { address: string };

  const state = useGatedFetch<ReportData>({
    url: ENDPOINTS.analyze.report,
    body: { address },
  });

  if (state.status === "loading")
    return <LoadingView message="Generating report... $1.00 USDC" />;
  if (state.status === "no-wallet") return <NoWalletView />;
  if (state.status === "error") return <ErrorView error={state.message} />;

  const { data } = state;

  return (
    <main className="min-h-screen bg-[#080b10] text-white">
      <div className="max-w-4xl mx-auto px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <Link
            href={`/analyze/${address}`}
            className="text-xs text-gray-500 hover:text-white"
          >
            ← Back to analysis
          </Link>
          <div className="flex gap-3">
            <button
              onClick={() =>
                navigator.clipboard.writeText(window.location.href)
              }
              className="text-xs text-gray-400 hover:text-white border border-[#1e2a38] rounded-lg px-3 py-2"
            >
              Copy Link
            </button>
            <button
              onClick={() => window.print()}
              className="text-xs text-gray-400 hover:text-white border border-[#1e2a38] rounded-lg px-3 py-2"
            >
              Print / PDF
            </button>
          </div>
        </div>

        <div className="bg-[#0d1117] border border-[#1e2a38] rounded-2xl overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-[#00d4aa] to-[#00b894]" />
          <div className="p-8 md:p-12">
            <Markdown>{data.markdown}</Markdown>

            <div className="mt-12 pt-6 border-t border-[#1e2a38] flex justify-between items-center text-xs text-gray-600">
              <span>Report #{data.reportId}</span>
              <Link
                href={`/analyze/${address}`}
                className="text-[#00d4aa] hover:underline"
              >
                Re-analyze →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
