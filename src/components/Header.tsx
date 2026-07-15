import React from "react";
import { Eye, SlidersHorizontal, Clock, RefreshCw } from "lucide-react";
import { AppSettings } from "../types";
import { ACCENT_PRESETS } from "./theme";

interface HeaderProps {
  settings: AppSettings;
  countdown: number;
  isRefreshingAll: boolean;
  setIsSettingsOpen: (open: boolean) => void;
  setSettings: React.Dispatch<React.SetStateAction<AppSettings>>;
  triggerRefreshAll: () => void;
  formatCountdown: (seconds: number) => string;
}

export function Header({
  settings,
  countdown,
  isRefreshingAll,
  setIsSettingsOpen,
  setSettings,
  triggerRefreshAll,
  formatCountdown
}: HeaderProps) {
  const activeAccent = ACCENT_PRESETS[settings.themeAccent] || ACCENT_PRESETS.cyan;

  return (
    <header className="relative border-b border-zinc-900 pb-8 mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
      <div>
        <div className="flex items-center gap-2 mb-1.5">
          <span className="inline-flex items-center text-[10px] font-mono uppercase tracking-wider text-zinc-400">
            System Registry Pulse
          </span>
          <span className={`w-1.5 h-1.5 rounded-full ${activeAccent.bg} animate-pulse`} />
          <span className="text-[10px] font-mono text-zinc-500">Live Services</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-10 h-10 bg-[#0d0d0f] border border-zinc-800 rounded shadow-inner select-none">
            <Eye className={`w-5.5 h-5.5 ${activeAccent.text} animate-pulse animate-duration-1000`} />
            <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${activeAccent.bg} opacity-75`}></span>
              <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${activeAccent.bg}`}></span>
            </span>
          </div>
          <h1 className="text-3xl font-light text-white tracking-tight leading-none font-mono uppercase animate-none">
            LibWatch
          </h1>
        </div>
        <p className="text-xs text-zinc-400 mt-2 max-w-xl font-light">
          Tracks elapsed modification times and release activity trends across NPM packages and GitHub repositories.
        </p>
      </div>

      {/* Schedulers and manual refresh handlers */}
      <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
        
        {/* Settings button */}
        <button
          onClick={() => setIsSettingsOpen(true)}
          className="flex items-center gap-2 bg-[#0d0d0f] hover:bg-zinc-900/60 border border-zinc-900 hover:border-zinc-800 px-3 py-2 text-zinc-400 hover:text-white font-mono text-[11px] rounded transition select-none cursor-pointer h-9 shadow-inner"
          title="Configure synchronization frequency and keyboard hotkeys"
        >
          <SlidersHorizontal className="w-3.5 h-3.5 text-zinc-500" />
          <span>SETTINGS</span>
        </button>

        {/* Countdown / Clock Widget */}
        <div className="flex items-center gap-2.5 bg-[#0d0d0f] border border-zinc-900 px-3.5 py-2 rounded text-zinc-350 font-mono h-9 shadow-inner">
          <Clock className="w-3.5 h-3.5 text-zinc-500" />
          
          <div className="text-xs">
            {settings.autoRefreshActive ? (
              <span>Next sync in <strong className={`${activeAccent.text} font-medium`}>{formatCountdown(countdown)}</strong></span>
            ) : (
              <span className="text-zinc-500">Auto-sync paused</span>
            )}
          </div>

          <button 
            type="button"
            onClick={() => setSettings(prev => ({ ...prev, autoRefreshActive: !prev.autoRefreshActive }))}
            className="text-[10px] uppercase tracking-wider text-zinc-400 hover:text-white border-l border-zinc-850 pl-2.5 ml-1 transition cursor-pointer"
          >
            {settings.autoRefreshActive ? "Pause" : "Resume"}
          </button>
        </div>

        <button
          onClick={() => triggerRefreshAll()}
          disabled={isRefreshingAll}
          className={`px-4 py-2 ${activeAccent.bg} hover:brightness-110 text-black font-semibold text-xs rounded transition duration-200 inline-flex items-center gap-2 disabled:opacity-50 select-none shadow-sm cursor-pointer h-9`}
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshingAll ? "animate-spin" : ""}`} />
          <span>Sync Now</span>
          <kbd className="hidden sm:inline-block text-[9px] font-mono font-bold opacity-75 px-1 py-0.5 rounded border border-black/10 bg-black/15">
            {settings.shortcutSyncAll.toUpperCase()}
          </kbd>
        </button>
      </div>
    </header>
  );
}
