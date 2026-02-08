"use client";

import React, { useState } from "react";
import {
  ShieldCheck,
  Search,
  Clock,
  CreditCard,
  Zap,
  Activity,
  CheckCircle2,
  DollarSign,
  Trophy,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { ProcurementOption, ProcurementStrategy } from "@/types";

const RETAILER_COLORS: Record<string, string> = {
  amazon: "bg-amber-500/20 text-amber-400 border-amber-500/40",
  walmart: "bg-blue-500/20 text-blue-400 border-blue-500/40",
  tech_direct: "bg-emerald-500/20 text-emerald-400 border-emerald-500/40",
};

const RETAILER_LABELS: Record<string, string> = {
  amazon: "Amazon",
  walmart: "Walmart",
  tech_direct: "TechData",
};

const ARC_EXPLORER_BASE = "https://testnet.arcscan.app/tx/";

export interface ResultsGridProps {
  options: ProcurementOption[];
  loading: boolean;
  executing: boolean;
  success: boolean;
  transactionHashes?: string[];
  strategy: ProcurementStrategy;
  onStrategyChange: (s: ProcurementStrategy) => void;
  onExecute: () => void;
  onReset: () => void;
  onReRank?: (newStrategy: ProcurementStrategy) => void;
}

export function ResultsGrid({
  options,
  loading,
  executing,
  success,
  transactionHashes = [],
  strategy,
  onStrategyChange,
  onExecute,
  onReset,
  onReRank,
}: ResultsGridProps) {
  const total = options.reduce((acc, curr) => acc + curr.price, 0);

  const handleStrategyChange = (s: ProcurementStrategy) => {
    onStrategyChange(s);
    onReRank?.(s);
  };

  return (
    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 min-h-[600px] relative overflow-hidden">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-indigo-400" />
          Optimized Cart
          {options.length > 0 && (
            <span className="text-xs bg-white/5 px-2 py-1 rounded-full text-slate-300 border border-white/10">
              {options.length} Items
            </span>
          )}
        </h2>
        {options.length > 0 && (
          <div className="text-right">
            <div className="text-xs text-slate-500 font-mono uppercase">
              Total
            </div>
            <div className="text-2xl font-bold text-emerald-400 font-mono">
              ${total.toFixed(2)}
            </div>
          </div>
        )}
      </div>

      {/* Strategy dropdown above cart - Dynamic Re-Ranking */}
      {options.length > 0 && (
        <div className="mb-6 flex items-center gap-3">
          <span className="text-xs text-slate-400 font-medium">Strategy:</span>
          <select
            value={strategy}
            onChange={(e) => handleStrategyChange(e.target.value as ProcurementStrategy)}
            className="bg-slate-950/80 border border-white/10 rounded-lg px-4 py-2 text-sm font-medium text-white focus:border-indigo-500 outline-none cursor-pointer"
          >
            <option value="cheapest">Cheapest</option>
            <option value="fastest">Fastest</option>
            <option value="balanced">Balanced</option>
          </select>
          <span className="text-xs text-slate-500 italic">
            Re-rank cart by strategy
          </span>
        </div>
      )}

      {/* EMPTY STATE */}
      {options.length === 0 && !loading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-600">
          <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mb-4 animate-pulse border border-white/10">
            <Search className="w-10 h-10 opacity-20" />
          </div>
          <p className="font-mono text-sm font-medium">Awaiting input.</p>
          <p className="text-xs text-slate-500 mt-1 max-w-xs text-center">
            Define intent, budget & deadline → AI scouts Amazon, Walmart, TechData
            → Optimized cart with trade-offs
          </p>
        </div>
      )}

      {/* RESULTS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
        <AnimatePresence mode="popLayout">
          {options.map((option, idx) => (
            <CartItemCard
              key={option.id}
              option={option}
              index={idx}
              strategy={strategy}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* ACTION BUTTON */}
      {options.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8 pt-6 border-t border-white/10 flex justify-end"
        >
          <button
            onClick={onExecute}
            disabled={executing || success}
            className={`px-8 py-4 rounded-xl font-bold text-sm flex items-center gap-3 shadow-xl transition-all ${
              success
                ? "bg-emerald-600 text-white cursor-default ring-4 ring-emerald-500/20"
                : "bg-white text-slate-950 hover:bg-indigo-50 hover:scale-105"
            }`}
          >
            {executing ? (
              <>
                <Activity className="w-5 h-5 animate-spin" /> Processing...
              </>
            ) : success ? (
              <>
                <CheckCircle2 className="w-6 h-6" /> Payment Secured
              </>
            ) : (
              <>
                <Zap className="w-5 h-5 fill-slate-950" /> Execute Payment
              </>
            )}
          </button>
        </motion.div>
      )}

      {/* SUCCESS MODAL */}
      <AnimatePresence>
        {success && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              className="bg-slate-900 border border-emerald-500/50 rounded-2xl p-8 max-w-md w-full shadow-[0_0_100px_rgba(16,185,129,0.2)] relative"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-indigo-500" />
              <div className="flex flex-col items-center text-center">
                <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mb-6 border border-emerald-500/30">
                  <CheckCircle2 className="w-10 h-10 text-emerald-400" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">
                  Funds Released
                </h3>
                <p className="text-slate-400 text-sm mb-8">
                  Orders placed across retailers. Delivery tracking active.
                </p>

                <div className="w-full bg-black/50 rounded-lg p-4 font-mono text-xs text-left space-y-3 mb-6 border border-slate-800">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Status</span>{" "}
                    <span className="text-emerald-400">Confirmed</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Timestamp</span>{" "}
                    <span className="text-slate-300">
                      {new Date().toLocaleTimeString()}
                    </span>
                  </div>
                </div>

                {transactionHashes.length > 0 && (
                  <div className="w-full mb-8">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                      On-Chain Proof of Settlement
                    </p>
                    <div className="space-y-2">
                      {transactionHashes.map((txHash, i) => (
                        <a
                          key={txHash}
                          href={`${ARC_EXPLORER_BASE}${txHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block bg-slate-950/80 border border-indigo-500/30 rounded-lg px-3 py-2 font-mono text-[11px] text-indigo-300 hover:text-indigo-200 hover:border-indigo-500/50 truncate"
                          title={txHash}
                        >
                          {transactionHashes.length > 1 ? `#${i + 1} ` : ""}{txHash}
                        </a>
                      ))}
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1">
                      Arc Testnet · testnet.arcscan.app
                    </p>
                  </div>
                )}

                <button
                  onClick={onReset}
                  className="w-full bg-slate-800 hover:bg-slate-700 text-white py-3 rounded-lg font-bold transition-colors border border-slate-700"
                >
                  Start New Procurement
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function CartItemCard({
  option,
  index,
  strategy,
}: {
  option: ProcurementOption;
  index: number;
  strategy: ProcurementStrategy;
}) {
  const [showTooltip, setShowTooltip] = useState(false);
  const retailerClass = RETAILER_COLORS[option.vendor_id] || "bg-slate-500/20 text-slate-400";
  const retailerLabel = RETAILER_LABELS[option.vendor_id] || option.vendor_name;
  const tooltipReason = option.reason || `Chosen because it optimizes ${strategy} within your constraints.`;

  const aiReasonIcon =
    option.ai_reason === "Best Price"
      ? "🏆"
      : option.ai_reason === "Fastest Delivery"
        ? "⚡"
        : "🧠";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ delay: index * 0.08 }}
      className="relative bg-slate-950/60 border border-white/10 p-5 rounded-xl hover:border-indigo-500/30 transition-all group"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      {/* Retailer Badge */}
      <div className="flex flex-wrap justify-between items-start gap-2 mb-3">
        <span
          className={`text-[10px] font-bold tracking-widest px-2 py-1 rounded uppercase border ${retailerClass}`}
        >
          {retailerLabel}
        </span>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
            {aiReasonIcon} {option.ai_reason}
          </span>
          <div className="flex items-center gap-1 text-emerald-500 text-xs font-bold bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20">
            <ShieldCheck className="w-3 h-3" /> {option.trust_score}%
          </div>
        </div>
      </div>

      <h3 className="text-lg font-bold text-slate-100 mb-1 group-hover:text-indigo-300 transition-colors">
        {option.name}
      </h3>

      {/* Tooltip - AI Reasoning */}
      {showTooltip && (
        <div className="absolute left-4 right-4 top-full mt-1 z-20 bg-slate-900/95 border border-indigo-500/30 rounded-lg p-3 text-xs text-slate-300 shadow-xl">
          <span className="text-indigo-400 font-medium">AI Reasoning: </span>
          {tooltipReason}
        </div>
      )}

      {/* Price - with negotiated discount */}
      <div className="flex justify-between items-center pt-3 border-t border-white/5 mt-4">
        <div className="flex items-baseline gap-2">
          {option.original_price != null && option.original_price > option.price ? (
            <>
              <span className="text-sm text-slate-500 line-through font-mono">
                ${option.original_price.toFixed(2)}
              </span>
              <span className="text-2xl font-bold text-white font-mono">
                ${option.price.toFixed(2)}
              </span>
              {(() => {
                const pct = Math.round(((option.original_price! - option.price) / option.original_price!) * 100);
                return (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/40">
                    🏷️ Agent Negotiated -{pct}%
                  </span>
                );
              })()}
            </>
          ) : (
            <span className="text-2xl font-bold text-white font-mono">
              ${option.price.toFixed(2)}
            </span>
          )}
        </div>
        <span className="text-xs text-slate-500 flex items-center gap-1">
          <Clock className="w-3 h-3" /> {option.delivery_days}d
        </span>
      </div>
    </motion.div>
  );
}
