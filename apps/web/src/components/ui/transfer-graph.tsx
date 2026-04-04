"use client";

import { useEffect, useRef, useState } from "react";
import type { Transfer } from "@/lib/api/types";

type Node = {
  id: string;
  label: string;
  isCenter: boolean;
  val: number;
};

type Link = {
  source: string;
  target: string;
  value: number;
  token: string;
};

type GraphData = {
  nodes: Node[];
  links: Link[];
};

type SelectedNode = {
  id: string;
  label: string;
  isCenter: boolean;
  sentUSD: number;
  receivedUSD: number;
  tokens: string[];
  txCount: number;
  screenX: number;
  screenY: number;
};

function buildGraphData(
  transfers: Transfer[],
  centerAddress: string,
): GraphData {
  const nodes = new Map<string, Node>();
  const links: Link[] = [];

  nodes.set(centerAddress.toLowerCase(), {
    id: centerAddress.toLowerCase(),
    label: "This wallet",
    isCenter: true,
    val: 8,
  });

  for (const t of transfers) {
    const fromId = t.from.toLowerCase();
    const toId = t.to.toLowerCase();

    if (!nodes.has(fromId)) {
      nodes.set(fromId, {
        id: fromId,
        label: t.fromEntity ?? t.from.slice(0, 6) + "..." + t.from.slice(-4),
        isCenter: false,
        val: 4,
      });
    }

    if (!nodes.has(toId)) {
      nodes.set(toId, {
        id: toId,
        label: t.toEntity ?? t.to.slice(0, 6) + "..." + t.to.slice(-4),
        isCenter: false,
        val: 4,
      });
    }

    links.push({
      source: fromId,
      target: toId,
      value: t.amountUSD,
      token: t.token,
    });
  }

  return { nodes: Array.from(nodes.values()), links };
}

function buildNodeStats(
  nodeId: string,
  transfers: Transfer[],
): Pick<SelectedNode, "sentUSD" | "receivedUSD" | "tokens" | "txCount"> {
  let sentUSD = 0;
  let receivedUSD = 0;
  const tokenSet = new Set<string>();
  let txCount = 0;

  for (const t of transfers) {
    const isFrom = t.from.toLowerCase() === nodeId;
    const isTo = t.to.toLowerCase() === nodeId;
    if (!isFrom && !isTo) continue;
    txCount++;
    tokenSet.add(t.token);
    if (isFrom) sentUSD += t.amountUSD ?? 0;
    if (isTo) receivedUSD += t.amountUSD ?? 0;
  }

  return { sentUSD, receivedUSD, tokens: Array.from(tokenSet), txCount };
}

function fmt(usd: number) {
  if (usd === 0) return "—";
  if (usd >= 1_000_000) return `$${(usd / 1_000_000).toFixed(2)}M`;
  if (usd >= 1_000) return `$${(usd / 1_000).toFixed(1)}K`;
  return `$${usd.toFixed(2)}`;
}

// ─── Main component ───────────────────────────────────────────────────────────

