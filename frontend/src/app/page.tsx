"use client";

import React, { useState, useMemo, useCallback } from "react";
import axios from "axios";
import { ShieldCheck, Upload, Box } from "lucide-react";
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

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://127.0.0.1:8001";

// Hardened API client
const api = axios.create({
  baseURL: API_BASE,
  timeout: 30000,
  headers: { "X-FluxOS": "ArcFlowKernel" },
});

export default function FluxOSDashboard() {
  const [prompt, setPrompt] = useState("");
  const [budget, setBudget] = useState(500);
  const [deadline, setDeadline] = useState(7);
  const [strategy, setStrategy] = useState<ProcurementStrategy>("balanced");

  const [loading, setLoading] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [success, setSuccess] = useState(false);

  const [options, setOptions] = useState<ProcurementOption[]>([]);
  const [logs, setLogs] = useState<string[]>([]);
  const [txHashes, setTxHashes] = useState<string[]>([]);
  const [telemetry, setTelemetry] = useState<Telemetry | null>(null);
  const [devMode, setDevMode] = useState(false);
  const [progressStep, setProgressStep] = useState(0);

  const addLog = (msg: string) =>
    setLogs((prev) => [...prev.slice(-250), `[${new Date().toLocaleTimeString()}] ${msg}`]);

  // ================= FILE UPLOAD ===================
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setOptions([]);
    setLogs([]);
    setProgressStep(0);

    addLog(`[ACTION] Document upload: ${file.name}`);
    addLog(`[THOUGHT] Sending to vision API for intent extraction.`);

    const formData = new FormData();
    formData.append("file", file);

    try {
      [1, 2, 3].forEach((s, i) => setTimeout(() => setProgressStep(s), (i + 1) * 600));

      const res = await api.post("/api/upload_intent", formData, {
        params: { budget, strategy },
      });

      setOptions(res.data.options || []);
      setTelemetry(res.data.telemetry || null);

      addLog(`[OBSERVATION] Intent extracted; ${res.data.options?.length || 0} cart items returned.`);
    } catch {
      addLog(`[ERROR] Document processing failed. Use text prompt instead.`);
    } finally {
      setLoading(false);
      setProgressStep(0);
    }
  };

  // ================= ORCHESTRATION ===================
  const handleOrchestrate = async () => {
    if (!prompt.trim()) return;

    setLoading(true);
    setOptions([]);
    setLogs([]);
    setProgressStep(0);

    addLog(`[ACTION] Orchestration started.`);
    addLog(`[THOUGHT] Budget $${budget}, strategy: ${strategy}.`);

    [1, 2, 3, 4].forEach((s, i) => setTimeout(() => setProgressStep(s), (i + 1) * 600));

    try {
      const res = await api.post("/api/orchestrate", {
        prompt,
        budget,
        deadline_days: deadline,
        strategy,
      });

      setOptions(res.data.options || res.data);
      setTelemetry(res.data.telemetry || null);
      addLog(`[OBSERVATION] ${res.data.options?.length || 0} options returned.`);
    } catch {
      addLog(`[ERROR] Orchestration request failed.`);
    } finally {
      setLoading(false);
      setProgressStep(0);
    }
  };

  // ================= RE-RANK ===================
  const handleReRank = (s: ProcurementStrategy) => {
    setStrategy(s);
    addLog(`[ACTION] Re-ranking with strategy: ${s}.`);
    handleOrchestrate();
  };

  // ================= EXECUTION (ARC FLOW SAFETY) ===================
  const handleExecution = async () => {
    if (!options.length) return;

    // Deterministic pre-flight guard
    const total = options.reduce((sum, i) => sum + (i.price || 0), 0);
    if (total > budget) {
      addLog(`[ERROR] Cart total $${total} exceeds budget $${budget}.`);
      return;
    }

    setExecuting(true);
    addLog(`[ACTION] Executing payment via ArcFlow kernel.`);

    try {
      const res = await api.post("/api/execute_payment", options);

      res.data.logs?.forEach((l: string, i: number) =>
        setTimeout(() => addLog(l), i * 250)
      );

      setTimeout(() => {
        setTxHashes(res.data.transaction_hashes || []);
        setSuccess(true);
        addLog(`[OBSERVATION] Settlement complete. Transaction hashes recorded.`);
        setExecuting(false);
      }, 1000);
    } catch (e: any) {
      addLog(`[ERROR] Payment rejected: ${e?.response?.data?.detail || "policy or network error"}.`);
      setExecuting(false);
    }
  };

  const reset = () => {
    setPrompt("");
    setOptions([]);
    setLogs([]);
    setTelemetry(null);
    setSuccess(false);
  };

  const step: WorkflowStep = useMemo(() => {
    if (success) return "audit";
    if (executing) return "verify";
    if (options.length) return "select";
    if (loading) return "ai_search";
    return "input";
  }, [loading, executing, success, options.length]);

  return (
    <div className="min-h-screen bg-black text-white">
      <MatrixBackground />

      {/* Kernel Status Banner */}
      <div className="fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-400/40 rounded-full text-emerald-400 text-xs font-bold">
        <ShieldCheck className="w-4 h-4" />
        ArcFlow Kernel Active — Deterministic Mode
      </div>

      <div className="max-w-7xl mx-auto p-6 relative z-10">
        <header className="mb-8 border-b border-white/10 pb-6">
          <div className="flex justify-between items-center">
            <div className="flex gap-3 items-center">
              <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center">
                <Box className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">
                  Flux <span className="text-indigo-400">OS</span>
                </h1>
                <p className="text-xs text-slate-400 font-mono">
                  Deterministic Agentic Commerce Kernel
                </p>
              </div>
            </div>

            {/* Explain / decision trace toggle */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 hidden sm:inline">Explain</span>
              <button
                onClick={() => setDevMode(!devMode)}
                className={`w-11 h-6 rounded-full ${
                  devMode ? "bg-indigo-500" : "bg-slate-700"
                }`}
                aria-label="Toggle decision trace"
              >
                <span
                  className={`block w-4 h-4 bg-white rounded-full transition-transform ${
                    devMode ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          </div>

          <WorkflowStepper currentStep={step} />
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* LEFT PANEL */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-xl space-y-4">
              <label className="flex flex-col items-center justify-center h-32 border-2 border-dashed border-slate-700 rounded-xl cursor-pointer hover:border-indigo-500">
                <Upload className="w-8 h-8 mb-2" />
                <p className="text-sm">Upload Shopping List</p>
                <p className="text-xs text-slate-500">Image / PDF</p>
                <input type="file" hidden onChange={handleFileUpload} />
              </label>

              <ProcurementForm
                prompt={prompt}
                onPromptChange={setPrompt}
                budget={budget}
                onBudgetChange={setBudget}
                deadline={deadline}
                onDeadlineChange={setDeadline}
                strategy={strategy}
                onStrategyChange={setStrategy}
                onOrchestrate={handleOrchestrate}
                loading={loading}
              />
            </div>

            {(loading || executing) && (
              <ProgressVisualizer
                phase={loading ? "search" : "checkout"}
                currentStep={progressStep}
                checkoutVendors={[]}
              />
            )}

            <LiveTerminal logs={logs} isProcessing={loading || executing} />
          </div>

          {/* RIGHT PANEL */}
          <div className="lg:col-span-8">
            <ResultsGrid
              options={options}
              loading={loading}
              executing={executing}
              success={success}
              transactionHashes={txHashes}
              strategy={strategy}
              onStrategyChange={handleReRank}
              onExecute={handleExecution}
              onReset={reset}
              onReRank={handleReRank}
            />
          </div>
        </div>
      </div>

      {devMode && <DevModeTelemetry telemetry={telemetry} onClose={() => setDevMode(false)} />}
    </div>
  );
}