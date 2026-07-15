import React from "react";
import { ExternalLink, AlertCircle, Info, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { TrackedLibrary } from "../types";
import { getRelativeTimeString } from "../utils";

interface SidebarInspectorProps {
  selectedLibrary: TrackedLibrary | null;
  triggerRefreshAll: (targetLibraries?: TrackedLibrary[]) => Promise<void> | void;
}

export function SidebarInspector({
  selectedLibrary,
  triggerRefreshAll
}: SidebarInspectorProps) {
  return (
    <aside className="lg:col-span-1 space-y-6">
      <AnimatePresence mode="wait">
        {selectedLibrary ? (
          <motion.div 
            key={selectedLibrary.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="bg-[#0b0b0c] border border-zinc-900 rounded overflow-hidden sticky top-6 font-mono"
          >
            {/* Selected Item header */}
            <div className="p-5 border-b border-zinc-900 bg-zinc-950/40">
              {/* Header line */}
              <div className="flex justify-between items-start gap-2 mb-3">
                <span className="text-[10px] tracking-wider text-zinc-500 uppercase font-mono">
                  RESOURCE INSPECTOR
                </span>
                
                {selectedLibrary.homepage && (
                  <a 
                    href={selectedLibrary.homepage}
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="p-1 border border-zinc-850 bg-zinc-900/50 hover:bg-zinc-850 rounded text-zinc-400 hover:text-zinc-200 transition inline-flex items-center justify-center pointer-events-auto"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>

              <h2 className="text-sm font-semibold text-zinc-200 truncate leading-tight block" title={selectedLibrary.name}>
                {selectedLibrary.name}
              </h2>
              
              <p className="text-[10px] text-zinc-500 mt-2 select-none flex items-center gap-1 font-mono">
                <span className="italic">Last checked query: {getRelativeTimeString(selectedLibrary.lastUpdated)}</span>
              </p>
            </div>

            {/* Context Metrics body panel */}
            <div className="p-5 space-y-4">
              {selectedLibrary.status === "loading" && (
                <div className="py-8 text-center space-y-2 select-none">
                  <span className="inline-block w-4 h-4 rounded-full border border-zinc-500 border-t-white animate-spin" />
                  <p className="text-[10px] text-zinc-450">Querying registry metadata hosts...</p>
                </div>
              )}

              {selectedLibrary.status === "error" && (
                <div className="p-3 bg-zinc-950 border border-red-950 rounded space-y-1 text-[11px]">
                  <div className="flex items-center gap-2 text-red-500 font-semibold select-none">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>SYNC ERROR RESPONSE</span>
                  </div>
                  <p className="text-zinc-500 leading-relaxed font-mono break-words font-light">
                    {selectedLibrary.error || "The server proxy failed to fetch metadata. This can occur under API rate resets or incorrect packages."}
                  </p>
                </div>
              )}

              {selectedLibrary.status === "success" && (
                <div className="space-y-4 text-xs">
                  {/* YAML Structure Data list */}
                  <div className="bg-zinc-950/60 border border-zinc-900 rounded p-3 text-[11px] text-zinc-400 space-y-2.5">
                    <div className="flex justify-between">
                      <span className="text-zinc-500 font-mono">IDENTIFIER:</span>
                      <span className="text-zinc-300 font-bold">{selectedLibrary.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500 font-mono">ECOSYSTEM:</span>
                      <span className="text-zinc-400">{selectedLibrary.type === "npm" ? "node registry" : "github host"}</span>
                    </div>
                    {selectedLibrary.type === "npm" && (
                      <div className="flex justify-between">
                        <span className="text-zinc-500 font-mono">LATEST_TAG:</span>
                        <span className="text-zinc-200 font-bold bg-zinc-900 border border-zinc-850 px-1.5 py-0.2 rounded text-[10px]/none">
                          v{selectedLibrary.latestVersion || "Unknown"}
                        </span>
                      </div>
                    )}
                    {selectedLibrary.type === "github" && selectedLibrary.authorName && (
                      <div className="flex justify-between font-mono">
                        <span className="text-zinc-500">COMMITTER:</span>
                        <span className="text-zinc-400">{selectedLibrary.authorName}</span>
                      </div>
                    )}
                  </div>

                  {/* Description field */}
                  {selectedLibrary.description && (
                    <div className="space-y-1 block select-none">
                      <span className="text-[10px] text-zinc-500 uppercase font-mono block">Description</span>
                      <p className="text-[11.5px] text-zinc-400 leading-normal font-sans font-light">
                        {selectedLibrary.description}
                      </p>
                    </div>
                  )}

                  {/* GitHub Commit Block (terminal style) */}
                  {selectedLibrary.type === "github" && selectedLibrary.commitMessage && (
                    <div className="space-y-1.5 font-mono">
                      <span className="text-[10px] text-zinc-500 uppercase block">LATEST COMMITTED LINE</span>
                      <p className="text-[11px] leading-relaxed italic bg-zinc-950 p-2.5 rounded border border-zinc-900 text-zinc-355">
                        "{selectedLibrary.commitMessage}"
                      </p>
                    </div>
                  )}

                  {/* Mapped times and updates timestamps log */}
                  <div className="pt-2.5 space-y-2 border-t border-zinc-950 text-xs">
                    <div className="flex justify-between items-center select-none">
                      <span className="text-zinc-500 font-mono text-[10px]">PRECISE UPDATE</span>
                      <span className="text-zinc-350 font-mono font-medium text-[11px]">
                        {selectedLibrary.lastUpdated ? new Date(selectedLibrary.lastUpdated).toISOString().replace("T", " ").substring(0, 19) : "N/A"}
                      </span>
                    </div>

                    <div className="flex justify-between items-center select-none border-t border-zinc-950 pt-2">
                      <span className="text-zinc-500 font-mono text-[10px]">SYNC AT</span>
                      <span className="text-zinc-400 font-mono text-[11px]">
                        {selectedLibrary.lastChecked ? new Date(selectedLibrary.lastChecked).toISOString().replace("T", " ").substring(0, 19) : "N/A"}
                      </span>
                    </div>
                  </div>

                  {/* Direct link triggers and check status info */}
                  <div className="pt-2">
                    <button
                      onClick={() => triggerRefreshAll([selectedLibrary])}
                      className="w-full h-9 border border-zinc-800 hover:border-zinc-700 bg-[#121214] hover:bg-zinc-900 text-zinc-200 text-[11px] font-mono rounded transition inline-flex items-center justify-center gap-1.5 select-none cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5" /> REGISTER RE-SYNC
                    </button>
                  </div>
                </div>
              )}

              {!selectedLibrary.status && selectedLibrary.status !== "loading" && (
                <div className="py-8 text-center text-zinc-600 text-[11px] select-none font-mono">
                  No telemetry synchronizers loaded. Sync target to observe.
                </div>
              )}
            </div>
          </motion.div>
        ) : (
          <div className="border border-zinc-900 border-dashed rounded p-6 text-center text-zinc-500 text-xs font-mono select-none">
            <Info className="w-5 h-5 mx-auto mb-2 text-zinc-600 shrink-0" />
            Select an active repository dependency row inside the registry listing module to inspect tag statistics, modified dates, committer names, and endpoint references.
          </div>
        )}
      </AnimatePresence>

      {/* ADDITIONAL INFORMATION STICKER / FOOTER CARD */}
      <div className="bg-[#0b0b0c] border border-zinc-900 p-4 rounded text-[11px] font-mono space-y-2 text-zinc-500">
        <span className="text-xs font-semibold text-zinc-400 flex items-center gap-1.5 select-none uppercase">
          <Info className="w-3.5 h-3.5 text-zinc-600 shrink-0" /> Proxy Architecture
        </span>
        <p className="leading-relaxed font-sans text-zinc-400 text-[11px]">
          Ecosystem checks navigate cross-origin requests safely through server-side proxies, preventing browser CORS failures. Hour-based cache locks prevent API depletion.
        </p>
        <div className="border-t border-zinc-900 pt-2 select-none text-[9.5px]">
          Default trackers reflect real unmodified tags in registry sources.
        </div>
      </div>
    </aside>
  );
}
