import React, { useState } from "react";
import { 
  GripVertical, 
  Package, 
  Github, 
  ChevronDown, 
  ChevronLeft, 
  ChevronRight, 
  Trash2, 
  Star, 
  AlertCircle, 
  Users, 
  GitFork, 
  HardDrive, 
  Clock, 
  Info,
  ArrowUpDown,
  ExternalLink,
  Minus,
  TrendingUp,
  TrendingDown
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip as RechartsTooltip 
} from "recharts";
import { TrackedLibrary, SortField, SortOrder, AppSettings } from "../types";
import { getRelativeTimeString, formatFullDate, generate30DayTrend } from "../utils";
import { Tooltip } from "./Tooltip";
import { ACCENT_PRESETS } from "./theme";

interface LibraryTableProps {
  libraries: TrackedLibrary[];
  processedLibraries: TrackedLibrary[];
  paginatedLibraries: TrackedLibrary[];
  selectedLibId: string | null;
  setSelectedLibId: (id: string | null) => void;
  expandedLibIds: Record<string, boolean>;
  toggleRowExpanded: (id: string) => void;
  currentPage: number;
  setCurrentPage: React.Dispatch<React.SetStateAction<number>>;
  itemsPerPage: number;
  setItemsPerPage: React.Dispatch<React.SetStateAction<number>>;
  totalPages: number;
  indexFirstItem: number;
  indexLastItem: number;
  totalItems: number;
  isPaging: boolean;
  sortBy: SortField;
  toggleSort: (field: SortField) => void;
  sortOrder: SortOrder;
  handleRemoveLibrary: (id: string, name: string) => void;
  draggedIdx: number | null;
  setDraggedIdx: (idx: number | null) => void;
  dragOverIdx: number | null;
  setDragOverIdx: (idx: number | null) => void;
  handleDragStart: (e: React.DragEvent, index: number) => void;
  handleDragOver: (e: React.DragEvent, index: number) => void;
  handleDrop: (e: React.DragEvent, index: number) => void;
  handleDragEnd: () => void;
  settings: AppSettings;
  lastGlobalSyncTime: string | null;
}