export function TransferGraph({
  transfers,
  address,
}: {
  transfers: Transfer[];
  address: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const graphRef = useRef<any>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [nodeCount, setNodeCount] = useState(0);
  const [edgeCount, setEdgeCount] = useState(0);
  const [selected, setSelected] = useState<SelectedNode | null>(null);

  useEffect(() => {
    if (!containerRef.current || transfers.length === 0) return;

    const loadGraph = async () => {
      const ForceGraph2D = (await import("force-graph")).default;
      if (!containerRef.current) return;

      const graphData = buildGraphData(transfers, address);
      setNodeCount(graphData.nodes.length);
      setEdgeCount(graphData.links.length);

      await new Promise((r) => requestAnimationFrame(r));
      if (!containerRef.current) return;

      const width = containerRef.current.clientWidth || 800;
      const height = 420;

      const fg = new ForceGraph2D(containerRef.current)
        .width(width)
        .height(height)
        .backgroundColor("#060c11")
        .nodeId("id")

        .nodeVal("val")
        .nodeRelSize(6)
        .nodeLabel("label")
        .linkWidth((link: any) =>
          Math.max(0.5, Math.log10((link.value ?? 0) + 1) * 0.9),
        )
        .linkColor(() => "rgba(77, 255, 219, 0.12)")
        .linkDirectionalArrowLength(5)
        .linkDirectionalArrowRelPos(1)
        .linkDirectionalArrowColor(() => "rgba(77, 255, 219, 0.4)")
        .linkDirectionalParticles(1)
        .linkDirectionalParticleWidth(1.5)
        .linkDirectionalParticleColor(() => "#4DFFDB")
        .linkDirectionalParticleSpeed(0.004)
        .onNodeClick((node: any, event: MouseEvent) => {
          const rect = containerRef.current!.getBoundingClientRect();
          const stats = buildNodeStats(node.id, transfers);
          setSelected({
            id: node.id,
            label: node.label,
            isCenter: node.isCenter,
            screenX: event.clientX - rect.left,
            screenY: event.clientY - rect.top,
            ...stats,
          });
        })
        .nodeCanvasObject(
          (node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
            if (!isFinite(node.x) || !isFinite(node.y)) return;

            const r = node.isCenter ? 9 : 5;

            if (node.isCenter) {
              const grd = ctx.createRadialGradient(
                node.x,
                node.y,
                r,
                node.x,
                node.y,
                r + 10,
              );
              grd.addColorStop(0, "rgba(77,255,219,0.18)");
              grd.addColorStop(1, "rgba(77,255,219,0)");
              ctx.beginPath();
              ctx.arc(node.x, node.y, r + 10, 0, 2 * Math.PI);
              ctx.fillStyle = grd;
              ctx.fill();
            }

            ctx.beginPath();
            ctx.arc(node.x, node.y, r, 0, 2 * Math.PI);
            ctx.fillStyle = node.isCenter ? "#4DFFDB" : "#0f2030";
            ctx.fill();
            ctx.strokeStyle = node.isCenter
              ? "rgba(77,255,219,0.9)"
              : "rgba(77,255,219,0.2)";
            ctx.lineWidth = node.isCenter ? 1.5 : 0.8;
            ctx.stroke();

            if (node.isCenter) {
              ctx.font = `${Math.max(7, 11 / globalScale)}px "JetBrains Mono", monospace`;
              ctx.fillStyle = "#4DFFDB";
              ctx.textAlign = "center";
              ctx.textBaseline = "top";
              ctx.fillText("This wallet", node.x, node.y + r + 3);
            }
          },
        )
        .graphData(graphData);

      graphRef.current = fg;
      setTimeout(() => setIsLoaded(true), 300);
    };

    void loadGraph();

    return () => {
      if (graphRef.current) graphRef.current._destructor?.();
      if (containerRef.current) containerRef.current.innerHTML = "";
      setIsLoaded(false);
      setSelected(null);
    };
  }, [transfers, address]);

  if (transfers.length === 0) return null;

  return (
    <>
      <style>{`
        @keyframes scanline {
          0%   { transform: translateY(-100%); opacity: 0; }
          10%  { opacity: 1; }
          90%  { opacity: 1; }
          100% { transform: translateY(420px); opacity: 0; }
        }
        @keyframes fadeInGraph { from { opacity: 0; } to { opacity: 1; } }
        @keyframes pulseRing {
          0%   { transform: scale(1); opacity: 0.6; }
          100% { transform: scale(2.4); opacity: 0; }
        }
        @keyframes popIn {
          0%   { opacity: 0; transform: scale(0.93) translateY(5px); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }
        .graph-container { animation: fadeInGraph 0.6s ease forwards; }
        .scan-line       { animation: scanline 3s ease-in-out infinite; animation-delay: 1s; }
        .node-popup      { animation: popIn 0.14s ease forwards; }
      `}</style>

      <div
        style={{
          background: "#060c11",
          border: "1px solid rgba(77,255,219,0.12)",
          borderRadius: 16,
          overflow: "hidden",
          position: "relative",
        }}
      >
        {/* Corner accents */}
        {["top-left", "top-right", "bottom-left", "bottom-right"].map((pos) => {
          const isTop = pos.includes("top");
          const isLeft = pos.includes("left");
          return (
            <div
              key={pos}
              style={{
                position: "absolute",
                [isTop ? "top" : "bottom"]: 0,
                [isLeft ? "left" : "right"]: 0,
                width: 18,
                height: 18,
                borderTop: isTop ? "1px solid rgba(77,255,219,0.45)" : "none",
                borderBottom: !isTop
                  ? "1px solid rgba(77,255,219,0.45)"
                  : "none",
                borderLeft: isLeft ? "1px solid rgba(77,255,219,0.45)" : "none",
                borderRight: !isLeft
                  ? "1px solid rgba(77,255,219,0.45)"
                  : "none",
                zIndex: 10,
                pointerEvents: "none",
              }}
            />
          );
        })}

        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "16px 22px 14px",
            borderBottom: "1px solid rgba(77,255,219,0.07)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ position: "relative", width: 8, height: 8 }}>
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: "#4DFFDB",
                  position: "absolute",
                }}
              />
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: "rgba(77,255,219,0.4)",
                  position: "absolute",
                  animation: "pulseRing 2s ease-out infinite",
                }}
              />
            </div>
            <span
              style={{
                fontFamily: '"JetBrains Mono", monospace',
                fontSize: 10,
                fontWeight: 600,
                letterSpacing: "0.18em",
                textTransform: "uppercase" as const,
                color: "#4DFFDB",
              }}
            >
              Transfer Network
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
            {isLoaded && (
              <>
                <StatPill label="nodes" value={nodeCount} />
                <StatPill label="edges" value={edgeCount} />
              </>
            )}
            <span
              style={{
                fontFamily: '"JetBrains Mono", monospace',
                fontSize: 9,
                color: "rgba(160,200,210,0.35)",
                letterSpacing: "0.1em",
              }}
            >
              scroll · drag
            </span>
          </div>
        </div>

        {/* Graph area */}
        <div
          style={{ position: "relative" }}
          onClick={(e) => {
            if ((e.target as HTMLElement).tagName === "CANVAS")
              setSelected(null);
          }}
        >
          <div
            className="scan-line"
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              height: 1,
              background:
                "linear-gradient(90deg, transparent, rgba(77,255,219,0.15), transparent)",
              pointerEvents: "none",
              zIndex: 5,
            }}
          />
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "radial-gradient(ellipse at center, transparent 55%, rgba(4,8,12,0.7) 100%)",
              pointerEvents: "none",
              zIndex: 4,
            }}
          />
          <div
            ref={containerRef}
            className="graph-container"
            style={{ width: "100%", height: 420 }}
          />

          {selected && (
            <NodePopup
              node={selected}
              onClose={() => setSelected(null)}
              containerWidth={containerRef.current?.clientWidth ?? 800}
            />
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 24,
            padding: "11px 22px 14px",
            borderTop: "1px solid rgba(77,255,219,0.07)",
          }}
        >
          <LegendItem
            dot={{
              background: "#4DFFDB",
              boxShadow: "0 0 8px rgba(77,255,219,0.5)",
            }}
            label="This wallet"
          />
          <LegendItem
            dot={{
              background: "#0f2030",
              border: "1px solid rgba(77,255,219,0.25)",
            }}
            label="Counterparty"
          />
          <span
            style={{
              fontFamily: '"JetBrains Mono", monospace',
              fontSize: 9,
              color: "rgba(160,200,210,0.3)",
              letterSpacing: "0.08em",
              marginLeft: "auto",
            }}
          >
            edge weight = USD value
          </span>
        </div>
      </div>
    </>
  );
}

