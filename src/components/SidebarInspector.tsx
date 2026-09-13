import React, { useState, useEffect, useRef, useCallback } from "react";
import { ExternalLink, AlertCircle, Info, RefreshCw, FileText, BookOpen, Braces } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { TrackedLibrary, LibraryDocs } from "../types";
import { getRelativeTimeString } from "../utils";

interface SidebarInspectorProps {
  selectedLibrary: TrackedLibrary | null;
  triggerRefreshAll: (targetLibraries?: TrackedLibrary[]) => Promise<void> | void;
}

type InspectorTab = "metadata" | "docs" | "raw";

const MARKDOWN_COMPONENTS = {
  h1: ({ children }: any) => (
    <h1 className="text-sm font-bold text-zinc-100 mt-4 mb-2">{children}</h1>
  ),
  h2: ({ children }: any) => (
    <h2 className="text-[13px] font-bold text-zinc-200 mt-4 mb-2">{children}</h2>
  ),
  h3: ({ children }: any) => (
    <h3 className="text-xs font-semibold text-zinc-300 mt-3 mb-1.5">{children}</h3>
  ),
  h4: ({ children }: any) => (
    <h4 className="text-[11px] font-semibold text-zinc-300 mt-2 mb-1 uppercase">{children}</h4>
  ),
  p: ({ children }: any) => (
    <p className="text-[11px] text-zinc-400 my-2 leading-relaxed font-sans font-light">{children}</p>
  ),
  a: ({ href, children }: any) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-cyan-400 hover:text-cyan-300 underline decoration-cyan-500/40 underline-offset-2"
    >
      {children}
    </a>
  ),
  code: ({ children }: any) => (
    <code className="text-[10.5px] bg-zinc-900 border border-zinc-800 rounded px-1 py-0.5 text-zinc-300 font-mono">
      {children}
    </code>
  ),
  pre: ({ children }: any) => (
    <pre className="text-[10.5px] bg-zinc-950 border border-zinc-800 rounded p-3 my-2 overflow-x-auto text-zinc-300 font-mono leading-relaxed">
      {children}
    </pre>
  ),
  ul: ({ children }: any) => (
    <ul className="list-disc list-inside space-y-1 my-2 text-[11px] text-zinc-400">{children}</ul>
  ),
  ol: ({ children }: any) => (
    <ol className="list-decimal list-inside space-y-1 my-2 text-[11px] text-zinc-400">{children}</ol>
  ),
  li: ({ children }: any) => (
    <li className="font-sans font-light leading-relaxed">{children}</li>
  ),
  blockquote: ({ children }: any) => (
    <blockquote className="border-l-2 border-zinc-700 pl-3 my-2 text-zinc-500 italic text-[11px]">
      {children}
    </blockquote>
  ),
  hr: () => <hr className="border-zinc-800 my-3" />,
  table: ({ children }: any) => (
    <table className="w-full my-2 text-[10.5px] text-zinc-400 border-collapse">{children}</table>
  ),
  thead: ({ children }: any) => <thead className="text-zinc-300">{children}</thead>,
  th: ({ children }: any) => (
    <th className="text-left border border-zinc-800 px-2 py-1 font-semibold">{children}</th>
  ),
  td: ({ children }: any) => <td className="border border-zinc-800 px-2 py-1">{children}</td>,
};

function MarkdownView({ content }: { content: string }) {
  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={MARKDOWN_COMPONENTS}>
      {content}
    </ReactMarkdown>
  );
}

