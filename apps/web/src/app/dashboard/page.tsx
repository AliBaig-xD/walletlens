"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { ENDPOINTS } from "@/lib/api/endpoints";
import type { PaginatedReports, StoredReport } from "@/lib/api/types";
import { TYPE_CONFIG } from "@/lib/constants";

function ReportSkeleton() {
  return (
    <div className="bg-[#0d1117] border border-[#1e2a38] rounded-xl p-5 animate-pulse">
      <div className="flex flex-col md:flex-row gap-4 md:gap-0 justify-between items-center md:items-start">
        <div className="flex items-center gap-3">
          <div className="h-6 w-20 bg-[#1e2a38] rounded-full" />
          <div className="h-4 w-40 bg-[#1e2a38] rounded" />
        </div>
        <div className="flex items-center gap-6">
          <div className="h-8 w-16 bg-[#1e2a38] rounded" />
          <div className="h-8 w-16 bg-[#1e2a38] rounded" />
          <div className="h-8 w-16 bg-[#1e2a38] rounded-lg" />
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { status } = useSession();
  const [reports, setReports] = useState<StoredReport[]>([]);
  const [pagination, setPagination] = useState<
    PaginatedReports["pagination"] | null
  >(null);
  const [page, setPage] = useState(1);
  // Three loading states — prevents blink
  const [loadState, setLoadState] = useState<"idle" | "loading" | "done">(
    "idle",
  );

  useEffect(() => {
    if (status !== "authenticated") return;

    setLoadState("loading");
    fetch(ENDPOINTS.reports.list(page), { credentials: "include" })
      .then((r) => r.json())
      .then((data: PaginatedReports) => {
        setReports(data.data ?? []);
        setPagination(data.pagination ?? null);
        setLoadState("done");
      })
      .catch(() => setLoadState("done"));
  }, [status, page]);

  if (status === "unauthenticated") {
    return (
      <main className="min-h-screen bg-[#080b10] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-3">
            Connect wallet to view history
          </h1>
          <p className="text-gray-500 text-sm mb-6">
            Your reports are stored privately, linked to your wallet.
          </p>
          <ConnectButton />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#080b10] text-white px-8 py-12">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-10">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">
              History
            </p>
            <h1 className="text-4xl font-black">Your Reports</h1>
          </div>
          <Link
            href="/"
            className="bg-[#00d4aa] text-black px-5 py-3 rounded-xl font-bold hover:bg-[#00b894] transition-colors text-sm"
          >
            + New Query
          </Link>
        </div>

        {/* Loading — skeletons, no blink */}
        {(loadState === "idle" || loadState === "loading") && (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <ReportSkeleton key={i} />
            ))}
          </div>
        )}

        {/* Empty */}
        {loadState === "done" && reports.length === 0 && (
          <div className="text-center py-20">
            <p className="text-gray-500 mb-4">No reports yet.</p>
            <Link href="/" className="text-[#00d4aa] hover:underline text-sm">
              Run your first query →
            </Link>
          </div>
        )}

        {/* Reports */}
        {loadState === "done" && reports.length > 0 && (
          <>
            <div className="space-y-3">
              {reports.map((report) => {
                const config =
                  TYPE_CONFIG[report.reportType] ?? TYPE_CONFIG.analyze;
                return (
                  <div
                    key={report.id}
                    className="bg-[#0d1117] border border-[#1e2a38] rounded-xl p-5 hover:border-[#2a3a4a] transition-colors"
                  >
                    <div className="flex flex-col md:flex-row gap-4 md:gap-0 justify-between items-center  md:items-start">
                      <div className="flex items-center gap-3">
                        <span
                          className={`text-xs font-bold px-2 py-1 rounded-full border ${config.color}`}
                        >
                          {config.label}
                        </span>
                        <code className="font-mono text-sm text-[#00d4aa]">
                          {report.address.slice(0, 10)}...
                          {report.address.slice(-8)}
                        </code>
                      </div>

                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <div className="text-xs text-gray-500">Cost</div>
                          <div className="text-sm font-bold text-[#00d4aa]">
                            {report.amountPaid ? `$${report.amountPaid}` : "—"}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-gray-500">Date</div>
                          <div className="text-sm">
                            {new Date(report.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                        {/* Links to /history/[id] — no payment triggered */}
                        <Link
                          href={`/history/${report.id}`}
                          className="text-xs bg-[#1e2a38] hover:bg-[#2a3a4a] px-4 py-2 rounded-lg transition-colors whitespace-nowrap"
                        >
                          View →
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="flex justify-between items-center mt-8">
                <button
                  onClick={() => setPage((p) => p - 1)}
                  disabled={!pagination.hasPrev}
                  className="text-sm text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  ← Previous
                </button>
                <span className="text-xs text-gray-500">
                  Page {pagination.page} of {pagination.totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => p + 1)}
                  disabled={!pagination.hasNext}
                  className="text-sm text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  Next →
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
