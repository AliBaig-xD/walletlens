"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
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
            <div
              className="prose prose-invert prose-sm max-w-none
              prose-headings:font-bold
              prose-h1:text-xl prose-h1:text-[#00d4aa] prose-h1:border-b prose-h1:border-[#1e2a38] prose-h1:pb-3 prose-h1:mb-6
              prose-h2:text-base prose-h2:text-white prose-h2:mt-8 prose-h2:mb-4
              prose-p:text-gray-300 prose-p:leading-relaxed prose-p:my-3
              prose-strong:text-white prose-strong:font-semibold
              prose-code:text-[#00d4aa] prose-code:bg-[#080b10] prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-xs prose-code:before:content-none prose-code:after:content-none
              prose-table:w-full prose-table:border-collapse prose-table:my-4
              prose-thead:bg-[#080b10]
              prose-th:border prose-th:border-[#1e2a38] prose-th:p-3 prose-th:text-left prose-th:text-xs prose-th:font-bold prose-th:text-gray-400 prose-th:uppercase prose-th:tracking-wider
              prose-td:border prose-td:border-[#1e2a38] prose-td:p-3 prose-td:text-xs prose-td:text-gray-300
              prose-hr:border-[#1e2a38] prose-hr:my-8
              prose-li:text-gray-300 prose-li:my-1
              prose-blockquote:border-l-[#00d4aa] prose-blockquote:text-gray-400
              prose-a:text-[#00d4aa] prose-a:no-underline hover:prose-a:underline"
            >
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {data.markdown}
              </ReactMarkdown>
            </div>

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
