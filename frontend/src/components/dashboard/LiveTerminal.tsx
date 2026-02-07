"use client";

import React, { useEffect, useRef } from "react";
import { Terminal, Brain } from "lucide-react";
import { motion } from "framer-motion";

export interface LiveTerminalProps {
  logs: string[];
  isProcessing?: boolean;
}

function getLogType(log: string): "thought" | "action" | "observation" | "default" {
  const u = log.toUpperCase();
  if (u.startsWith("[THOUGHT]")) return "thought";
  if (u.startsWith("[ACTION]")) return "action";
  if (u.startsWith("[OBSERVATION]")) return "observation";
  return "default";
}

export function LiveTerminal({ logs, isProcessing = false }: LiveTerminalProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  const renderLogContent = (log: string) => {
    const type = getLogType(log);
    if (log.includes("ERROR"))
      return <span className="text-red-400">{log}</span>;
    if (log.includes("SUCCESS"))
      return <span className="text-emerald-400">{log}</span>;

    if (type === "thought") {
      return (
        <span className="text-purple-400 italic font-normal">{log}</span>
      );
    }
    if (type === "action") {
      return (
        <span className="text-cyan-400 font-medium">{log}</span>
      );
    }
    if (type === "observation") {
      return (
        <span className="text-amber-400/90">{log}</span>
      );
    }
    return <span className="text-slate-300">{log}</span>;
  };

  const getBorderClass = (log: string) => {
    const type = getLogType(log);
    if (type === "thought") return "border-purple-600/50";
    if (type === "action") return "border-cyan-600/50";
    if (type === "observation") return "border-amber-600/50";
    return "border-slate-800";
  };

  return (
    <div className="bg-black/90 border border-white/10 rounded-lg p-4 font-mono text-xs h-52 overflow-hidden flex flex-col shadow-inner">
      <div className="flex items-center justify-between mb-2 border-b border-white/10 pb-2">
        <span className="text-slate-500 flex items-center gap-2">
          <Terminal className="w-3 h-3" /> AGENT_LOGS
        </span>
        <div className="flex items-center gap-4">
          <motion.span
            className="flex items-center gap-1.5 text-purple-400"
            animate={{
              opacity: isProcessing ? [0.7, 1, 0.7] : [0.5, 0.8, 0.5],
            }}
            transition={{
              duration: isProcessing ? 0.6 : 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            <span className="relative flex h-2 w-2">
              <motion.span
                className="absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"
                animate={{
                  scale: [1, 2, 2],
                  opacity: [0.5, 0, 0],
                }}
                transition={{
                  duration: isProcessing ? 0.5 : 1.5,
                  repeat: Infinity,
                  ease: "easeOut",
                }}
              />
              <span
                className={`relative inline-flex rounded-full h-2 w-2 bg-purple-500 ${
                  isProcessing ? "ring-2 ring-purple-400/50" : ""
                }`}
              />
            </span>
            <Brain className="w-3 h-3" />
            <span className="text-[10px] font-semibold tracking-wider">
              {isProcessing ? "REASONING" : "STANDBY"}
            </span>
          </motion.span>
          <span className="flex items-center gap-1.5 text-emerald-500">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            LIVE
          </span>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto space-y-1 scrollbar-none">
        {logs.length === 0 && (
          <span className="text-slate-600 italic opacity-70">
            // Waiting for command...
          </span>
        )}
        {logs.map((log, i) => (
          <motion.div
            key={`${i}-${log.slice(0, 30)}`}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className={`border-l-2 pl-2 ${getBorderClass(log)}`}
          >
            <span className="text-slate-600 mr-2 font-mono text-[10px]">
              [{new Date().toLocaleTimeString().slice(0, 5)}]
            </span>
            {renderLogContent(log)}
          </motion.div>
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
