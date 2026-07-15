export type LibraryType = "npm" | "github";

export interface TrackedLibrary {
  id: string; // unique identifier
  name: string; // package name (e.g. "react" or "facebook/react")
  type: LibraryType;
  lastUpdated?: string; // ISO date string from server
  latestVersion?: string; // for NPM packages
  description?: string; // description
  commitMessage?: string; // for GitHub repositories
  authorName?: string; // for GitHub
  homepage?: string; // direct package or repository URL
  status: "idle" | "loading" | "success" | "error";
  error?: string;
  lastChecked?: string; // ISO date of last fetch
  stars?: number;
  forks?: number;
  openIssues?: number;
  downloads?: number;
  license?: string;
  size?: number;
  subscribers?: number;
}

export type SortField = "name" | "type" | "lastUpdated" | "status" | "manual";
export type SortOrder = "asc" | "desc";

export interface AppSettings {
  syncIntervalValue: number;
  syncIntervalUnit: "seconds" | "minutes" | "hours" | "days";
  autoRefreshActive: boolean;
  shortcutSyncAll: string;
  shortcutFocusSearch: string;
  denseMode: boolean;
  soundEffects: boolean;
  themeAccent: "cyan" | "orange" | "emerald" | "violet" | "rose";
  allowTelemetryShare: boolean;
}