// ─── Node Popup ───────────────────────────────────────────────────────────────

const POPUP_W = 240;

function NodePopup({
  node,
  onClose,
  containerWidth,
}: {
  node: SelectedNode;
  onClose: () => void;
  containerWidth: number;
}) {
  let left = node.screenX + 14;
  if (left + POPUP_W > containerWidth - 8) left = node.screenX - POPUP_W - 14;
  const top = Math.max(8, node.screenY - 24);

  const shortAddr = node.id.slice(0, 10) + "..." + node.id.slice(-6);

  return (
    <div
      className="node-popup"
      onClick={(e) => e.stopPropagation()}
      style={{
        position: "absolute",
        left,
        top,
        width: POPUP_W,
        background: "rgba(5,10,15,0.96)",
        border: "1px solid rgba(77,255,219,0.22)",
        borderRadius: 10,
        padding: "14px 16px 14px",
        zIndex: 20,
        backdropFilter: "blur(12px)",
        boxShadow:
          "0 12px 40px rgba(0,0,0,0.7), 0 0 0 1px rgba(77,255,219,0.05)",
      }}
    >
      {/* Close btn */}
      <button
        onClick={onClose}
        style={{
          position: "absolute",
          top: 8,
          right: 10,
          background: "none",
          border: "none",
          cursor: "pointer",
          color: "rgba(160,200,210,0.35)",
          fontSize: 16,
          lineHeight: 1,
          padding: 2,
        }}
      >
        ×
      </button>

      {/* Label */}
      <div
        style={{
          fontFamily: '"JetBrains Mono", monospace',
          fontSize: 11,
          fontWeight: 700,
          color: node.isCenter ? "#4DFFDB" : "#a0c8d2",
          marginBottom: 3,
          paddingRight: 18,
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {node.label}
      </div>

      {/* Address */}
      <div
        style={{
          fontFamily: '"JetBrains Mono", monospace',
          fontSize: 9,
          color: "rgba(160,200,210,0.3)",
          letterSpacing: "0.05em",
          marginBottom: 12,
        }}
      >
        {shortAddr}
      </div>

      <div
        style={{
          width: "100%",
          height: 1,
          background: "rgba(77,255,219,0.08)",
          marginBottom: 12,
        }}
      />

      {/* Stats */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          rowGap: 12,
          columnGap: 8,
        }}
      >
        <StatBlock
          label="Sent"
          value={fmt(node.sentUSD)}
          color="rgba(255,110,110,0.85)"
        />
        <StatBlock
          label="Received"
          value={fmt(node.receivedUSD)}
          color="#4DFFDB"
        />
        <StatBlock
          label="Transactions"
          value={String(node.txCount)}
          color="rgba(160,200,210,0.75)"
        />
        <StatBlock
          label="Tokens"
          value={node.tokens.slice(0, 3).join(", ") || "—"}
          color="rgba(160,200,210,0.75)"
        />
      </div>
    </div>
  );
}

function StatBlock({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div>
      <div
        style={{
          fontFamily: '"JetBrains Mono", monospace',
          fontSize: 8,
          color: "rgba(160,200,210,0.28)",
          letterSpacing: "0.14em",
          textTransform: "uppercase" as const,
          marginBottom: 4,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: '"JetBrains Mono", monospace',
          fontSize: 12,
          fontWeight: 700,
          color,
          letterSpacing: "0.01em",
        }}
      >
        {value}
      </div>
    </div>
  );
}

// ─── Shared sub-components ────────────────────────────────────────────────────

function StatPill({ label, value }: { label: string; value: number }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        background: "rgba(77,255,219,0.05)",
        border: "1px solid rgba(77,255,219,0.12)",
        borderRadius: 4,
        padding: "3px 8px",
      }}
    >
      <span
        style={{
          fontFamily: '"JetBrains Mono", monospace',
          fontSize: 11,
          fontWeight: 700,
          color: "#4DFFDB",
        }}
      >
        {value}
      </span>
      <span
        style={{
          fontFamily: '"JetBrains Mono", monospace',
          fontSize: 9,
          color: "rgba(160,200,210,0.4)",
          letterSpacing: "0.1em",
          textTransform: "uppercase" as const,
        }}
      >
        {label}
      </span>
    </div>
  );
}

function LegendItem({
  dot,
  label,
}: {
  dot: React.CSSProperties;
  label: string;
}) {
  return (
    <span style={{ display: "flex", alignItems: "center", gap: 7 }}>
      <span
        style={{
          width: 7,
          height: 7,
          borderRadius: "50%",
          flexShrink: 0,
          ...dot,
        }}
      />
      <span
        style={{
          fontFamily: '"JetBrains Mono", monospace',
          fontSize: 9,
          color: "rgba(160,200,210,0.4)",
          letterSpacing: "0.1em",
          textTransform: "uppercase" as const,
        }}
      >
        {label}
      </span>
    </span>
  );
}
