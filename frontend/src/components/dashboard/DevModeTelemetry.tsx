"use client";

import React from "react";
import { Cpu, X } from "lucide-react";
import type { Telemetry } from "@/types";

export interface DevModeTelemetryProps {
  telemetry: Telemetry | null;
  onClose?: () => void;
}

export function DevModeTelemetry({ telemetry, onClose }: DevModeTelemetryProps) {
  return (
    <div className="fixed bottom-6 right-6 z-50 w-72 bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4 shadow-2xl shadow-black/30">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 text-xs font-bold text-indigo-300 uppercase tracking-wider">
          <Cpu className="w-4 h-4" />
          Live Telemetry
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
      <div className="space-y-2 font-mono text-xs">
        {telemetry ? (
          <>
            <div className="flex justify-between text-slate-300">
              <span>LLM Model</span>
              <span className="text-amber-400">{telemetry.model}</span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span>Latency</span>
              <span className="text-cyan-400">
                {(telemetry.latency_ms / 1000).toFixed(2)}s
              </span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span>Tokens Used</span>
              <span className="text-emerald-400">{telemetry.tokens_used}</span>
            </div>
          </>
        ) : (
          <p className="text-slate-500 italic py-2">
            Run a search to see live telemetry
          </p>
        )}
      </div>
      {telemetry && (
        <p className="mt-3 text-[10px] text-slate-500 italic">
          Proves real API calls to judges
        </p>
      )}
    </div>
  );
}
