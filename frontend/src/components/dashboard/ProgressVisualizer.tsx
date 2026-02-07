"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";

export type ProgressPhase = "search" | "checkout" | "idle";

const SEARCH_STEPS = [
  { id: 1, icon: "🌊", label: "Parsing Intent & Constraints..." },
  { id: 2, icon: "🔍", label: "Scouting Amazon, Walmart, & TechData..." },
  { id: 3, icon: "⚖️", label: "Ranking by Trust & Delivery Speed..." },
  { id: 4, icon: "🛒", label: "Assembling Optimized Cart..." },
];

const CHECKOUT_STEPS = [
  { icon: "🔐", label: "Authenticating Secure Gateway..." },
  { icon: "📦", label: "Placing Order" },
  { icon: "✅", label: "Syncing Logistics..." },
];

export interface ProgressVisualizerProps {
  phase: ProgressPhase;
  currentStep?: number;
  checkoutVendors?: string[];
}

export function ProgressVisualizer({
  phase,
  currentStep = 0,
  checkoutVendors = [],
}: ProgressVisualizerProps) {
  if (phase === "idle") return null;

  const steps = phase === "search" ? SEARCH_STEPS : null;

  return (
    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-5 space-y-4">
      <div className="text-xs font-bold text-indigo-300/90 uppercase tracking-wider">
        Live Agent Activity
      </div>
      {phase === "search" && steps && (
        <div className="space-y-3">
          {steps.map((step, idx) => {
            const isActive = currentStep === step.id;
            const isPast = currentStep > step.id;
            return (
              <motion.div
                key={step.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{
                  opacity: isActive || isPast ? 1 : 0.5,
                  x: 0,
                  scale: isActive ? 1.02 : 1,
                }}
                className={`flex items-center gap-3 transition-colors ${
                  isActive ? "text-white" : isPast ? "text-emerald-400/80" : "text-slate-500"
                }`}
              >
                <span
                  className={`text-lg ${isActive ? "animate-pulse" : ""}`}
                >
                  {step.icon}
                </span>
                <span className="text-sm font-medium">{step.label}</span>
                {isPast && (
                  <span className="ml-auto text-emerald-500 text-xs">✓</span>
                )}
              </motion.div>
            );
          })}
        </div>
      )}
      {phase === "checkout" && (
        <div className="space-y-2">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-2 text-sm text-white"
          >
            <span>🔐</span>
            <span>Authenticating Secure Gateway...</span>
          </motion.div>
          <AnimatePresence>
            {checkoutVendors.map((vendor, idx) => (
              <motion.div
                key={vendor}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.2 }}
                className="flex items-center gap-2 text-sm text-indigo-200 pl-6"
              >
                <span>📦</span>
                <span>Placing Order at {vendor}...</span>
              </motion.div>
            ))}
          </AnimatePresence>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: checkoutVendors.length * 0.2 + 0.2 }}
            className="flex items-center gap-2 text-sm text-emerald-400 pt-2"
          >
            <span>✅</span>
            <span>Syncing Logistics...</span>
          </motion.div>
        </div>
      )}
    </div>
  );
}