export function SidebarInspector({
  selectedLibrary,
  triggerRefreshAll
}: SidebarInspectorProps) {
  const [activeTab, setActiveTab] = useState<InspectorTab>("metadata");
  const [docs, setDocs] = useState<LibraryDocs | null>(null);
  const [docsStatus, setDocsStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [docsError, setDocsError] = useState<string | null>(null);
  const docsCache = useRef<Record<string, LibraryDocs>>({});

  useEffect(() => {
    setActiveTab("metadata");
  }, [selectedLibrary?.id]);

  const loadDocs = useCallback(async () => {
    if (!selectedLibrary) return;
    const libName = selectedLibrary.name;

    if (docsCache.current[libName]) {
      setDocs(docsCache.current[libName]);
      setDocsStatus("success");
      return;
    }

    setDocsStatus("loading");
    setDocsError(null);
    try {
      const res = await fetch(`/api/library-docs?library=${encodeURIComponent(libName)}`);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Docs request failed (${res.status})`);
      }
      const payload = (await res.json()) as LibraryDocs;
      docsCache.current[libName] = payload;
      setDocs(payload);
      setDocsStatus("success");
    } catch (err: any) {
      setDocsStatus("error");
      setDocsError(err.message || "Failed to load documentation");
    }
  }, [selectedLibrary]);

  useEffect(() => {
    if (activeTab === "docs") {
      loadDocs();
    }
  }, [activeTab, loadDocs]);

  const tabs: { key: InspectorTab; label: string; icon: any }[] = [
    { key: "metadata", label: "metadata", icon: Braces },
    { key: "docs", label: "docs", icon: BookOpen },
    { key: "raw", label: "raw", icon: FileText }
  ];

  const rawJson = selectedLibrary ? JSON.stringify(selectedLibrary, null, 2) : "";

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

            {/* Tab bar */}
            <div className="flex border-b border-zinc-900">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setActiveTab(tab.key)}
                    className={`flex-1 h-9 inline-flex items-center justify-center gap-1.5 text-[10px] uppercase tracking-wide font-mono transition select-none cursor-pointer border-r last:border-r-0 border-zinc-900 ${
                      isActive
                        ? "bg-[#121214] text-zinc-200"
                        : "bg-transparent text-zinc-600 hover:text-zinc-400"
                    }`}
                  >
                    <Icon className="w-3 h-3" />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Tab content */}
            <div className="p-5 space-y-4">
              {activeTab === "metadata" && (
                <>
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

                      {selectedLibrary.description && (
                        <div className="space-y-1 block select-none">
                          <span className="text-[10px] text-zinc-500 uppercase font-mono block">Description</span>
                          <p className="text-[11.5px] text-zinc-400 leading-normal font-sans font-light">
                            {selectedLibrary.description}
                          </p>
                        </div>
                      )}

                      {selectedLibrary.type === "github" && selectedLibrary.commitMessage && (
                        <div className="space-y-1.5 font-mono">
                          <span className="text-[10px] text-zinc-500 uppercase block">LATEST COMMITTED LINE</span>
                          <p className="text-[11px] leading-relaxed italic bg-zinc-950 p-2.5 rounded border border-zinc-900 text-zinc-355">
                            "{selectedLibrary.commitMessage}"
                          </p>
                        </div>
                      )}

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
                </>
              )}

              {activeTab === "docs" && (
                <>
                  {docsStatus === "loading" && (
                    <div className="py-8 text-center space-y-2 select-none">
                      <span className="inline-block w-4 h-4 rounded-full border border-zinc-500 border-t-white animate-spin" />
                      <p className="text-[10px] text-zinc-450">Fetching upstream documentation...</p>
                    </div>
                  )}

                  {docsStatus === "error" && (
                    <div className="p-3 bg-zinc-950 border border-red-950 rounded space-y-1 text-[11px]">
                      <div className="flex items-center gap-2 text-red-500 font-semibold select-none">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>DOCS FETCH ERROR</span>
                      </div>
                      <p className="text-zinc-500 leading-relaxed font-mono break-words font-light">
                        {docsError || "Failed to load documentation for this library."}
                      </p>
                    </div>
                  )}

                  {docsStatus === "success" && docs && (
                    <div className="space-y-5">
                      {!docs.readme && !docs.changelog && (
                        <div className="space-y-3">
                          <p className="text-[11px] text-zinc-500 font-sans font-light leading-relaxed">
                            No README or CHANGELOG content is available for this library upstream.
                          </p>
                          {docs.documentation.length > 0 && (
                            <div className="space-y-1.5">
                              <span className="text-[10px] text-zinc-500 uppercase block">AVAILABLE DOC SOURCES</span>
                              {docs.documentation.map((source) => (
                                <a
                                  key={source.url}
                                  href={source.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-1.5 text-[11px] text-cyan-400 hover:text-cyan-300 transition"
                                >
                                  <ExternalLink className="w-3 h-3 shrink-0" />
                                  {source.title}
                                </a>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {docs.readme && (
                        <div className="space-y-1.5">
                          <span className="text-[10px] text-zinc-500 uppercase block flex items-center gap-1.5">
                            <BookOpen className="w-3 h-3" /> README
                          </span>
                          <div className="bg-zinc-950/60 border border-zinc-900 rounded p-3 font-mono max-h-80 overflow-y-auto">
                            <MarkdownView content={docs.readme} />
                          </div>
                        </div>
                      )}

                      {docs.changelog && (
                        <div className="space-y-1.5">
                          <span className="text-[10px] text-zinc-500 uppercase block flex items-center gap-1.5">
                            <FileText className="w-3 h-3" /> CHANGELOG
                          </span>
                          <div className="bg-zinc-950/60 border border-zinc-900 rounded p-3 font-mono max-h-80 overflow-y-auto">
                            <MarkdownView content={docs.changelog} />
                          </div>
                        </div>
                      )}

                      {docs.documentation.length > 0 && (
                        <div className="pt-1 space-y-1.5 border-t border-zinc-950">
                          <span className="text-[10px] text-zinc-500 uppercase block">UPSTREAM SOURCES</span>
                          {docs.documentation.map((source) => (
                            <a
                              key={source.url}
                              href={source.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1.5 text-[11px] text-cyan-400 hover:text-cyan-300 transition"
                            >
                              <ExternalLink className="w-3 h-3 shrink-0" />
                              {source.title}
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}

              {activeTab === "raw" && (
                <pre className="bg-zinc-950/60 border border-zinc-900 rounded p-3 text-[10.5px] text-zinc-400 font-mono leading-relaxed max-h-96 overflow-auto whitespace-pre-wrap break-words">
                  {rawJson}
                </pre>
              )}
            </div>
          </motion.div>
        ) : (
          <div className="border border-zinc-900 border-dashed rounded p-6 text-center text-zinc-500 text-xs font-mono select-none">
            <Info className="w-5 h-5 mx-auto mb-2 text-zinc-600 shrink-0" />
            Select an active repository dependency row inside the registry listing module to inspect tag statistics, modified dates, committer names, endpoint references, and live documentation.
          </div>
        )}
      </AnimatePresence>

      {/* ADDITIONAL INFORMATION STICKER / FOOTER CARD */}
      <div className="bg-[#0b0b0c] border border-zinc-900 p-4 rounded text-[11px] font-mono space-y-2 text-zinc-500">
        <span className="text-xs font-semibold text-zinc-400 flex items-center gap-1.5 select-none uppercase">
          <Info className="w-3.5 h-3.5 text-zinc-600 shrink-0" /> Proxy Architecture
        </span>
        <p className="leading-relaxed font-sans text-zinc-400 text-[11px]">
          Ecosystem checks navigate cross-origin requests safely through server-side proxies, preventing browser CORS failures. Documentation content is fetched upstream, cached for five minutes, and served to both the dashboard and AI agents via the MCP endpoint.
        </p>
        <div className="border-t border-zinc-900 pt-2 select-none text-[9.5px]">
          Default trackers reflect real unmodified tags in registry sources.
        </div>
      </div>
    </aside>
  );
}