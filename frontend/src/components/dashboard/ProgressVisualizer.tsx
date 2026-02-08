"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, Search, Scale, ShoppingCart, Lock, Package, Check } from "lucide-react";

export type ProgressPhase = "search" | "checkout" | "idle";

const SEARCH_STEPS = [
  { id: 1, Icon: FileText, label: "Parsing intent and constraints" },
  { id: 2, Icon: Search, label: "Searching retailers" },
  { id: 3, Icon: Scale, label: "Ranking by trust and delivery" },
  { id: 4, Icon: ShoppingCart, label: "Building optimized cart" },
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
        Agent activity
      </div>
      {phase === "search" && steps && (
        <div className="space-y-3">
          {steps.map((step) => {
            const isActive = currentStep === step.id;
            const isPast = currentStep > step.id;
            const StepIcon = step.Icon;
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
                <StepIcon className={`w-4 h-4 shrink-0 ${isActive ? "animate-pulse" : ""}`} />
                <span className="text-sm font-medium">{step.label}</span>
                {isPast && (
                  <Check className="ml-auto w-3.5 h-3.5 text-emerald-500 shrink-0" />
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
            <Lock className="w-4 h-4 shrink-0" />
            <span>Authenticating gateway</span>
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
                <Package className="w-4 h-4 shrink-0" />
                <span>Placing order: {vendor}</span>
              </motion.div>
            ))}
          </AnimatePresence>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: checkoutVendors.length * 0.2 + 0.2 }}
            className="flex items-center gap-2 text-sm text-emerald-400 pt-2"
          >
            <Check className="w-4 h-4 shrink-0" />
            <span>Syncing logistics</span>
          </motion.div>
        </div>
      )}
    </div>
  );
}
