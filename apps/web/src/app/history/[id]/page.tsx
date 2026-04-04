"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ENDPOINTS } from "@/lib/api/endpoints";
import type {
  StoredReport,
  AnalyzeData,
  TransfersData,
  Transfer,
} from "@/lib/api/types";

export default function HistoryPage() {
  const { id } = useParams() as { id: string };
  const [report, setReport] = useState<StoredReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(ENDPOINTS.reports.byId(Number(id)), { credentials: "include" })
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok) throw new Error(data?.error?.message ?? "Not found");
        setReport(data.data);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <HistoryLoading />;
  if (error || !report) return <HistoryError error={error} />;

  return (
    <main className="min-h-screen bg-[#080b10] text-white px-8 py-12">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <Link
            href="/dashboard"
            className="text-xs text-gray-500 hover:text-white"
          >
            ← Dashboard
          </Link>
          <div className="flex items-center gap-3 text-xs text-gray-500">
            <span className="uppercase tracking-widest">
              {TYPE_LABEL[report.reportType]}
            </span>
            <span>·</span>
            <span>{new Date(report.createdAt).toLocaleString()}</span>
            {report.amountPaid && (
              <>
                <span>·</span>
                <span className="text-[#00d4aa]">
                  ${report.amountPaid} USDC
                </span>
              </>
            )}
          </div>
        </div>

        {report.reportType === "analyze" && (
          <AnalyzeView
            data={
              report.result as {
                intel: AnalyzeData;
                transfers: TransfersData["transfers"];
              }
            }
            summary={report.summary}
            address={report.address}
          />
        )}

        {report.reportType === "transfers" && (
          <TransfersView
            data={
              report.result as { transfers: TransfersData; timeLast: string }
            }
            address={report.address}
          />
        )}

        {report.reportType === "report" && report.markdown && (
          <ReportView markdown={report.markdown} />
        )}

        <div className="mt-8 pt-6 border-t border-[#1e2a38] flex justify-between items-center">
          <span className="text-xs text-gray-600">Report #{report.id}</span>
          <Link
            href={`/analyze/${report.address}`}
            className="text-xs text-[#00d4aa] hover:underline"
          >
            Fresh analysis — $0.10 →
          </Link>
        </div>
      </div>
    </main>
  );
}

const TYPE_LABEL: Record<string, string> = {
  analyze: "Analysis",
  transfers: "Transfer History",
  report: "Full Report",
};

// ── Sub-renderers ──────────────────────────────────────────────────────────────

function AnalyzeView({
  data,
  summary,
  address,
}: {
  data: { intel: AnalyzeData; transfers: Transfer[] };
  summary: string | null;
  address: string;
}) {
  const intel = data.intel;
  if (!intel)
    return <p className="text-gray-500 text-sm">No data available.</p>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-black mb-2">
          {intel.entity?.name ?? "Unknown Wallet"}
        </h1>
        <p className="font-mono text-sm text-gray-500">{address}</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            label: "Entity",
            value: intel.entity?.name ?? "Unknown",
            sub: intel.entity?.type,
          },
          { label: "Chain", value: intel.chain },
          { label: "Risk Score", value: `${intel.riskScore}/100` },
          { label: "Type", value: intel.isContract ? "Contract" : "EOA" },
        ].map((c) => (
          <div
            key={c.label}
            className="bg-[#0d1117] border border-[#1e2a38] rounded-xl p-4"
          >
            <div className="text-xs text-gray-500 mb-1">{c.label}</div>
            <div className="font-bold text-sm">{c.value}</div>
            {c.sub && <div className="text-xs text-gray-500">{c.sub}</div>}
          </div>
        ))}
      </div>

      {intel.tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {intel.tags.slice(0, 8).map((tag) => (
            <span
              key={tag.id}
              className="px-3 py-1 bg-[#0d1117] border border-[#1e2a38] rounded-full text-xs text-gray-400"
            >
              {tag.label}
            </span>
          ))}
        </div>
      )}

      {summary && (
        <div className="bg-[#0d1117] border border-[#1e2a38] rounded-xl p-6">
          <h2 className="text-xs font-bold text-[#00d4aa] uppercase tracking-widest mb-4">
            AI Analysis
          </h2>
          <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-line">
            {summary}
          </p>
        </div>
      )}
    </div>
  );
}

function TransfersView({
  data,
  address,
}: {
  data: { transfers: TransfersData; timeLast: string };
  address: string;
}) {
  const transfers = data.transfers?.transfers ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-black mb-2">Transfer History</h1>
        <p className="font-mono text-sm text-gray-500">{address}</p>
      </div>

      <div className="bg-[#0d1117] border border-[#1e2a38] rounded-xl p-6">
        <div className="text-xs text-gray-500 mb-4">
          {transfers.length} transfers · last {data.timeLast}
        </div>
        <table className="w-full text-xs">
          <thead>
            <tr className="text-gray-500 border-b border-[#1e2a38]">
              <th className="text-left py-2 pr-4">Time</th>
              <th className="text-left py-2 pr-4">From</th>
              <th className="text-left py-2 pr-4">To</th>
              <th className="text-right py-2">Amount</th>
            </tr>
          </thead>
          <tbody>
            {transfers.map((t: Transfer, i: number) => (
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
                <td className="py-2 text-right">
                  {t.amount.toFixed(4)} {t.token}
                  <span className="text-gray-500 ml-1">
                    (${t.amountUSD.toFixed(2)})
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ReportView({ markdown }: { markdown: string }) {
  return (
    <div className="bg-[#0d1117] border border-[#1e2a38] rounded-2xl overflow-hidden">
      <div className="h-1 bg-linear-to-r from-[#00d4aa] to-[#00b894]" />
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
          prose-tr:border-b prose-tr:border-[#1e2a38] even:prose-tr:bg-[#080b10]
          prose-hr:border-[#1e2a38] prose-hr:my-8
          prose-li:text-gray-300 prose-li:my-1
          prose-ul:my-3 prose-ol:my-3
          prose-blockquote:border-l-[#00d4aa] prose-blockquote:text-gray-400 prose-blockquote:not-italic
          prose-a:text-[#00d4aa] prose-a:no-underline hover:prose-a:underline"
        >
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{markdown}</ReactMarkdown>
        </div>
      </div>
    </div>
  );
}

// ── Loading / Error states ─────────────────────────────────────────────────────

function HistoryLoading() {
  return (
    <div className="min-h-screen bg-[#080b10] flex items-center justify-center">
      {/* Skeleton */}
      <div className="max-w-5xl w-full mx-auto px-8 py-12 animate-pulse space-y-6">
        <div className="h-4 w-24 bg-[#1e2a38] rounded" />
        <div className="h-12 w-64 bg-[#1e2a38] rounded" />
        <div className="grid grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-20 bg-[#1e2a38] rounded-xl" />
          ))}
        </div>
        <div className="h-40 bg-[#1e2a38] rounded-xl" />
      </div>
    </div>
  );
}

function HistoryError({ error }: { error: string | null }) {
  return (
    <div className="min-h-screen bg-[#080b10] flex items-center justify-center">
      <div className="bg-[#0d1117] border border-red-900/30 rounded-xl p-8 text-center">
        <p className="text-red-400 mb-4">{error ?? "Report not found"}</p>
        <Link
          href="/dashboard"
          className="text-[#00d4aa] hover:underline text-sm"
        >
          ← Back to dashboard
        </Link>
      </div>
    </div>
  );
}