export function LibraryTable({
  libraries,
  processedLibraries,
  paginatedLibraries,
  selectedLibId,
  setSelectedLibId,
  expandedLibIds,
  toggleRowExpanded,
  currentPage,
  setCurrentPage,
  itemsPerPage,
  setItemsPerPage,
  totalPages,
  indexFirstItem,
  indexLastItem,
  totalItems,
  isPaging,
  sortBy,
  toggleSort,
  sortOrder,
  handleRemoveLibrary,
  draggedIdx,
  dragOverIdx,
  handleDragStart,
  handleDragOver,
  handleDrop,
  handleDragEnd,
  settings,
  lastGlobalSyncTime
}: LibraryTableProps) {
  // Drag state for element-level trigger check
  const [dragReadyId, setDragReadyId] = useState<string | null>(null);

  const activeAccent = ACCENT_PRESETS[settings.themeAccent] || ACCENT_PRESETS.cyan;
  const tdClass = settings.denseMode ? "p-2.5 md:p-3" : "p-4";

  // Helper to determine the activity trend (accelerating, stable, or slowing down)
  const getTrendIcon = (lib: TrackedLibrary) => {
    if (!lib.lastUpdated) return <Minus className="w-3.5 h-3.5 text-zinc-700 shrink-0 select-none animate-none" />;
    
    const refDate = lib.lastChecked ? new Date(lib.lastChecked) : new Date();
    const updatedDate = new Date(lib.lastUpdated);
    const diffMs = refDate.getTime() - updatedDate.getTime();
    const diffDays = Math.max(0, diffMs / (1000 * 60 * 60 * 24));

    if (diffDays <= 14) {
      return <span className="inline-flex shrink-0" title={`Accelerating: updated ${Math.round(diffDays)} days ago.`}><TrendingUp className="w-3.5 h-3.5 text-emerald-500 select-none cursor-help animate-none" /></span>;
    } else if (diffDays <= 45) {
      return <span className="inline-flex shrink-0" title={`Stable: updated ${Math.round(diffDays)} days ago.`}><Minus className="w-3.5 h-3.5 text-zinc-500 select-none cursor-help animate-none" /></span>;
    } else {
      return <span className="inline-flex shrink-0" title={`Slowing Down: updated ${Math.round(diffDays)} days ago.`}><TrendingDown className="w-3.5 h-3.5 text-red-500 select-none cursor-help animate-none" /></span>;
    }
  };

  const getTrendDetails = (lib: TrackedLibrary) => {
    if (!lib.lastUpdated) return "Checking telemetry history...";
    const refDate = lib.lastChecked ? new Date(lib.lastChecked) : new Date();
    const updatedDate = new Date(lib.lastUpdated);
    const diffMs = refDate.getTime() - updatedDate.getTime();
    const diffDays = Math.max(0, diffMs / (1000 * 60 * 60 * 24));
    const daysInt = Math.round(diffDays);

    if (diffDays <= 14) {
      return `Accelerating activity: updated ${daysInt} day${daysInt !== 1 ? "s" : ""} prior to checking.`;
    } else if (diffDays <= 45) {
      return `Stable pace: updated ${daysInt} days prior to checking.`;
    } else {
      return `Slowing activity: updated ${daysInt} days prior to checking.`;
    }
  };

  return (
    <div className="border border-zinc-900 rounded bg-[#0b0b0c] overflow-hidden">
      
      <div className="overflow-x-auto text-left">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-zinc-900 bg-zinc-950/60 text-[10px] font-mono tracking-wider text-zinc-550 select-none">
              <th className="py-1.5 px-3 w-[45px]"></th>
              <th 
                onClick={() => toggleSort("name")}
                className="py-1.5 px-4 font-normal cursor-pointer hover:text-zinc-300 hover:bg-zinc-900/30 transition min-w-[190px]"
              >
                <Tooltip content="NPM Package or GitHub repository path being tracked">
                  <div className="flex items-center gap-1 h-9 font-mono">
                    RESOURCE IDENTIFIER
                    <ArrowUpDown className="w-3 h-3 text-zinc-600 shrink-0" />
                  </div>
                </Tooltip>
              </th>
              
              <th 
                onClick={() => toggleSort("type")}
                className="py-1.5 px-4 font-normal cursor-pointer hover:text-zinc-300 hover:bg-zinc-900/30 transition w-[110px]"
              >
                <Tooltip content="Underlying registry platform: Node Package Manager or GitHub Host">
                  <div className="flex items-center gap-1 h-9 font-mono">
                    ECOSYSTEM
                    <ArrowUpDown className="w-3 h-3 text-zinc-600 shrink-0" />
                  </div>
                </Tooltip>
              </th>
              
              <th 
                onClick={() => toggleSort("lastUpdated")}
                className="py-1.5 px-4 font-normal cursor-pointer hover:text-zinc-300 hover:bg-zinc-900/30 transition min-w-[150px]"
              >
                <Tooltip content="Most recently indexed registry modification or commit date">
                  <div className="flex items-center gap-1 justify-end md:justify-start h-9 font-mono">
                    LAST UPDATED
                    <ArrowUpDown className="w-3 h-3 text-zinc-600 shrink-0" />
                  </div>
                </Tooltip>
              </th>

              <th 
                onClick={() => toggleSort("status")}
                className="py-1.5 px-4 font-normal cursor-pointer hover:text-zinc-300 hover:bg-zinc-900/30 transition w-[120px]"
              >
                <Tooltip content="System check validity status">
                  <div className="flex items-center gap-1 h-9 font-mono">
                    HEALTH STATE
                    <ArrowUpDown className="w-3 h-3 text-zinc-600 shrink-0" />
                  </div>
                </Tooltip>
              </th>
              <th className="py-1.5 px-4 text-right w-[60px] font-mono">ACTION</th>
            </tr>
          </thead>
          
          <tbody className="divide-y divide-zinc-950/80 font-mono">
            {isPaging ? (
              // Skeleton Rows visible while loading page
              Array.from({ length: Math.min(itemsPerPage, processedLibraries.length || itemsPerPage) }).map((_, idx) => (
                <tr key={`skel-${idx}`} className="border-l-2 border-l-transparent bg-zinc-950/20">
                    {/* 1. Grip */}
                    <td className={`${tdClass} pr-0 text-center w-[45px]`}>
                      <div className="w-3 h-3 bg-[#121214] animate-pulse rounded mx-auto" />
                    </td>
                    {/* 2. Identifier */}
                    <td className={tdClass}>
                      <div className="flex items-center gap-2.5">
                        <div className="w-3.5 h-3.5 bg-zinc-900 animate-pulse rounded-full" />
                        <div className="space-y-1.5 max-w-[180px] w-full">
                          <div className="h-3.5 bg-zinc-900 animate-pulse rounded w-3/4" />
                          <div className="h-2.5 bg-[#121214] animate-pulse rounded w-1/2" />
                        </div>
                      </div>
                    </td>
                    {/* 3. Ecosystem */}
                    <td className={tdClass}>
                      <div className="h-3 bg-[#121214] animate-pulse rounded w-10" />
                    </td>
                    {/* 4. Last Updated */}
                    <td className={tdClass}>
                      <div className="space-y-1 my-0.5 max-w-[90px]">
                        <div className="h-3 bg-zinc-900 animate-pulse rounded w-3/4" />
                        <div className="h-2.5 bg-[#121214] animate-pulse rounded w-1/2" />
                      </div>
                    </td>
                    {/* 5. Status */}
                    <td className={tdClass}>
                      <div className="h-3 bg-[#121214] animate-pulse rounded w-12" />
                    </td>
                    {/* 6. Untrack Action Button */}
                    <td className={`${tdClass} text-right`}>
                      <div className="w-4 h-4 bg-[#121214] animate-pulse rounded ml-auto" />
                    </td>
                  </tr>
                ))
              ) : processedLibraries.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-zinc-500 text-xs">
                    <Info className="w-5 h-5 mx-auto mb-2 text-zinc-650 shrink-0" />
                    No dependencies found matching filters on this page.
                  </td>
                </tr>
              ) : (
                paginatedLibraries.map((lib, index) => {
                  const isSelected = selectedLibId === lib.id;
                  const isExpanded = !!expandedLibIds[lib.id];
                  const formattedTime = getRelativeTimeString(lib.lastUpdated);
                  
                  return (
                    <React.Fragment key={lib.id}>
                      <motion.tr
                        draggable={dragReadyId === lib.id}
                        onDragStart={(e) => handleDragStart(e as unknown as React.DragEvent, index)}
                        onDragOver={(e) => handleDragOver(e, index)}
                        onDrop={(e) => handleDrop(e, index)}
                        onDragEnd={handleDragEnd}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.12 }}
                        onClick={() => {
                          setSelectedLibId(lib.id);
                          toggleRowExpanded(lib.id);
                        }}
                        className={`group cursor-pointer border-l-2 transition-all duration-150 select-none ${
                          draggedIdx === index
                            ? "opacity-30 bg-[#0d0d0f] border-l-zinc-800"
                            : dragOverIdx === index
                            ? `bg-zinc-900 ${activeAccent.borderLeft}`
                            : isSelected 
                            ? `bg-[#0f0f11] ${activeAccent.borderLeft}` 
                            : "hover:bg-[#0c0c0d] border-l-transparent"
                        }`}
                      >
                        
                        {/* Grip Drag Handle Col */}
                        <td 
                          onMouseEnter={() => setDragReadyId(lib.id)}
                          onMouseLeave={() => setDragReadyId(null)}
                          onClick={(e) => e.stopPropagation()}
                          className={`${tdClass} pr-0 text-center w-[45px] cursor-grab active:cursor-grabbing text-zinc-700 hover:text-zinc-500 transition select-none`}
                        >
                          <GripVertical className="w-3.5 h-3.5 inline" />
                        </td>
                        
                        {/* Identifier Col */}
                        <td className={tdClass}>
                          <div className="flex items-center gap-2.5">
                            {lib.type === "npm" ? (
                              <Package className="w-3.5 h-3.5 text-zinc-500 group-hover:text-zinc-300 transition shrink-0" />
                            ) : (
                              <Github className="w-3.5 h-3.5 text-zinc-500 group-hover:text-zinc-300 transition shrink-0" />
                            )}
                            <div className="truncate max-w-[200px] md:max-w-xs">
                              <div className="text-xs font-semibold text-zinc-200 group-hover:text-white transition tracking-tight flex items-center gap-1.5 font-sans">
                                <span>{lib.name}</span>
                                <ChevronDown className={`w-3.5 h-3.5 text-zinc-600 transition-transform duration-200 shrink-0 ${isExpanded ? "rotate-180 text-zinc-300" : ""}`} />
                              </div>
                              <div className="text-[10px] text-zinc-500 truncate max-w-[190px] md:max-w-[240px] mt-0.5">
                                {lib.type === "npm" && lib.latestVersion ? (
                                  <span>v{lib.latestVersion}</span>
                                ) : lib.commitMessage ? (
                                  <span className="italic truncate block">"{lib.commitMessage}"</span>
                                ) : (
                                  <span className="text-zinc-600 font-mono">Awaiting status query...</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Ecosystem Col */}
                        <td className={`${tdClass} text-[10px] text-zinc-400 font-mono`}>
                          <span className="uppercase tracking-wider">
                            {lib.type}
                          </span>
                        </td>

                        {/* Last updated Col */}
                        <td className={`${tdClass} text-right md:text-left`}>
                          <div className="flex items-center gap-2 justify-end md:justify-start">
                            <div className="text-xs text-zinc-350 font-medium font-sans">
                              <span>{lib.status === "loading" ? "indexing..." : formattedTime}</span>
                            </div>
                            {lib.status !== "loading" && lib.lastUpdated && (
                              <div className="inline-flex items-center" title={getTrendDetails(lib)}>
                                {getTrendIcon(lib)}
                              </div>
                            )}
                          </div>
                          {lib.lastUpdated && (
                            <div className="text-[10px] text-zinc-500 mt-0.5 select-none hidden sm:block font-mono">
                              {new Date(lib.lastUpdated).toISOString().split("T")[0]}
                            </div>
                          )}
                        </td>

                        {/* Status indicator */}
                        <td className={tdClass}>
                          <div className="flex items-center">
                            {lib.status === "loading" ? (
                              <Tooltip content="Retrieving latest metadata payload from live registry">
                                <span className="inline-flex items-center gap-1 text-[10px] text-zinc-500 select-none font-mono">
                                  • syncing
                                </span>
                              </Tooltip>
                            ) : lib.status === "success" ? (
                              <Tooltip content="Data synchronized successfully and cached safely">
                                <span className="inline-flex items-center gap-1 text-[10px] text-zinc-400 select-none font-mono">
                                  • stable
                                </span>
                              </Tooltip>
                            ) : lib.status === "error" ? (
                              <Tooltip content={lib.error || "Sync failed: click to see diagnostic details"}>
                                <span className="inline-flex items-center gap-1 text-[10px] text-red-500 select-none font-mono cursor-help">
                                  • error
                                </span>
                              </Tooltip>
                            ) : (
                              <Tooltip content="Awaiting automatic or manual sync trigger">
                                <span className="inline-flex items-center gap-1 text-[10px] text-zinc-600 select-none font-mono">
                                  • idle
                                </span>
                              </Tooltip>
                            )}
                          </div>
                        </td>

                        {/* Action button */}
                        <td className={`${tdClass} text-right`}>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveLibrary(lib.id, lib.name);
                            }}
                            className="p-1 text-zinc-600 hover:text-red-455 rounded transition cursor-pointer"
                            title={`Remove ${lib.name}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>

                      </motion.tr>

                      {/* Expandable Accordion Subrow */}
                      <AnimatePresence initial={false}>
                        {isExpanded && (
                          <motion.tr
                            key={`${lib.id}-expanded`}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.15 }}
                            className="bg-[#08080a]/90 border-t border-b border-zinc-900/60"
                          >
                            <td colSpan={6} className="p-0">
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.22, ease: "easeInOut" }}
                                className="overflow-hidden"
                              >
                                <div className="p-5 text-zinc-300 font-sans border-l-2 border-l-zinc-500/85 bg-[#070708]/95">
                                  {/* Description and Mini-Trend Analytics Split Grid */}
                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-5">
                                    {/* Left Column: Telemetry Description */}
                                    <div className="md:col-span-1 flex flex-col justify-between space-y-4 text-left">
                                      <div>
                                        <div className="text-[10px] text-zinc-500 font-mono tracking-wider uppercase mb-1">Telemetry Description</div>
                                        <p className="text-zinc-300 text-xs font-light tracking-wide leading-relaxed max-h-[120px] overflow-y-auto pr-1">
                                          {lib.description || "No registry description provided for this resource."}
                                        </p>
                                      </div>
                                      <div>
                                        <div className="text-[10px] text-zinc-500 font-mono tracking-wider uppercase mb-0.5">Ecosystem Context</div>
                                        <div className="text-xs text-zinc-400 font-light font-mono">
                                          {lib.type === "npm" ? (
                                            <span>NPM Weekly Download Check Pulse</span>
                                          ) : (
                                            <span>GitHub Repo Commits Velocity Pulse</span>
                                          )}
                                        </div>
                                      </div>
                                    </div>

                                    {/* Right Column: Mini Trend Chart Block */}
                                    <div className="md:col-span-2 bg-[#09090b]/80 border border-zinc-900 rounded p-4 flex flex-col justify-between h-[170px] text-left">
                                      <div className="flex items-center justify-between text-[10px] font-mono tracking-wider text-zinc-500 select-none uppercase">
                                        <span>30-Day Activity Trend</span>
                                        <span className="text-zinc-400 font-medium">
                                          {lib.type === "npm" ? "Daily Requests" : "Daily Commits"}
                                        </span>
                                      </div>
                                      <div className="w-full h-[120px] mt-2 relative">
                                        <ResponsiveContainer width="100%" height="100%">
                                          <AreaChart 
                                            data={generate30DayTrend(lib.name, lib.type)}
                                            margin={{ top: 5, right: 5, left: -25, bottom: 0 }}
                                          >
                                            <defs>
                                              <linearGradient id={`colorValue-${lib.id.replace(/[^a-zA-Z0-9]/g, '')}`} x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor={lib.type === 'npm' ? '#f59e0b' : '#22d3ee'} stopOpacity={0.15}/>
                                                <stop offset="95%" stopColor={lib.type === 'npm' ? '#f59e0b' : '#22d3ee'} stopOpacity={0.0}/>
                                              </linearGradient>
                                            </defs>
                                            <XAxis 
                                              dataKey="date" 
                                              stroke="#52525b" 
                                              fontSize={9}
                                              tickLine={false}
                                              axisLine={false}
                                              dy={4}
                                            />
                                            <YAxis 
                                              stroke="#52525b" 
                                              fontSize={8}
                                              tickLine={false}
                                              axisLine={false}
                                              width={35}
                                              tickFormatter={(tick) => {
                                                if (tick >= 1000) return `${(tick / 1000).toFixed(0)}k`;
                                                return tick;
                                              }}
                                            />
                                            <RechartsTooltip 
                                              content={({ active, payload }) => {
                                                if (active && payload && payload.length) {
                                                  const data = payload[0].payload;
                                                  return (
                                                    <div className="bg-[#121214] border border-zinc-800 p-2 rounded shadow-xl font-mono text-[10px] text-zinc-300 text-left">
                                                      <div className="text-zinc-500 uppercase">{data.date}</div>
                                                      <div className="font-bold">
                                                        {lib.type === 'npm' ? `${data.value.toLocaleString()} telemetry checks` : `${data.value} commits`}
                                                      </div>
                                                    </div>
                                                  );
                                                }
                                                return null;
                                              }}
                                            />
                                            <Area 
                                              type="monotone" 
                                              dataKey="value" 
                                              stroke={lib.type === 'npm' ? '#f59e0b' : '#22d3ee'}
                                              strokeWidth={1.5}
                                              fillOpacity={1} 
                                              fill={`url(#colorValue-${lib.id.replace(/[^a-zA-Z0-9]/g, '')})`} 
                                            />
                                          </AreaChart>
                                        </ResponsiveContainer>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Metrics Grid */}
                                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-left">
                                    {/* Stars */}
                                    <div className="flex items-center gap-2.5 bg-[#0a0a0c] border border-zinc-900/80 p-3 rounded">
                                      <Star className="w-4 h-4 text-amber-500 shrink-0 select-none animate-none" />
                                      <div>
                                        <div className="text-[9px] text-zinc-500 font-mono tracking-wider select-none">STARS</div>
                                        <div className="text-xs font-bold text-zinc-200 font-mono">
                                          {lib.stars !== undefined ? lib.stars.toLocaleString() : "—"}
                                        </div>
                                      </div>
                                    </div>

                                    {/* Open Issues */}
                                    <div className="flex items-center gap-2.5 bg-[#0a0a0c] border border-zinc-900/80 p-3 rounded">
                                      <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 select-none animate-none" />
                                      <div>
                                        <div className="text-[9px] text-zinc-500 font-mono tracking-wider select-none">OPEN_ISSUES</div>
                                        <div className="text-xs font-bold text-zinc-200 font-mono">
                                          {lib.openIssues !== undefined ? lib.openIssues.toLocaleString() : "—"}
                                        </div>
                                      </div>
                                    </div>

                                    {/* Registry specific: Downloads or Forks */}
                                    {lib.type === "npm" ? (
                                      <div className="flex items-center gap-2.5 bg-[#0a0a0c] border border-zinc-900/80 p-3 rounded">
                                        <Users className="w-4 h-4 text-emerald-400 shrink-0 select-none animate-none" />
                                        <div>
                                          <div className="text-[9px] text-zinc-500 font-mono tracking-wider select-none">DOWNLOADS_WK</div>
                                          <div className="text-xs font-bold text-zinc-200 font-mono">
                                            {lib.downloads !== undefined ? lib.downloads.toLocaleString() : "—"}
                                          </div>
                                        </div>
                                      </div>
                                    ) : (
                                      <div className="flex items-center gap-2.5 bg-[#0a0a0c] border border-zinc-900/80 p-3 rounded">
                                        <GitFork className="w-4 h-4 text-indigo-400 shrink-0 select-none animate-none" />
                                        <div>
                                          <div className="text-[9px] text-zinc-500 font-mono tracking-wider select-none">FORKS</div>
                                          <div className="text-xs font-bold text-zinc-200 font-mono">
                                            {lib.forks !== undefined ? lib.forks.toLocaleString() : "—"}
                                          </div>
                                        </div>
                                      </div>
                                    )}

                                    {/* Registry specific: Size or Watchers */}
                                    {lib.type === "npm" ? (
                                      <div className="flex items-center gap-2.5 bg-[#0a0a0c] border border-zinc-900/80 p-3 rounded">
                                        <HardDrive className="w-4 h-4 text-amber-400 shrink-0 select-none animate-none" />
                                        <div>
                                          <div className="text-[9px] text-zinc-500 font-mono tracking-wider select-none">LICENSE / SIZE</div>
                                          <div className="text-xs font-bold text-zinc-200 font-mono">
                                            {lib.license ?? "MIT"} ({lib.size !== undefined ? `${lib.size}KB` : "15KB"})
                                          </div>
                                        </div>
                                      </div>
                                    ) : (
                                      <div className="flex items-center gap-2.5 bg-[#0a0a0c] border border-zinc-900/80 p-3 rounded">
                                        <Users className="w-4 h-4 text-sky-400 shrink-0 select-none animate-none" />
                                        <div>
                                          <div className="text-[9px] text-zinc-500 font-mono tracking-wider select-none">SUBSCRIBERS</div>
                                          <div className="text-xs font-bold text-zinc-200 font-mono">
                                            {lib.subscribers !== undefined ? lib.subscribers.toLocaleString() : "—"}
                                          </div>
                                        </div>
                                      </div>
                                    )}
                                  </div>

                                  {/* Footnote telemetry metrics */}
                                  <div className="mt-4 pt-3 border-t border-zinc-900/80 flex flex-wrap justify-between items-center gap-3">
                                    <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-[10px] font-mono text-zinc-500 text-left">
                                      <div>
                                        <span className="text-zinc-650">REGISTRY:</span>{" "}
                                        <span className="text-zinc-400">{lib.type === "npm" ? "node/npm registry" : "github host"}</span>
                                      </div>
                                      {lib.latestVersion && (
                                        <div>
                                          <span className="text-zinc-650">VERSION:</span>{" "}
                                          <span className="text-zinc-400">v{lib.latestVersion}</span>
                                        </div>
                                      )}
                                      {lib.authorName && (
                                        <div>
                                          <span className="text-zinc-650">AUTHOR:</span>{" "}
                                          <span className="text-zinc-400">{lib.authorName}</span>
                                        </div>
                                      )}
                                      {lib.lastChecked && (
                                        <div>
                                          <span className="text-zinc-650">UPDATED_AT:</span>{" "}
                                          <span className="text-zinc-400">{new Date(lib.lastChecked).toLocaleTimeString()}</span>
                                        </div>
                                      )}
                                    </div>

                                    {lib.homepage && (
                                      <a 
                                        href={lib.homepage} 
                                        target="_blank" 
                                        rel="noreferrer"
                                        className="inline-flex items-center gap-1.5 text-[10px] font-mono uppercase bg-[#141417]/80 hover:bg-zinc-900 text-zinc-444 hover:text-white px-2.5 py-1 rounded border border-zinc-850 hover:border-zinc-800 transition cursor-pointer select-none"
                                      >
                                        <ExternalLink className="w-3.5 h-3.5 text-zinc-500" /> Open External Host
                                      </a>
                                    )}
                                  </div>
                                </div>
                              </motion.div>
                            </td>
                          </motion.tr>
                        )}
                      </AnimatePresence>
                    </React.Fragment>
                  );
                })
              )}
          </tbody>
        </table>
      </div>

      {/* Dynamic pagination menu */}
      {totalPages > 1 && (
        <div className="p-4 border-t border-zinc-900 bg-zinc-950/20 flex flex-col sm:flex-row justify-between items-center gap-3">
          <div className="flex items-center gap-2 text-xs text-zinc-500 font-mono select-none">
            <span>Show:</span>
            <select
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="bg-[#09090b] border border-zinc-900 text-zinc-305 text-[11px] rounded px-1.5 py-0.5 font-mono hover:border-zinc-800 cursor-pointer focus:outline-none"
            >
              <option value={5}>5 track</option>
              <option value={10}>10 track</option>
              <option value={20}>20 track</option>
            </select>
            <span className="text-zinc-705">|</span>
            <span>Range {indexFirstItem + 1} - {Math.min(indexLastItem, totalItems)} of {totalItems}</span>
          </div>
          
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-2 py-1 border border-zinc-900 hover:border-zinc-805 bg-zinc-950 hover:bg-zinc-900 rounded text-[11px] text-zinc-400 hover:text-zinc-200 transition disabled:opacity-30 disabled:hover:bg-zinc-950 disabled:hover:border-zinc-900 disabled:cursor-not-allowed select-none cursor-pointer flex items-center gap-1 font-mono"
            >
              <ChevronLeft className="w-3 h-3" /> PREV
            </button>
            
            {Array.from({ length: totalPages }, (_, idx) => idx + 1).map(page => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`px-2.5 py-1 rounded text-[11px] font-mono border transition select-none cursor-pointer ${
                  currentPage === page
                    ? "border-zinc-750 bg-zinc-900 text-white font-medium"
                    : "border-zinc-900 hover:border-zinc-800 bg-zinc-950 hover:bg-zinc-905 text-zinc-450 hover:text-zinc-250"
                }`}
              >
                {page}
              </button>
            ))}
            
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-2 py-1 border border-zinc-900 hover:border-zinc-805 bg-zinc-950 hover:bg-zinc-900 rounded text-[11px] text-zinc-400 hover:text-zinc-200 transition disabled:opacity-30 disabled:hover:bg-zinc-950 disabled:hover:border-zinc-900 disabled:cursor-not-allowed select-none cursor-pointer flex items-center gap-1 font-mono"
            >
              NEXT <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}

      {/* Bottom statistics logs */}
      <div className="p-3 border-t border-zinc-900 px-4 bg-zinc-950/40 text-[10px] font-mono text-zinc-500 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 select-none">
        <div className="flex flex-wrap gap-x-4 gap-y-1.5 items-center">
          <span>INDEXED: {processedLibraries.length} / {libraries.length} TRACKERS</span>
          <span className="hidden sm:inline text-zinc-800">|</span>
          <span>SYNCED: {libraries.filter(l => l.lastChecked).length} / {libraries.length} READY</span>
          <span className="hidden md:inline text-zinc-800">|</span>
          <span className="text-zinc-400 flex items-center gap-1">
            <Clock className="w-2.5 h-2.5 text-zinc-500 shrink-0" />
            <span>LAST GLOBAL SYNC: {lastGlobalSyncTime ? formatFullDate(lastGlobalSyncTime) : "NEVER"}</span>
          </span>
        </div>
        <div className="flex items-center gap-3 text-zinc-600 flex-wrap">
          <span className="text-[9px] uppercase tracking-wider text-zinc-500">SHORTCUTS:</span>
          <span className="inline-flex items-center gap-1">
            <kbd className="px-1 py-0.5 rounded border border-zinc-850 bg-zinc-900 text-zinc-400">{settings.shortcutSyncAll.toUpperCase()}</kbd>
            <span>Sync All</span>
          </span>
          <span className="inline-flex items-center gap-1">
            <kbd className="px-1 py-0.5 rounded border border-zinc-850 bg-zinc-900 text-zinc-400">{settings.shortcutFocusSearch.toUpperCase()}</kbd>
            <span>Filter Search</span>
          </span>
          <span className="inline-flex items-center gap-1">
            <kbd className="px-1 py-0.5 rounded border border-zinc-850 bg-zinc-900 text-zinc-400">DRAG ↕</kbd>
            <span>Prioritize Rows</span>
          </span>
        </div>
      </div>
    </div>
  );
}
