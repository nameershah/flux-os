"use client";

import React, { useState, useMemo, useCallback } from "react";
import axios from "axios";
import { Box, ShieldCheck } from "lucide-react";
import {
  MatrixBackground,
  LiveTerminal,
  ProcurementForm,
  ResultsGrid,
  WorkflowStepper,
  ProgressVisualizer,
  DevModeTelemetry,
} from "@/components/dashboard";
import type { ProcurementOption, ProcurementStrategy, Telemetry } from "@/types";
import type { WorkflowStep } from "@/components/dashboard/WorkflowStepper";
import type { ProgressPhase } from "@/components/dashboard/ProgressVisualizer";

const API_BASE = "http://127.0.0.1:8001";

export default function FluxOSDashboard() {
  const [prompt, setPrompt] = useState("");
  const [budget, setBudget] = useState(500);
  const [deadline, setDeadline] = useState(7);
  const [strategy, setStrategy] = useState<ProcurementStrategy>("balanced");
  const [loading, setLoading] = useState(false);
  const [options, setOptions] = useState<ProcurementOption[]>([]);
  const [logs, setLogs] = useState<string[]>([]);
  const [executing, setExecuting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [devMode, setDevMode] = useState(false);
  const [telemetry, setTelemetry] = useState<Telemetry | null>(null);
  const [progressStep, setProgressStep] = useState(0);

  const addLog = useCallback((msg: string) => {
    setLogs((prev) => [...prev, msg]);
  }, []);

  const handleOrchestrate = useCallback(async (isReRank = false) => {
    if (!prompt && !isReRank) return;
    setLoading(true);
    if (!isReRank) {
      setOptions([]);
      setSuccess(false);
      setLogs([]);
      setProgressStep(0);
      addLog(`[THOUGHT] User budget is $${budget}. Deadline: ${deadline} days. Prioritizing ${strategy} strategy.`);
      addLog(`[ACTION] Parsing intent & constraints...`);
      addLog(`[OBSERVATION] Intent: "${prompt}"`);
    }

    const steps = [1, 2, 3, 4];
    steps.forEach((s, i) => {
      setTimeout(() => setProgressStep(s), (i + 1) * 600);
    });

    if (!isReRank) {
      setTimeout(() => addLog(`[ACTION] Scouting Amazon, Walmart, & TechData...`), 700);
      setTimeout(() => addLog(`[ACTION] Ranking by trust & delivery speed...`), 1400);
    }

    try {
      const response = await axios.post(`${API_BASE}/api/orchestrate`, {
        prompt: prompt || "hackathon kit",
        budget,
        deadline_days: deadline,
        strategy,
      });

      const data = response.data;
      const opts = data.options ?? data;
      const tel = data.telemetry ?? null;

      if (tel) setTelemetry(tel);

      setTimeout(() => {
        setOptions(opts);
        addLog(`[OBSERVATION] Found ${opts.length} optimized matches.`);
        addLog(`SUCCESS: Cart assembled.`);
        setLoading(false);
        setProgressStep(0);
      }, 2200);
    } catch {
      addLog(`ERROR: Connection to Neural Engine Failed.`);
      setLoading(false);
      setProgressStep(0);
    }
  }, [prompt, budget, deadline, strategy, addLog]);

  const handleReRank = useCallback(
    (newStrategy: ProcurementStrategy) => {
      addLog(`[THOUGHT] User changed strategy to ${newStrategy}. Re-ranking cart.`);
      addLog(`[ACTION] Querying vendors with new ranking weights...`);
      setLoading(true);
      setProgressStep(0);
      [1, 2, 3, 4].forEach((s, i) => setTimeout(() => setProgressStep(s), (i + 1) * 400));
      axios
        .post(`${API_BASE}/api/orchestrate`, {
          prompt: prompt || "hackathon kit",
          budget,
          deadline_days: deadline,
          strategy: newStrategy,
        })
        .then((res) => {
          const opts = res.data?.options ?? res.data;
          const tel = res.data?.telemetry;
          if (tel) setTelemetry(tel);
          setTimeout(() => {
            setOptions(opts);
            addLog(`[OBSERVATION] Cart re-ranked by ${newStrategy}.`);
            setLoading(false);
            setProgressStep(0);
          }, 800);
        })
        .catch(() => {
          addLog(`ERROR: Re-rank failed.`);
          setLoading(false);
          setProgressStep(0);
        });
    },
    [prompt, budget, deadline, addLog]
  );

  const handleExecution = useCallback(async () => {
    if (options.length === 0) return;
    setExecuting(true);
    addLog(`[ACTION] Initiating secure payment fan-out...`);

    try {
      const response = await axios.post(`${API_BASE}/api/execute_payment`, options);
      const auditLogs = response.data?.logs ?? [];

      auditLogs.forEach((log: string, index: number) => {
        setTimeout(() => addLog(log), index * 350);
      });

      setTimeout(() => {
        setSuccess(true);
        addLog(`TRANSACTION FINALIZED.`);
        setExecuting(false);
      }, auditLogs.length * 350 + 600);
    } catch {
      addLog(`CRITICAL FAILURE: Payment Gateway Reject.`);
      setExecuting(false);
    }
  }, [options, addLog]);

  const handleReset = useCallback(() => {
    setSuccess(false);
    setOptions([]);
    setPrompt("");
    setLogs([]);
    setTelemetry(null);
  }, []);

  const currentStep: WorkflowStep = useMemo(() => {
    if (success) return "audit";
    if (executing) return "verify";
    if (options.length > 0) return "select";
    if (loading) return "ai_search";
    return "input";
  }, [loading, options.length, executing, success]);

  const progressPhase: ProgressPhase = loading ? "search" : executing ? "checkout" : "idle";
  const checkoutVendors = executing ? [...new Set(options.map((o) => o.vendor_name))] : [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950/30 to-slate-950 text-slate-100 font-sans selection:bg-indigo-500/30 overflow-x-hidden">
      <MatrixBackground />

      {/* Safety Banner */}
      <div className="fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-2 bg-amber-500/10 border border-amber-500/30 rounded-full text-amber-400 text-xs font-bold animate-pulse">
        <ShieldCheck className="w-4 h-4" />
        SANDBOX ENVIRONMENT: MOCK PAYMENT GATEWAY ACTIVE
      </div>

      <div className="max-w-7xl mx-auto p-6 relative z-10">
        <header className="flex flex-col gap-6 mb-8 border-b border-white/10 pb-6">
          <div className="flex justify-between items-center flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20 border border-white/10">
                <Box className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-white">
                  Flux <span className="text-indigo-400">OS</span>
                </h1>
                <p className="text-xs text-slate-400 font-mono tracking-wider">
                  MULTI-RETAILER ORCHESTRATION
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <span className="text-xs font-mono text-slate-500">DEV MODE</span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={devMode}
                  onClick={() => setDevMode((v) => !v)}
                  className={`relative w-11 h-6 rounded-full transition-colors ${
                    devMode ? "bg-indigo-500" : "bg-slate-700"
                  }`}
                >
                  <span
                    className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                      devMode ? "left-6" : "left-1"
                    }`}
                  />
                </button>
              </label>
            </div>
          </div>
          <WorkflowStepper currentStep={currentStep} />
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-4 space-y-6">
            <ProcurementForm
              prompt={prompt}
              onPromptChange={setPrompt}
              budget={budget}
              onBudgetChange={setBudget}
              deadline={deadline}
              onDeadlineChange={setDeadline}
              strategy={strategy}
              onStrategyChange={setStrategy}
              onOrchestrate={() => handleOrchestrate(false)}
              loading={loading}
            />
            {(loading || executing) && (
              <ProgressVisualizer
                phase={progressPhase}
                currentStep={progressStep}
                checkoutVendors={checkoutVendors}
              />
            )}
            <LiveTerminal logs={logs} isProcessing={loading || executing} />
          </div>

          <div className="lg:col-span-8">
            <ResultsGrid
              options={options}
              loading={loading}
              executing={executing}
              success={success}
              strategy={strategy}
              onStrategyChange={setStrategy}
              onExecute={handleExecution}
              onReset={handleReset}
              onReRank={options.length > 0 ? handleReRank : undefined}
            />
          </div>
        </div>
      </div>

      {devMode && (
        <DevModeTelemetry
          telemetry={telemetry}
          onClose={() => setDevMode(false)}
        />
      )}
    </div>
  );
}
