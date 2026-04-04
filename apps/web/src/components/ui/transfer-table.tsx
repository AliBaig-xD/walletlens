import { Transfer } from "@/lib/api/types";
import { GraphIcon, TableIcon } from "./icons";
import { TransferGraph } from "./transfer-graph";
import { useState } from "react";

function tdStyle(color: string): React.CSSProperties {
  return {
    padding: "10px 16px",
    fontFamily: '"JetBrains Mono", monospace',
    fontSize: 11,
    color,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  };
}

export function TransfersTable({
  transfers,
  address,
  meta,
}: {
  transfers: Transfer[];
  address: string;
  /** e.g. "50 transfers · last 30d" */
  meta?: string;
}) {
  const [tab, setTab] = useState<"table" | "graph">("table");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Tab bar + meta */}
      <div style={{ display: "flex", alignItems: "center" }}>
        <div
          style={{
            display: "flex",
            background: "rgba(13,17,23,0.8)",
            border: "1px solid rgba(77,255,219,0.1)",
            borderRadius: 10,
            padding: 3,
            gap: 2,
          }}
        >
          {(["table", "graph"] as const).map((t) => {
            const active = tab === t;
            return (
              <button
                key={t}
                onClick={() => setTab(t)}
                style={{
                  fontFamily: '"JetBrains Mono", monospace',
                  fontSize: 10,
                  fontWeight: active ? 700 : 500,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase" as const,
                  color: active ? "#060c11" : "rgba(160,200,210,0.45)",
                  background: active ? "#4DFFDB" : "transparent",
                  border: "none",
                  borderRadius: 7,
                  padding: "6px 18px",
                  cursor: "pointer",
                  transition: "all 0.18s ease",
                  display: "flex",
                  alignItems: "center",
                  gap: 7,
                  boxShadow: active
                    ? "0 2px 12px rgba(77,255,219,0.25)"
                    : "none",
                }}
              >
                {t === "table" ? (
                  <TableIcon active={active} />
                ) : (
                  <GraphIcon active={active} />
                )}
                {t}
              </button>
            );
          })}
        </div>

        {meta && (
          <span
            style={{
              marginLeft: "auto",
              fontFamily: '"JetBrains Mono", monospace',
              fontSize: 9,
              color: "rgba(160,200,210,0.3)",
              letterSpacing: "0.1em",
              textTransform: "uppercase" as const,
            }}
          >
            {meta}
          </span>
        )}
      </div>

      {/* Table view */}
      {tab === "table" &&
        (transfers.length === 0 ? (
          <div
            style={{
              height: 420,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "#0d1117",
              border: "1px solid #1e2a38",
              borderRadius: 12,
              fontFamily: '"JetBrains Mono", monospace',
              fontSize: 11,
              color: "rgba(160,200,210,0.3)",
              letterSpacing: "0.08em",
            }}
          >
            No transfers found in this period.
          </div>
        ) : (
          <div
            style={{
              background: "#0d1117",
              border: "1px solid #1e2a38",
              borderRadius: 12,
              overflow: "hidden",
              height: 420,
              display: "flex",
              flexDirection: "column",
            }}
          >
            {/* Frozen header */}
            <div style={{ flexShrink: 0, borderBottom: "1px solid #1e2a38" }}>
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  tableLayout: "fixed",
                }}
              >
                <colgroup>
                  <col style={{ width: "22%" }} />
                  <col style={{ width: "20%" }} />
                  <col style={{ width: "20%" }} />
                  <col style={{ width: "10%" }} />
                  <col style={{ width: "28%" }} />
                </colgroup>
                <thead>
                  <tr>
                    {["Time", "From", "To", "Token", "Amount"].map((h, i) => (
                      <th
                        key={h}
                        style={{
                          fontFamily: '"JetBrains Mono", monospace',
                          fontSize: 9,
                          fontWeight: 600,
                          letterSpacing: "0.14em",
                          textTransform: "uppercase" as const,
                          color: "rgba(160,200,210,0.35)",
                          textAlign: i === 4 ? "right" : "left",
                          padding: "10px 16px",
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
              </table>
            </div>

            {/* Scrollable rows */}
            <div style={{ flex: 1, overflowY: "auto" }}>
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  tableLayout: "fixed",
                }}
              >
                <colgroup>
                  <col style={{ width: "22%" }} />
                  <col style={{ width: "20%" }} />
                  <col style={{ width: "20%" }} />
                  <col style={{ width: "10%" }} />
                  <col style={{ width: "28%" }} />
                </colgroup>
                <tbody>
                  {transfers.map((t: Transfer, i: number) => (
                    <tr
                      key={t.txHash ?? i}
                      style={{ borderBottom: "1px solid rgba(15,22,31,0.8)" }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.background = "#0f161f")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.background = "transparent")
                      }
                    >
                      <td style={tdStyle("rgba(160,200,210,0.4)")}>
                        {new Date(t.timestamp).toLocaleString()}
                      </td>
                      <td style={tdStyle("#a0c8d2")}>
                        {t.fromEntity ?? t.from.slice(0, 8) + "..."}
                      </td>
                      <td style={tdStyle("#a0c8d2")}>
                        {t.toEntity ?? t.to.slice(0, 8) + "..."}
                      </td>
                      <td style={tdStyle("rgba(160,200,210,0.55)")}>
                        {t.token}
                      </td>
                      <td style={{ ...tdStyle("#e2e8f0"), textAlign: "right" }}>
                        {t.amount.toFixed(4)}
                        <span
                          style={{
                            color: "rgba(160,200,210,0.35)",
                            marginLeft: 6,
                          }}
                        >
                          (${t.amountUSD.toFixed(2)})
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}

      {/* Graph view */}
      {tab === "graph" && transfers.length > 0 && (
        <TransferGraph transfers={transfers} address={address} />
      )}
    </div>
  );
}
