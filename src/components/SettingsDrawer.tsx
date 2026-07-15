import React from "react";
import { SlidersHorizontal, X, Clock, Command, Palette, Volume2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { AppSettings } from "../types";
import { ACCENT_PRESETS } from "./theme";

interface SettingsDrawerProps {
  isSettingsOpen: boolean;
  setIsSettingsOpen: (open: boolean) => void;
  settings: AppSettings;
  setSettings: React.Dispatch<React.SetStateAction<AppSettings>>;
  handleResetToDefaults: () => void;
}

export function SettingsDrawer({
  isSettingsOpen,
  setIsSettingsOpen,
  settings,
  setSettings,
  handleResetToDefaults
}: SettingsDrawerProps) {
  const activeAccent = ACCENT_PRESETS[settings.themeAccent] || ACCENT_PRESETS.cyan;

  return (
    <AnimatePresence>
      {isSettingsOpen && (
        <>
          {/* Backdrop Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSettingsOpen(false)}
            className="fixed inset-0 bg-black/60 z-40 backdrop-blur-[1px]"
          />

          {/* Slider container */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 220 }}
            style={{ width: "min(440px, 100vw)" }}
            className="fixed right-0 top-0 bottom-0 bg-[#0d0d0f] border-l border-zinc-900 z-50 shadow-2xl flex flex-col justify-between"
          >
            <div className="flex-1 overflow-y-auto p-6 font-mono scrollbar-none text-left">
              {/* Header Section */}
              <div className="flex items-center justify-between pb-5 border-b border-zinc-900/60 mb-6">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className={`w-4 h-4 ${activeAccent.text}`} />
                  <span className="text-xs font-semibold text-white tracking-wider uppercase">System Preferences</span>
                </div>
                <button
                  onClick={() => setIsSettingsOpen(false)}
                  className="p-1.5 text-zinc-500 hover:text-white rounded hover:bg-zinc-900 transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-6 text-xs text-zinc-300">
                {/* Section 1: Synchronizer Timing */}
                <div className="space-y-3 bg-zinc-950/40 p-4 rounded border border-zinc-900">
                  <div className="flex items-center gap-2 border-b border-zinc-900 pb-2 mb-1">
                    <Clock className="w-3.5 h-3.5 text-zinc-500" />
                    <span className="font-semibold text-zinc-200 uppercase tracking-wider text-[10px]">Sync Interval Controls</span>
                  </div>

                  <div className="flex items-center justify-between py-1">
                    <span className="text-zinc-400 text-[11px]">Trigger Auto-Sync</span>
                    <button
                      type="button"
                      onClick={() => setSettings(prev => ({ ...prev, autoRefreshActive: !prev.autoRefreshActive }))}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${settings.autoRefreshActive ? activeAccent.bg : "bg-zinc-800"}`}
                    >
                      <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-black shadow ring-0 transition duration-200 ease-in-out ${settings.autoRefreshActive ? "translate-x-4" : "translate-x-0"}`} />
                    </button>
                  </div>

                  <div className="space-y-1.5 pt-2">
                    <label className="text-zinc-400 block text-[11px]">Synchronize every:</label>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="number"
                        min="1"
                        max={settings.syncIntervalUnit === "seconds" ? 86400 : 1000}
                        value={settings.syncIntervalValue}
                        onChange={(e) => {
                          const val = Math.max(1, parseInt(e.target.value) || 1);
                          setSettings(prev => ({ ...prev, syncIntervalValue: val }));
                        }}
                        className="h-9 bg-zinc-950 border border-zinc-900 rounded px-2.5 text-xs text-white focus:outline-none focus:border-zinc-500 text-center"
                      />
                      <select
                        value={settings.syncIntervalUnit}
                        onChange={(e) => {
                          const unit = e.target.value as any;
                          setSettings(prev => ({ ...prev, syncIntervalUnit: unit }));
                        }}
                        className="h-9 bg-zinc-950 border border-zinc-900 rounded px-2 text-xs text-white focus:outline-none focus:border-zinc-500 cursor-pointer text-center"
                      >
                        <option value="seconds">Seconds</option>
                        <option value="minutes">Minutes</option>
                        <option value="hours">Hours</option>
                        <option value="days">Days</option>
                      </select>
                    </div>
                    <p className="text-[10px] text-zinc-500 leading-normal font-sans pt-1">
                      Determines the timeout period after which registries are re-queried for elapsed updates.
                    </p>
                  </div>
                </div>

                {/* Section 2: Shortcuts Configuration */}
                <div className="space-y-3 bg-zinc-950/40 p-4 rounded border border-zinc-900">
                  <div className="flex items-center gap-2 border-b border-zinc-900 pb-2 mb-1">
                    <Command className="w-3.5 h-3.5 text-zinc-500" />
                    <span className="font-semibold text-zinc-200 uppercase tracking-wider text-[10px]">Keyboard Shortcuts bind</span>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-zinc-400 text-[11px]">Sync All Hotkey</span>
                      <div className="relative">
                        <input
                          type="text"
                          maxLength={1}
                          value={settings.shortcutSyncAll}
                          onChange={(e) => {
                            const typed = e.target.value.toLowerCase().replace(/[^a-zA-Z0-9/]/g, "");
                            if (typed) {
                              setSettings(prev => ({ ...prev, shortcutSyncAll: typed }));
                            }
                          }}
                          className="w-12 h-8 bg-zinc-950 border border-zinc-900 text-center rounded text-white focus:outline-none focus:border-zinc-500 font-bold"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-4">
                      <span className="text-zinc-400 text-[11px]">Focus Search Hotkey</span>
                      <div className="relative">
                        <input
                          type="text"
                          maxLength={1}
                          value={settings.shortcutFocusSearch}
                          onChange={(e) => {
                            const typed = e.target.value.toLowerCase().substring(0, 1);
                            if (typed) {
                              setSettings(prev => ({ ...prev, shortcutFocusSearch: typed }));
                            }
                          }}
                          className="w-12 h-8 bg-zinc-950 border border-zinc-900 text-center rounded text-white focus:outline-none focus:border-zinc-500 font-bold"
                        />
                      </div>
                    </div>
                    <p className="text-[10px] text-zinc-500 leading-normal font-sans">
                      Pressing these keys globally (when inputs are not focused) triggers their associated system actions.
                    </p>
                  </div>
                </div>

                {/* Section 3: Accent theme and Layout */}
                <div className="space-y-3 bg-zinc-950/40 p-4 rounded border border-zinc-900">
                  <div className="flex items-center gap-2 border-b border-zinc-900 pb-2 mb-1">
                    <Palette className="w-3.5 h-3.5 text-zinc-500" />
                    <span className="font-semibold text-zinc-200 uppercase tracking-wider text-[10px]">Ecosystem Accent & Density</span>
                  </div>

                  <div className="space-y-2 text-left">
                    <label className="text-zinc-400 block pb-1 text-[11px]">Theme Accent Color:</label>
                    <div className="flex items-center gap-3">
                      {Object.keys(ACCENT_PRESETS).map((key) => {
                        const isActive = settings.themeAccent === key;
                        return (
                          <button
                            key={key}
                            type="button"
                            onClick={() => {
                              setSettings(prev => {
                                const updated = { ...prev, themeAccent: key as any };
                                localStorage.setItem("libwatch_settings", JSON.stringify(updated));
                                return updated;
                              });
                            }}
                            className={`w-6 h-6 rounded-full cursor-pointer border-2 transition-all flex items-center justify-center ${isActive ? "border-white scale-110" : "border-transparent opacity-60 hover:opacity-100"}`}
                            style={{
                              backgroundColor: key === "cyan" ? "#06b6d4" : key === "orange" ? "#f97316" : key === "emerald" ? "#10b981" : key === "violet" ? "#8b5cf6" : "#f43f5e"
                            }}
                            title={`Switch to ${key} system accent`}
                          >
                            {isActive && <div className="w-1.5 h-1.5 rounded-full bg-black" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex items-center justify-between py-1.5 border-t border-zinc-900/40 mt-3 pt-3">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-zinc-400 text-[11px]">Dense Layout Mode</span>
                      <span className="text-[10px] text-zinc-500 font-sans">Reduces table row cell height padding</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSettings(prev => ({ ...prev, denseMode: !prev.denseMode }))}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${settings.denseMode ? activeAccent.bg : "bg-zinc-800"}`}
                    >
                      <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-black shadow ring-0 transition duration-200 ease-in-out ${settings.denseMode ? "translate-x-4" : "translate-x-0"}`} />
                    </button>
                  </div>
                </div>

                {/* Section 4: Audio preferences and Telemetry */}
                <div className="space-y-3 bg-zinc-950/40 p-4 rounded border border-zinc-900">
                  <div className="flex items-center gap-2 border-b border-zinc-900 pb-2 mb-1">
                    <Volume2 className="w-3.5 h-3.5 text-zinc-500" />
                    <span className="font-semibold text-zinc-200 uppercase tracking-wider text-[10px]">Audio and Diagnostics</span>
                  </div>

                  <div className="flex items-center justify-between py-1">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-zinc-400 text-[11px]">Acoustic Indicators</span>
                      <span className="text-[10px] text-zinc-500 font-sans">Play Synthesizer wave chimes upon syncing success</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSettings(prev => ({ ...prev, soundEffects: !prev.soundEffects }))}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${settings.soundEffects ? activeAccent.bg : "bg-zinc-800"}`}
                    >
                      <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-black shadow ring-0 transition duration-200 ease-in-out ${settings.soundEffects ? "translate-x-4" : "translate-x-0"}`} />
                    </button>
                  </div>

                  <div className="flex items-center justify-between py-1 border-t border-zinc-900/40 mt-3 pt-3">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-zinc-400 text-[11px]">Telemetry Diagnostics</span>
                      <span className="text-[10px] text-zinc-500 font-sans">Saves anonymous execution logs locally</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSettings(prev => ({ ...prev, allowTelemetryShare: !prev.allowTelemetryShare }))}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${settings.allowTelemetryShare ? activeAccent.bg : "bg-zinc-800"}`}
                    >
                      <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-black shadow ring-0 transition duration-200 ease-in-out ${settings.allowTelemetryShare ? "translate-x-4" : "translate-x-0"}`} />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom persistent feedback statistics */}
            <div className="bg-[#09090b] p-4 border-t border-zinc-900 text-[10px] text-zinc-500 font-mono flex items-center justify-between rounded-b select-none">
              <span>SYSTEM REGISTRY ENV</span>
              <button
                type="button"
                className="text-zinc-400 hover:text-white transition cursor-pointer font-mono"
                onClick={handleResetToDefaults}
              >
                RESTORE DEFAULTS
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
