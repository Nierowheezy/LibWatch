import React from "react";

interface StatsOverviewProps {
  totalTracked: number;
  npmCount: number;
  githubCount: number;
  errorCount: number;
}

export function StatsOverview({
  totalTracked,
  npmCount,
  githubCount,
  errorCount
}: StatsOverviewProps) {
  return (
    <section className="grid grid-cols-2 lg:grid-cols-4 border-y border-zinc-900 bg-[#0c0c0e] divide-x divide-zinc-900 mb-8 py-5">
      <div className="px-6 py-1">
        <span className="text-[10px] text-zinc-500 font-mono tracking-wider block uppercase">TOTAL TRACKED</span>
        <div className="text-3xl font-light text-zinc-100 mt-1 font-mono tracking-tight">{totalTracked}</div>
        <div className="text-[10px] text-zinc-500 font-mono mt-1">Ecosystem modules</div>
      </div>

      <div className="px-6 py-1">
        <span className="text-[10px] text-zinc-500 font-mono tracking-wider block uppercase">NPM REGISTRY</span>
        <div className="text-3xl font-light text-zinc-100 mt-1 font-mono tracking-tight">{npmCount}</div>
        <div className="text-[10px] text-zinc-500 font-mono mt-1 flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500/80" />
          Checking node registries
        </div>
      </div>

      <div className="px-6 py-1">
        <span className="text-[10px] text-zinc-500 font-mono tracking-wider block uppercase">GITHUB MONITOR</span>
        <div className="text-3xl font-light text-zinc-100 mt-1 font-mono tracking-tight">{githubCount}</div>
        <div className="text-[10px] text-zinc-500 font-mono mt-1 flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-zinc-400" />
          Evaluating repo activity
        </div>
      </div>

      <div className="px-6 py-1">
        <span className="text-[10px] text-zinc-500 font-mono tracking-wider block uppercase">ALERT STATES</span>
        <div className="text-3xl font-mono mt-1 tracking-tight">
          {errorCount > 0 ? (
            <span className="text-red-400 font-light">{errorCount}</span>
          ) : (
            <span className="text-zinc-500 font-light">0</span>
          )}
        </div>
        <div className="text-[10px] text-zinc-500 font-mono mt-1 flex items-center gap-1">
          <span className={`w-1.5 h-1.5 rounded-full ${errorCount > 0 ? "bg-red-500" : "bg-emerald-500"}`} />
          {errorCount > 0 ? "Unstable connections" : "All services stable"}
        </div>
      </div>
    </section>
  );
}
