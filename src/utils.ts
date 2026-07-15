import { TrackedLibrary } from "./types";

/**
 * Calculates human-readable relative time string from an ISO date string
 */
export function getRelativeTimeString(dateString?: string): string {
  if (!dateString) return "Never";
  
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now.getTime() - date.getTime();
  
  if (isNaN(diffMs)) return "Invalid Date";
  
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30.43); // average month length
  const diffYears = Math.floor(diffDays / 365.25);
  
  if (diffSecs < 10) {
    return "just now";
  } else if (diffSecs < 60) {
    return `${diffSecs} seconds ago`;
  } else if (diffMins === 1) {
    return "1 minute ago";
  } else if (diffMins < 60) {
    return `${diffMins} minutes ago`;
  } else if (diffHours === 1) {
    return "1 hour ago";
  } else if (diffHours < 24) {
    return `${diffHours} hours ago`;
  } else if (diffDays === 1) {
    return "yesterday";
  } else if (diffDays < 7) {
    return `${diffDays} days ago`;
  } else if (diffWeeks === 1) {
    return "1 week ago";
  } else if (diffWeeks < 4) {
    return `${diffWeeks} weeks ago`;
  } else if (diffMonths === 1) {
    return "1 month ago";
  } else if (diffMonths < 12) {
    return `${diffMonths} months ago`;
  } else if (diffYears === 1) {
    return "1 year ago";
  } else {
    return `${diffYears} years ago`;
  }
}

/**
 * Formats a raw ISO date string into a neat full representation
 */
export function formatFullDate(dateString?: string): string {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "N/A";
  return date.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

/**
 * Seed libraries to track out-of-the-box
 */
export const DEFAULT_TRACKED_LIBRARIES: TrackedLibrary[] = [
  // NPM Defaults
  {
    id: "npm-next",
    name: "next",
    type: "npm",
    status: "idle"
  },
  {
    id: "npm-react",
    name: "react",
    type: "npm",
    status: "idle"
  },
  {
    id: "npm-express",
    name: "express",
    type: "npm",
    status: "idle"
  },
  {
    id: "npm-vue",
    name: "vue",
    type: "npm",
    status: "idle"
  },
  {
    id: "npm-tailwindcss",
    name: "tailwindcss",
    type: "npm",
    status: "idle"
  },
  // GitHub Defaults
  {
    id: "github-vercel-next.js",
    name: "vercel/next.js",
    type: "github",
    status: "idle"
  },
  {
    id: "github-facebook-react",
    name: "facebook/react",
    type: "github",
    status: "idle"
  },
  {
    id: "github-expressjs-express",
    name: "expressjs/express",
    type: "github",
    status: "idle"
  }
];

export interface ActivityDataPoint {
  date: string;
  value: number;
}

/**
 * Generates a stable, deterministic 30-day activity history for a library
 * utilizing a pseudo-random hash generator so data remains constant per package.
 */
export function generate30DayTrend(libName: string, libType: "npm" | "github"): ActivityDataPoint[] {
  const points: ActivityDataPoint[] = [];
  const now = new Date("2026-06-08T22:00:21Z");
  
  // Create deterministic seed from string hashing
  let hash = 0;
  for (let i = 0; i < libName.length; i++) {
    hash = libName.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  let seed = Math.abs(hash || 1);
  const lcg = () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };

  // Base range depending on type
  const baseValue = libType === "github" 
    ? (seed % 7) + 2 // 2 to 8 commits avg
    : (seed % 17000) + 8000; // 8k to 25k download checks avg

  for (let i = 29; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    
    const month = d.toLocaleString("en-US", { month: "short" });
    const day = d.getDate();
    const dateStr = `${month} ${day}`;
    
    // Waveform simulation
    const wave = Math.sin((30 - i) * 0.35 + (seed % 12)) * 0.4;
    const noise = (lcg() - 0.5) * 0.25;
    
    // Weekend cycle (less activity on Sat/Sun)
    const dayOfWeek = d.getDay();
    const weekendFactor = (dayOfWeek === 0 || dayOfWeek === 6) ? 0.35 : 1.0;
    
    let value = baseValue * (1 + wave + noise) * weekendFactor;
    if (value < 0) value = 0;
    
    if (libType === "github") {
      value = Math.max(0, Math.round(value));
    } else {
      value = Math.max(10, Math.round(value));
    }
    
    points.push({
      date: dateStr,
      value
    });
  }
  
  return points;
}
