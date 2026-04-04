"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { type ActionID } from "@/types/pages";
import { ACTIONS } from "@/lib/constants";

export default function Home() {
  const router = useRouter();
  const [address, setAddress] = useState("");
  const [selected, setSelected] = useState<ActionID>("analyze");
  const [error, setError] = useState("");

  const handleSubmit = () => {
    if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
      setError("Invalid wallet address");
      return;
    }
    const action = ACTIONS.find((a) => a.id === selected)!;
    router.push(action.path(address));
  };

  return (
    <main className="min-h-screen bg-[#080b10] text-white">
      <div className="max-w-2xl mx-auto px-8 pt-24 pb-16">
        <h1 className="text-5xl font-black text-center mb-4">
          Blockchain Intelligence
          <br />
          <span className="text-[#00d4aa]">On Demand</span>
        </h1>
        <p className="text-center text-gray-400 mb-12">
          Pay per query in USDC. No accounts. No subscriptions.
          <br />
          Powered by Arkham + Claude AI.
        </p>

        {/* Action selector */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {ACTIONS.map((action) => (
            <button
              key={action.id}
              onClick={() => setSelected(action.id)}
              className={`p-4 rounded-xl border text-left transition-all ${
                selected === action.id
                  ? "border-[#00d4aa] bg-[#00d4aa]/10"
                  : "border-[#1e2a38] bg-[#0d1117] hover:border-[#2a3a4a]"
              }`}
            >
              <div className="text-[#00d4aa] font-bold text-lg mb-1">
                {action.price}
              </div>
              <div className="text-sm font-semibold text-white mb-1">
                {action.label}
              </div>
              <div className="text-xs text-gray-500">{action.description}</div>
            </button>
          ))}
        </div>

        {/* Address input */}
        <div className="flex flex-col md:flex-row gap-2">
          <input
            value={address}
            onChange={(e) => {
              setAddress(e.target.value);
              setError("");
            }}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            placeholder="0x..."
            className="flex-1 bg-[#0d1117] border border-[#1e2a38] rounded-xl px-4 py-3 font-mono text-sm focus:outline-none focus:border-[#00d4aa] transition-colors"
          />
          <button
            onClick={handleSubmit}
            className="bg-[#00d4aa] text-black px-6 py-3 rounded-xl font-bold hover:bg-[#00b894] transition-colors"
          >
            {ACTIONS.find((a) => a.id === selected)?.label} →
          </button>
        </div>
        {error && <p className="text-red-400 text-xs mt-2">{error}</p>}

        <p className="text-center text-xs text-gray-600 mt-8">
          Paid via USDC on Base · x402 protocol · No accounts needed for agents
        </p>
      </div>
    </main>
  );
}
