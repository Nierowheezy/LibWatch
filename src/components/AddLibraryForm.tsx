import React from "react";
import { Plus, AlertCircle, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { LibraryType } from "../types";

interface AddLibraryFormProps {
  newLibName: string;
  setNewLibName: (name: string) => void;
  newLibType: LibraryType;
  setNewLibType: (type: LibraryType) => void;
  handleAddLibrary: (e: React.FormEvent) => void;
  isAdding: boolean;
  addError: string | null;
  setAddError: (err: string | null) => void;
  addSuccess: string | null;
}

export function AddLibraryForm({
  newLibName,
  setNewLibName,
  newLibType,
  setNewLibType,
  handleAddLibrary,
  isAdding,
  addError,
  setAddError,
  addSuccess
}: AddLibraryFormProps) {
  return (
    <div className="bg-[#0b0b0c] border border-zinc-900 p-5 rounded space-y-4">
      {/* Add form header */}
      <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
        <span className="text-sm font-semibold text-zinc-200 inline-flex items-center gap-1.5 font-mono">
          <Plus className="w-4 h-4 text-cyan-400" /> Track Custom Library or Source
        </span>
        <span className="text-xs text-zinc-500 font-mono">NPM package or github owner/repo</span>
      </div>

      {/* Form implementation */}
      <form onSubmit={handleAddLibrary} className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-stretch">
        <div className="sm:col-span-3">
          <select 
            value={newLibType} 
            onChange={(e) => setNewLibType(e.target.value as LibraryType)}
            className="w-full h-11 bg-[#09090b] border border-zinc-800 hover:border-zinc-700 px-3 rounded text-sm font-medium focus:outline-none focus:border-zinc-500 text-zinc-200 transition cursor-pointer font-mono"
          >
            <option value="npm">NPM Package</option>
            <option value="github">GitHub Repo</option>
          </select>
        </div>
        
        <div className="sm:col-span-6 relative">
          <input
            type="text"
            value={newLibName}
            onChange={(e) => {
              setNewLibName(e.target.value);
              if (addError) setAddError(null);
            }}
            placeholder={newLibType === "npm" ? "e.g., lodash, chalk, zod" : "e.g., tailwindlabs/tailwindcss"}
            className="w-full h-11 bg-[#09090b] border border-zinc-800 hover:border-zinc-700 px-3.5 rounded text-sm focus:outline-none focus:border-zinc-500 text-zinc-200 placeholder-zinc-655 transition font-mono"
          />
        </div>

        <div className="sm:col-span-3">
          <button
            type="submit"
            disabled={isAdding || !newLibName}
            className="w-full h-11 bg-zinc-200 hover:bg-white disabled:opacity-40 disabled:hover:bg-zinc-200 text-black font-semibold text-xs rounded inline-flex items-center justify-center gap-2 transition select-none cursor-pointer disabled:cursor-not-allowed font-mono"
          >
            {isAdding ? (
              <span className="w-3.5 h-3.5 rounded-full border border-zinc-500 border-t-black animate-spin" />
            ) : (
              <>
                <Plus className="w-4 h-4" /> TRACK RESOURCE
              </>
            )}
          </button>
        </div>
      </form>

      {/* Feedbacks for submissions */}
      <AnimatePresence mode="wait">
        {addError && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="bg-[#09090b] border border-red-950 text-red-400 p-2.5 rounded text-xs flex items-center gap-2 font-mono"
          >
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{addError}</span>
          </motion.div>
        )}
        {addSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="bg-[#09090b] border border-zinc-900 w-full text-emerald-400 p-2.5 rounded text-xs flex items-center gap-2 font-mono"
          >
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
            <span>{addSuccess}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
