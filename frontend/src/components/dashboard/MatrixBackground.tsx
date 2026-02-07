"use client";

export function MatrixBackground() {
  return (
    <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
      {/* Midnight Ocean gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-indigo-950/50 to-slate-950" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(30,41,59,0.4)_1px,transparent_1px),linear-gradient(to_bottom,rgba(30,41,59,0.4)_1px,transparent_1px)] bg-[size:40px_40px] opacity-30" />
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-slate-950/80 via-transparent to-indigo-950/80" />
    </div>
  );
}
