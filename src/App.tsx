import React, { useState, useEffect, useRef, FormEvent } from "react";
import { Search, X, Filter, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { TrackedLibrary, SortField, SortOrder, LibraryType, AppSettings } from "./types";
import { DEFAULT_TRACKED_LIBRARIES } from "./utils";

// Subcomponent Imports
import { ACCENT_PRESETS } from "./components/theme";
import { Header } from "./components/Header";
import { StatsOverview } from "./components/StatsOverview";
import { AddLibraryForm } from "./components/AddLibraryForm";
import { LibraryTable } from "./components/LibraryTable";
import { SidebarInspector } from "./components/SidebarInspector";
import { SettingsDrawer } from "./components/SettingsDrawer";

export default function App() {
  // Load tracked libraries from localStorage, or fallback to default seed data
  const [libraries, setLibraries] = useState<TrackedLibrary[]>(() => {
    try {
      const saved = localStorage.getItem("library_tracker_libs");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Reset loading states to idle upon load
          return parsed.map((lib: TrackedLibrary) => ({
            ...lib,
            status: lib.status === "loading" ? "idle" : lib.status
          }));
        }
      }
    } catch (e) {
      console.error("Failed to restore libraries from storage", e);
    }
    return DEFAULT_TRACKED_LIBRARIES;
  });

  // Save to localStorage whenever tracking list modifies
  useEffect(() => {
    localStorage.setItem("library_tracker_libs", JSON.stringify(libraries));
  }, [libraries]);

  // UI state
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"all" | LibraryType>("all");
  const [sortBy, setSortBy] = useState<SortField>("lastUpdated");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  
  // Selection details state
  const [selectedLibId, setSelectedLibId] = useState<string | null>(null);
  const [hasUserSelected, setHasUserSelected] = useState(false);

  // Expanded rows state Map (keyed by library id) for inline details accordion
  const [expandedLibIds, setExpandedLibIds] = useState<Record<string, boolean>>({});

  const toggleRowExpanded = (id: string) => {
    setExpandedLibIds(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleSelectLib = (id: string | null) => {
    setSelectedLibId(id);
    if (id !== null) {
      setHasUserSelected(true);
    }
  };

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [isPaging, setIsPaging] = useState(false);

  // Set isPaging to true for a brief period when page changes to show our skeleton rows
  useEffect(() => {
    setIsPaging(true);
    const timer = setTimeout(() => {
      setIsPaging(false);
    }, 420); // 420ms elegant telemetry loading transition
    return () => clearTimeout(timer);
  }, [currentPage, itemsPerPage]);

  // Drag and Drop reordering state
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);

  // Global sync success state tracking
  const [lastGlobalSyncTime, setLastGlobalSyncTime] = useState<string | null>(() => {
    try {
      return localStorage.getItem("library_tracker_last_global_sync");
    } catch {
      return null;
    }
  });

  const searchInputRef = useRef<HTMLInputElement>(null);

  // Reset to page 1 on query/filter modifications
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterType]);

  // Addition form states
  const [newLibName, setNewLibName] = useState("");
  const [newLibType, setNewLibType] = useState<LibraryType>("npm");
  const [isAdding, setIsAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [addSuccess, setAddSuccess] = useState<string | null>(null);

  // Default Settings state and persistence
  const [settings, setSettings] = useState<AppSettings>(() => {
    const defaultSettings: AppSettings = {
      syncIntervalValue: 60,
      syncIntervalUnit: "seconds",
      autoRefreshActive: true,
      shortcutSyncAll: "s",
      shortcutFocusSearch: "/",
      denseMode: false,
      soundEffects: true,
      themeAccent: "cyan",
      allowTelemetryShare: true,
    };
    try {
      const saved = localStorage.getItem("library_tracker_settings");
      if (saved) {
        return { ...defaultSettings, ...JSON.parse(saved) };
      }
    } catch (e) {
      console.error("Failed to restore settings", e);
    }
    return defaultSettings;
  });

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Helper to retrieve interval value converted to seconds
  const getIntervalInSeconds = (val: number, unit: "seconds" | "minutes" | "hours" | "days"): number => {
    switch (unit) {
      case "seconds": return val;
      case "minutes": return val * 60;
      case "hours": return val * 3600;
      case "days": return val * 86400;
      default: return val;
    }
  };

  // Helper to format countdown seconds into elegant human-readable strings
  const formatCountdown = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) {
      const m = Math.floor(seconds / 60);
      const s = seconds % 60;
      return `${m}m ${s}s`;
    }
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h < 24) return `${h}h ${m}m ${s}s`;
    const d = Math.floor(seconds / 86400);
    const rh = Math.floor((seconds % 86400) / 3600);
    return `${d}d ${rh}h`;
  };

  // Chime notification sound synthesis via standard web audio osc
  const playSyncSound = () => {
    if (!settings.soundEffects) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      
      const playTone = (freq: number, start: number, duration: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, start);
        
        gain.gain.setValueAtTime(0, start);
        gain.gain.linearRampToValueAtTime(0.08, start + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.start(start);
        osc.stop(start + duration);
      };
      
      playTone(523.25, ctx.currentTime, 0.22);
      playTone(659.25, ctx.currentTime + 0.1, 0.28);
    } catch (e) {
      console.warn("AudioContext chime suppressed", e);
    }
  };

  // Save settings whenever changed
  useEffect(() => {
    try {
      localStorage.setItem("library_tracker_settings", JSON.stringify(settings));
    } catch (e) {
      console.error("Failed to save settings", e);
    }
  }, [settings]);

  // Global Refresh & Auto countdown states
  const [isRefreshingAll, setIsRefreshingAll] = useState(false);
  const [countdown, setCountdown] = useState(() => 
    getIntervalInSeconds(60, "seconds")
  );
  const [manualRefreshMessage, setManualRefreshMessage] = useState<string | null>(null);

  // Time ticks state to trigger relative updates every 10 seconds locally
  const [, setTick] = useState(0);

  // Update tick state for relative times
  useEffect(() => {
    const timer = setInterval(() => {
      setTick(prev => prev + 1);
    }, 10000);
    return () => clearInterval(timer);
  }, []);

  // Auto-dismiss package addition alerts
  useEffect(() => {
    if (addSuccess) {
      const timer = setTimeout(() => {
        setAddSuccess(null);
      }, 4000); // Dissipates after 4 seconds of tracked status visibility
      return () => clearTimeout(timer);
    }
  }, [addSuccess]);

  useEffect(() => {
    if (addError) {
      const timer = setTimeout(() => {
        setAddError(null);
      }, 6000); // Closes after 6 seconds
      return () => clearTimeout(timer);
    }
  }, [addError]);

  // Fetch a single library's status
  const updateSingleLibrary = async (id: string, name: string, type: LibraryType): Promise<TrackedLibrary> => {
    const endpoint = type === "npm" 
      ? `/api/npm-update?package=${encodeURIComponent(name)}`
      : `/api/github-update?repo=${encodeURIComponent(name)}`;

    try {
      const res = await fetch(endpoint);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Proxy returned ${res.status}`);
      }
      
      const payload = await res.json();
      return {
        id,
        name,
        type,
        status: "success",
        lastUpdated: payload.lastUpdated,
        latestVersion: payload.latestVersion,
        description: payload.description,
        commitMessage: payload.commitMessage,
        authorName: payload.authorName,
        homepage: payload.homepage,
        lastChecked: new Date().toISOString(),
        error: undefined
      };
    } catch (error: any) {
      console.error(`Error updating library ${name}:`, error);
      return {
        id,
        name,
        type,
        status: "error",
        error: error.message || "Network request failed",
        lastChecked: new Date().toISOString()
      };
    }
  };

  // Perform full refresh on requested libraries
  const triggerRefreshAll = async (targetLibraries?: TrackedLibrary[]) => {
    if (isRefreshingAll) return;
    setIsRefreshingAll(true);
    const maxVal = getIntervalInSeconds(settings.syncIntervalValue, settings.syncIntervalUnit);
    setCountdown(maxVal); // Reset timer

    const listToFetch = targetLibraries || libraries;

    // Set all target libraries status to loading in one go
    setLibraries(prev => 
      prev.map(item => {
        const isTarget = listToFetch.some(t => t.id === item.id);
        return isTarget ? { ...item, status: "loading" } : item;
      })
    );

    // Parallel execution for high-speed delivery
    const promises = listToFetch.map(async (lib) => {
      const updated = await updateSingleLibrary(lib.id, lib.name, lib.type);
      return { id: lib.id, updated };
    });

    const results = await Promise.all(promises);

    setLibraries(prev => 
      prev.map(item => {
        const match = results.find(r => r.id === item.id);
        return match ? { ...item, ...match.updated } : item;
      })
    );

    setIsRefreshingAll(false);
    if (!targetLibraries) {
      const nowStr = new Date().toISOString();
      setLastGlobalSyncTime(nowStr);
      try {
        localStorage.setItem("library_tracker_last_global_sync", nowStr);
      } catch (e) {
        console.error("Failed to save global sync time", e);
      }
    }
    setManualRefreshMessage("All systems synchronized successfully.");
    playSyncSound(); // Chime plays on synchronization complete
    setTimeout(() => setManualRefreshMessage(null), 3000);
  };

  // Run on startup
  useEffect(() => {
    triggerRefreshAll();
  }, []);

  // Set up dynamic auto-refresh loop based on settings
  useEffect(() => {
    if (!settings.autoRefreshActive) return;

    const maxVal = getIntervalInSeconds(settings.syncIntervalValue, settings.syncIntervalUnit);

    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          // Trigger updates
          triggerRefreshAll();
          return maxVal;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [settings.autoRefreshActive, settings.syncIntervalValue, settings.syncIntervalUnit, libraries, isRefreshingAll]);

  // Adjust countdown immediately if syncInterval changes
  useEffect(() => {
    const maxVal = getIntervalInSeconds(settings.syncIntervalValue, settings.syncIntervalUnit);
    setCountdown(maxVal);
  }, [settings.syncIntervalValue, settings.syncIntervalUnit]);

  // Global keyboard shortcuts: Configurable keys
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Avoid firing shortcuts when user is actively filling forms or inputs
      const activeElement = document.activeElement;
      if (activeElement) {
        const tagName = activeElement.tagName.toLowerCase();
        if (
          tagName === "input" || 
          tagName === "textarea" || 
          tagName === "select" || 
          activeElement.hasAttribute("contenteditable")
        ) {
          return;
        }
      }

      const key = event.key.toLowerCase();
      const triggerKey = settings.shortcutSyncAll.toLowerCase();
      const focusKey = settings.shortcutFocusSearch.toLowerCase();

      if (key === triggerKey) {
        event.preventDefault();
        triggerRefreshAll();
      } else if (key === focusKey) {
        event.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [libraries, isRefreshingAll, settings.shortcutSyncAll, settings.shortcutFocusSearch]);

  // Add library workflow
  const handleAddLibrary = async (e: FormEvent) => {
    e.preventDefault();
    if (!newLibName.trim()) return;

    setAddError(null);
    setAddSuccess(null);
    setIsAdding(true);

    const sanitizedName = newLibName.trim().toLowerCase();

    // Prevent duplicates
    const isDuplicate = libraries.some(
      lib => lib.name.toLowerCase() === sanitizedName && lib.type === newLibType
    );

    if (isDuplicate) {
      setAddError(`That library is already listed in your active trackers`);
      setIsAdding(false);
      return;
    }

    if (newLibType === "github" && !sanitizedName.includes("/")) {
      setAddError("GitHub format must be: owner/repository (e.g., vuejs/core)");
      setIsAdding(false);
      return;
    }

    const tempId = `${newLibType}-${Date.now()}`;
    
    try {
      // Validate with lookup against backend immediately
      const result = await updateSingleLibrary(tempId, sanitizedName, newLibType);
      
      if (result.status === "error") {
        throw new Error(result.error || "The library or repository was not found. Please double-check the spelling.");
      }

      // If valid, append it with its resolved payload
      setLibraries(prev => [...prev, result]);
      setAddSuccess(`Tracked successfully! '${sanitizedName}' added.`);
      setSelectedLibId(tempId); // select added package
      setHasUserSelected(true);
      setNewLibName(""); // clear input
    } catch (err: any) {
      setAddError(err.message || "Validation check failed. Ensure the package or repository exists.");
    } finally {
      setIsAdding(false);
    }
  };

  // Remove tracking item
  const handleRemoveLibrary = (id: string, name: string) => {
    setLibraries(prev => prev.filter(lib => lib.id !== id));
    if (selectedLibId === id) {
      setSelectedLibId(null);
    }
  };

  // Reset standard setup
  const handleResetToDefaults = () => {
    if (window.confirm("Are you sure you want to restore default tracker list? This will remove custom added items.")) {
      setLibraries(DEFAULT_TRACKED_LIBRARIES);
      setSelectedLibId(null);
      setHasUserSelected(false);
      triggerRefreshAll(DEFAULT_TRACKED_LIBRARIES);
    }
  };

  // Calculate sort & filters
  const processedLibraries = libraries
    .filter(lib => {
      const matchQuery = lib.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        (lib.description || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (lib.commitMessage || "").toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchFilter = filterType === "all" || lib.type === filterType;
      
      return matchQuery && matchFilter;
    });

  // Only sort if we are not in manual prioritization mode
  if (sortBy !== "manual") {
    processedLibraries.sort((a, b) => {
      let comparison = 0;
      if (sortBy === "name") {
        comparison = a.name.localeCompare(b.name);
      } else if (sortBy === "type") {
        comparison = a.type.localeCompare(b.type);
      } else if (sortBy === "status") {
        comparison = (a.status || "").localeCompare(b.status || "");
      } else if (sortBy === "lastUpdated") {
        const dateA = a.lastUpdated ? new Date(a.lastUpdated).getTime() : 0;
        const dateB = b.lastUpdated ? new Date(b.lastUpdated).getTime() : 0;
        comparison = dateA - dateB;
      }

      return sortOrder === "asc" ? comparison : -comparison;
    });
  }

  // Pagination calculation
  const totalItems = processedLibraries.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const indexLastItem = currentPage * itemsPerPage;
  const indexFirstItem = indexLastItem - itemsPerPage;
  const paginatedLibraries = processedLibraries.slice(indexFirstItem, indexLastItem);

  // Reset user manual selection tracking whenever search queries, filters, sorting, or pagination items change.
  // This causes the system to automatically highlight/select the topmost visible item again in the new view.
  useEffect(() => {
    setHasUserSelected(false);
  }, [searchQuery, filterType, sortBy, sortOrder, currentPage, itemsPerPage]);

  // Automatically align selectedLibId to the topmost visible item on the table if the user has not made an explicit manual choice,
  // or if the currently selected library is no longer visible in the processed filtered list.
  useEffect(() => {
    const isSelectedVisible = processedLibraries.some(lib => lib.id === selectedLibId);
    
    if (!hasUserSelected || !isSelectedVisible) {
      const topLib = paginatedLibraries[0] || processedLibraries[0] || null;
      if (topLib) {
        if (selectedLibId !== topLib.id) {
          setSelectedLibId(topLib.id);
          setExpandedLibIds(prev => ({ ...prev, [topLib.id]: true }));
        }
      } else {
        if (selectedLibId !== null) {
          setSelectedLibId(null);
        }
      }
    }
  }, [processedLibraries, paginatedLibraries, selectedLibId, hasUserSelected]);

  // Drag-and-drop event handlers for manual reordering
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIdx(index);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIdx === null) return;
    if (dragOverIdx !== index) {
      setDragOverIdx(index);
    }
  };

  const handleDrop = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIdx === null || draggedIdx === index) return;
    handleReorder(draggedIdx, index);
  };

  const handleDragEnd = () => {
    setDraggedIdx(null);
    setDragOverIdx(null);
  };

  const handleReorder = (fromIdx: number, toIdx: number) => {
    const sourceLib = paginatedLibraries[fromIdx];
    const targetLib = paginatedLibraries[toIdx];
    if (!sourceLib || !targetLib) return;

    const fullFromIdx = libraries.findIndex(l => l.id === sourceLib.id);
    const fullToIdx = libraries.findIndex(l => l.id === targetLib.id);

    if (fullFromIdx !== -1 && fullToIdx !== -1) {
      const updated = [...libraries];
      const [removed] = updated.splice(fullFromIdx, 1);
      updated.splice(fullToIdx, 0, removed);
      
      setLibraries(updated);

      if (sortBy !== "manual") {
         setSortBy("manual");
         setManualRefreshMessage("Manual prioritization mode active.");
         setTimeout(() => setManualRefreshMessage(null), 3000);
      }
    }
  };

  // Calculate high-level dashboard metrics
  const totalTracked = libraries.length;
  const npmCount = libraries.filter(l => l.type === "npm").length;
  const githubCount = libraries.filter(l => l.type === "github").length;
  const errorCount = libraries.filter(l => l.status === "error").length;

  // Selected object
  const selectedLibrary = libraries.find(lib => lib.id === selectedLibId) || null;

  const toggleSort = (field: SortField) => {
    if (sortBy === field) {
      setSortOrder(prev => prev === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("desc");
    }
  };

  const activeAccent = ACCENT_PRESETS[settings.themeAccent] || ACCENT_PRESETS.cyan;

  return (
    <div className="min-h-screen bg-[#09090b] text-[#f4f4f5] font-sans tracking-tight pb-16 selection:bg-zinc-200 selection:text-black">
      
      {/* Outer wrapper */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10">
        
        {/* Header section */}
        <Header 
          settings={settings}
          countdown={countdown}
          isRefreshingAll={isRefreshingAll}
          setIsSettingsOpen={setIsSettingsOpen}
          setSettings={setSettings}
          triggerRefreshAll={triggerRefreshAll}
          formatCountdown={formatCountdown}
        />

        {/* Global manual alert feedback banners */}
        <AnimatePresence>
          {manualRefreshMessage && (
            <motion.div 
              initial={{ height: 0, opacity: 0, marginBottom: 0 }}
              animate={{ height: "auto", opacity: 1, marginBottom: 20 }}
              exit={{ height: 0, opacity: 0, marginBottom: 0 }}
              className="bg-[#09090b] border border-zinc-900 text-zinc-350 px-4 py-3 rounded text-xs flex items-center gap-3 overflow-hidden font-mono text-left"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>{manualRefreshMessage}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Stats shelf overview grid */}
        <StatsOverview 
          totalTracked={totalTracked}
          npmCount={npmCount}
          githubCount={githubCount}
          errorCount={errorCount}
        />

        {/* Dynamic split view */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* Main system controls and library registry table */}
          <main className="lg:col-span-2 space-y-6">
            
            {/* Custom resource track addition form */}
            <AddLibraryForm 
              newLibName={newLibName}
              setNewLibName={setNewLibName}
              newLibType={newLibType}
              setNewLibType={setNewLibType}
              handleAddLibrary={handleAddLibrary}
              isAdding={isAdding}
              addError={addError}
              setAddError={setAddError}
              addSuccess={addSuccess}
            />

            {/* FILTERING & SORTING TOOLBAR */}
            <div className="bg-[#0b0b0c] border border-zinc-900 p-5 rounded space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                
                {/* Search query key inputs */}
                <div className="relative md:col-span-6">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-zinc-500 block font-mono">
                    <Search className="w-3.5 h-3.5" />
                  </span>
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="filter list..."
                    className="w-full h-9 bg-[#09090b] border border-zinc-900 pl-9 pr-12 rounded text-xs focus:outline-none focus:border-zinc-500 placeholder-zinc-700 text-zinc-300 transition font-mono"
                  />
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-1.5 select-none font-mono">
                    {searchQuery ? (
                      <button 
                        type="button"
                        onClick={() => setSearchQuery("")}
                        className="text-zinc-650 hover:text-zinc-400 cursor-pointer flex items-center"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    ) : (
                      <kbd className="hidden sm:inline-block text-[9px] text-zinc-650 px-1.5 py-0.5 rounded border border-zinc-850 bg-zinc-900/40 tracking-normal">
                        {settings.shortcutFocusSearch}
                      </kbd>
                    )}
                  </div>
                </div>

                {/* Filter Selector */}
                <div className="flex items-center gap-1.5 md:col-span-4 bg-[#09090b] border border-zinc-900 px-2 rounded h-9">
                  <Filter className="w-3.5 h-3.5 text-zinc-500 ml-1 shrink-0" />
                  <span className="text-[10px] text-zinc-500 font-mono">ECO:</span>
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value as "all" | LibraryType)}
                    className="bg-[#09090b] text-[11px] text-[#f4f4f5] focus:outline-none w-full cursor-pointer h-full font-mono border-none"
                  >
                    <option value="all">All Ecosystems</option>
                    <option value="npm">NPM Registry</option>
                    <option value="github">GitHub Host</option>
                  </select>
                </div>

                {/* Reset entire tracking list directly */}
                <div className="md:col-span-2">
                  <button
                    onClick={handleResetToDefaults}
                    className="w-full h-9 border border-zinc-900 hover:border-zinc-800 text-zinc-500 hover:text-zinc-400 bg-zinc-950/20 text-[11px] font-mono rounded transition select-none flex items-center justify-center font-normal cursor-pointer"
                    title="Reset tracked registry contents to systems initial seeds"
                  >
                    Reset List
                  </button>
                </div>

              </div>
            </div>

            {/* Principal Table listings */}
            <LibraryTable 
              libraries={libraries}
              processedLibraries={processedLibraries}
              paginatedLibraries={paginatedLibraries}
              selectedLibId={selectedLibId}
              setSelectedLibId={handleSelectLib}
              expandedLibIds={expandedLibIds}
              toggleRowExpanded={toggleRowExpanded}
              currentPage={currentPage}
              setCurrentPage={setCurrentPage}
              itemsPerPage={itemsPerPage}
              setItemsPerPage={setItemsPerPage}
              totalPages={totalPages}
              indexFirstItem={indexFirstItem}
              indexLastItem={indexLastItem}
              totalItems={totalItems}
              isPaging={isPaging}
              sortBy={sortBy}
              toggleSort={toggleSort}
              sortOrder={sortOrder}
              handleRemoveLibrary={handleRemoveLibrary}
              draggedIdx={draggedIdx}
              setDraggedIdx={setDraggedIdx}
              dragOverIdx={dragOverIdx}
              setDragOverIdx={setDragOverIdx}
              handleDragStart={handleDragStart}
              handleDragOver={handleDragOver}
              handleDrop={handleDrop}
              handleDragEnd={handleDragEnd}
              settings={settings}
              lastGlobalSyncTime={lastGlobalSyncTime}
            />

          </main>

          {/* Right section inspector */}
          <SidebarInspector 
            selectedLibrary={selectedLibrary}
            triggerRefreshAll={triggerRefreshAll}
          />

        </div>

      </div>

      {/* Settings Side Sheet sliders panel */}
      <SettingsDrawer 
        isSettingsOpen={isSettingsOpen}
        setIsSettingsOpen={setIsSettingsOpen}
        settings={settings}
        setSettings={setSettings}
        handleResetToDefaults={handleResetToDefaults}
      />

    </div>
  );
}
