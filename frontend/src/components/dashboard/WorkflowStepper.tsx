"use client";

import React from "react";
import {
  ClipboardList,
  Search,
  CheckCircle2,
  Shield,
  Truck,
  CreditCard,
  FileCheck,
} from "lucide-react";
import { motion } from "framer-motion";

export type WorkflowStep =
  | "input"
  | "ai_search"
  | "select"
  | "verify"
  | "delivery"
  | "payment"
  | "audit";

const STEPS: { id: WorkflowStep; label: string; icon: React.ElementType }[] = [
  { id: "input", label: "User Input", icon: ClipboardList },
  { id: "ai_search", label: "AI Market Search", icon: Search },
  { id: "select", label: "Order Confirm", icon: CheckCircle2 },
  { id: "verify", label: "ArcFlow Verify", icon: Shield },
  { id: "delivery", label: "Delivery Proof", icon: Truck },
  { id: "payment", label: "Secure Payment", icon: CreditCard },
  { id: "audit", label: "Audit & Feedback", icon: FileCheck },
];

export interface WorkflowStepperProps {
  currentStep: WorkflowStep;
}

export function WorkflowStepper({ currentStep }: WorkflowStepperProps) {
  const currentIdx = STEPS.findIndex((s) => s.id === currentStep);

  return (
    <div className="flex items-center justify-between gap-1 overflow-x-auto py-2 scrollbar-none">
      {STEPS.map((step, idx) => {
        const Icon = step.icon;
        const isActive = idx === currentIdx;
        const isPast = idx < currentIdx;

        return (
          <React.Fragment key={step.id}>
            <motion.div
              initial={{ opacity: 0.6 }}
              animate={{ opacity: 1 }}
              className={`flex flex-col items-center min-w-[72px] ${
                isActive ? "scale-105" : ""
              }`}
            >
              <div
                className={`w-9 h-9 rounded-lg flex items-center justify-center border transition-all ${
                  isActive
                    ? "bg-indigo-500/20 border-indigo-500 text-indigo-400"
                    : isPast
                      ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-400"
                      : "bg-slate-800/50 border-white/10 text-slate-500"
                }`}
              >
                <Icon className="w-4 h-4" />
              </div>
              <span
                className={`text-[10px] font-medium mt-1.5 truncate max-w-full ${
                  isActive ? "text-indigo-400" : isPast ? "text-emerald-400/80" : "text-slate-500"
                }`}
              >
                {step.label}
              </span>
            </motion.div>
            {idx < STEPS.length - 1 && (
              <div
                className={`flex-1 min-w-[12px] h-0.5 rounded ${
                  isPast ? "bg-emerald-500/50" : "bg-slate-800"
                }`}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}
