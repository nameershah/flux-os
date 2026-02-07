"use client";

import React from "react";
import { Search, DollarSign, Calendar } from "lucide-react";
import type { ProcurementStrategy } from "@/types";

export interface ProcurementFormProps {
  prompt: string;
  onPromptChange: (value: string) => void;
  budget: number;
  onBudgetChange: (value: number) => void;
  deadline: number;
  onDeadlineChange: (value: number) => void;
  strategy: ProcurementStrategy;
  onStrategyChange: (value: ProcurementStrategy) => void;
  onOrchestrate: () => void;
  loading: boolean;
}

const STRATEGIES: {
  id: ProcurementStrategy;
  label: string;
  desc: string;
}[] = [
  { id: "cheapest", label: "Cheapest", desc: "Lowest cost" },
  { id: "fastest", label: "Fastest", desc: "Quick delivery" },
  { id: "balanced", label: "Balanced", desc: "Price + speed" },
];

export function ProcurementForm({
  prompt,
  onPromptChange,
  budget,
  onBudgetChange,
  deadline,
  onDeadlineChange,
  strategy,
  onStrategyChange,
  onOrchestrate,
  loading,
}: ProcurementFormProps) {
  return (
    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-xl">
      <div className="flex items-center gap-2 mb-6 text-indigo-300 font-bold text-sm uppercase tracking-wider">
        <Search className="w-4 h-4" /> Constraint Capture
      </div>

      <div className="space-y-5">
        {/* Intent */}
        <div>
          <label className="text-xs font-semibold text-slate-400 mb-2 block ml-1">
            INTENT
          </label>
          <textarea
            className="w-full bg-slate-950/80 border border-white/10 rounded-xl p-4 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all h-24 resize-none placeholder:text-slate-600 font-sans"
            placeholder="e.g. I need a hackathon kit with snacks, badges, adapters, prizes..."
            value={prompt}
            onChange={(e) => onPromptChange(e.target.value)}
          />
        </div>

        {/* Budget & Deadline */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-slate-400 mb-2 block ml-1 flex items-center gap-1.5">
              <DollarSign className="w-3 h-3" /> BUDGET ($)
            </label>
            <input
              type="number"
              className="w-full bg-slate-950/80 border border-white/10 rounded-xl p-3 text-sm focus:border-indigo-500 outline-none font-mono"
              value={budget}
              onChange={(e) => onBudgetChange(Number(e.target.value))}
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-400 mb-2 block ml-1 flex items-center gap-1.5">
              <Calendar className="w-3 h-3" /> DEADLINE (Days)
            </label>
            <input
              type="number"
              className="w-full bg-slate-950/80 border border-white/10 rounded-xl p-3 text-sm focus:border-indigo-500 outline-none font-mono"
              value={deadline}
              onChange={(e) => onDeadlineChange(Number(e.target.value))}
            />
          </div>
        </div>

        {/* Strategy */}
        <div>
          <label className="text-xs font-semibold text-slate-400 mb-2 block ml-1">
            STRATEGY
          </label>
          <div className="grid grid-cols-3 gap-2">
            {STRATEGIES.map((s) => {
              const active = strategy === s.id;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => onStrategyChange(s.id)}
                  className={`flex flex-col items-center gap-0.5 py-3 px-2 rounded-xl border transition-all text-left ${
                    active
                      ? "bg-indigo-500/10 border-indigo-500/50 text-indigo-400"
                      : "bg-slate-950/50 border-white/10 text-slate-400 hover:border-slate-600"
                  }`}
                >
                  <span className="text-xs font-bold">{s.label}</span>
                  <span className="text-[10px] text-slate-500 truncate w-full text-center">
                    {s.desc}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <button
          onClick={onOrchestrate}
          disabled={loading || !prompt}
          className={`w-full py-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-lg ${
            loading
              ? "bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700"
              : "bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white border border-indigo-500/30"
          }`}
        >
          {loading ? (
            <span className="animate-spin">⏳</span>
          ) : (
            <Search className="w-4 h-4" />
          )}
          {loading ? "AGENT THINKING..." : "INITIATE"}
        </button>
      </div>
    </div>
  );
}
