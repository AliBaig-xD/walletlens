"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useX402Fetch } from "@/hooks/useX402";
import { LoadingView } from "@/components/ui/loading-view";
import { NoWalletView } from "@/components/ui/no-wallet-view";
import { ErrorView } from "@/components/ui/error-view";
import { AnalyzeData, Transfer } from "@/lib/api/types";

type PageState =
  | { status: "loading" }
  | { status: "no-wallet" }
  | { status: "done"; data: AnalyzeData }
  | { status: "error"; message: string };

type Tag = { id: string; label: string };


export default function AnalyzePage() {
  const { address } = useParams() as { address: string };
  const { status } = useSession();
  const x402Fetch = useX402Fetch();
  const router = useRouter();
  const api = process.env.NEXT_PUBLIC_API_BASE_URL;

  const [state, setState] = useState<PageState>({ status: "loading" });
  const [generatingReport, setGeneratingReport] = useState(false);

  useEffect(() => {
    if (status === "loading") return;
    if (!x402Fetch) {
      setState({ status: "no-wallet" });
      return;
    }

    const run = async () => {
      try {
        const res = await x402Fetch(`${api}/api/v1/analyze`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ address }),
          credentials: "include",
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error?.message);
        setState({ status: "done", data: data.data });
      } catch (err) {
        setState({status:"error", message: err instanceof Error ? err.message : "Analysis failed"});  
      }
    };

    void run();
  }, [status, x402Fetch]);

  const handleReport = async () => {
    if (!x402Fetch) return;
    setGeneratingReport(true);
    try {
      const res = await x402Fetch(`${api}/api/v1/report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address }),
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error?.message);
      router.push(`/report/${address}?id=${data.data.reportId}`);
    } catch (err) {
      setState({status:"error", message: err instanceof Error ? err.message : "Report generation failed"});
    } finally {
      setGeneratingReport(false);
    }
  };
  const result = state.status === "done" ? state.data : null;

  if (state.status === "loading")
    return <LoadingView message="Analyzing wallet... $0.10 USDC" />;
  if (state.status === "no-wallet") return <NoWalletView />;
  if (state.status === "error") return <ErrorView error={state.message} />;
  if (!result) return <ErrorView error="No data" />;

  return (
    <main className="min-h-screen bg-[#080b10] text-white px-8 py-12">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-start mb-10">
          <div>
            <Link
              href="/"
              className="text-xs text-gray-500 hover:text-white mb-3 block"
            >
              ← New search
            </Link>
            <h1 className="text-4xl font-black">
              {result.entity?.name ?? "Unknown Wallet"}
              {result.entity?.isPredicted && (
                <span className="ml-3 text-sm text-yellow-500 font-normal">
                  (predicted)
                </span>
              )}
            </h1>
            <p className="font-mono text-sm text-gray-500 mt-2">
              {result.address}
            </p>
          </div>
          <button
            onClick={handleReport}
            disabled={generatingReport}
            className="bg-[#00d4aa] text-black px-6 py-3 rounded-xl font-bold hover:bg-[#00b894] disabled:opacity-50 transition-colors"
          >
            {generatingReport ? "Generating..." : "📄 Full Report — $1.00"}
          </button>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            {
              label: "Entity",
              value: result.entity?.name ?? "Unknown",
              sub: result.entity?.type,
            },
            { label: "Chain", value: result.chain },
            { label: "Risk Score", value: `${result.riskScore}/100` },
            { label: "Txns (24h)", value: String(result.transfers.count) },
          ].map((c) => (
            <div
              key={c.label}
              className="bg-[#0d1117] border border-[#1e2a38] rounded-xl p-4"
            >
              <div className="text-xs text-gray-500 mb-1">{c.label}</div>
              <div className="font-bold">{c.value}</div>
              {c.sub && <div className="text-xs text-gray-500">{c.sub}</div>}
            </div>
          ))}
        </div>

        {/* Tags */}
        {result.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-8">
            {result.tags.slice(0, 8).map((tag: Tag) => (
              <span
                key={tag.id}
                className="px-3 py-1 bg-[#0d1117] border border-[#1e2a38] rounded-full text-xs text-gray-400"
              >
                {tag.label}
              </span>
            ))}
          </div>
        )}

        {/* AI Summary */}
        <div className="bg-[#0d1117] border border-[#1e2a38] rounded-xl p-6 mb-8">
          <h2 className="text-xs font-bold text-[#00d4aa] uppercase tracking-widest mb-4">
            AI Analysis
          </h2>
          <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-line">
            {result.summary}
          </p>
        </div>

        {/* Transfers table */}
        <div className="bg-[#0d1117] border border-[#1e2a38] rounded-xl p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xs font-bold text-[#00d4aa] uppercase tracking-widest">
              Recent Transfers ({result.transfers.count})
            </h2>
            <Link
              href={`/transfers/${address}`}
              className="text-xs text-[#00d4aa] hover:underline"
            >
              Full transfer history — $0.05 →
            </Link>
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
              {result.transfers.transfers
                .slice(0, 10)
                .map((t: Transfer, i: number) => (
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
    </main>
  );
}
