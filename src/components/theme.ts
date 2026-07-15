export const ACCENT_PRESETS = {
  cyan: {
    text: "text-cyan-400",
    bg: "bg-cyan-500",
    border: "border-cyan-500/20",
    borderLeft: "border-l-cyan-500",
    hover: "hover:text-cyan-400",
    focusRing: "focus:ring-cyan-500",
    badge: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
  },
  orange: {
    text: "text-orange-400",
    bg: "bg-orange-500",
    border: "border-orange-500/20",
    borderLeft: "border-l-orange-500",
    hover: "hover:text-orange-400",
    focusRing: "focus:ring-orange-500",
    badge: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  },
  emerald: {
    text: "text-emerald-400",
    bg: "bg-emerald-500",
    border: "border-emerald-500/20",
    borderLeft: "border-l-emerald-500",
    hover: "hover:text-emerald-400",
    focusRing: "focus:ring-emerald-500",
    badge: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  },
  violet: {
    text: "text-violet-400",
    bg: "bg-violet-500",
    border: "border-violet-500/20",
    borderLeft: "border-l-violet-500",
    hover: "hover:text-violet-400",
    focusRing: "focus:ring-violet-500",
    badge: "bg-violet-500/10 text-violet-400 border-violet-500/20",
  },
  rose: {
    text: "text-rose-400",
    bg: "bg-rose-500",
    border: "border-rose-500/20",
    borderLeft: "border-l-rose-500",
    hover: "hover:text-rose-400",
    focusRing: "focus:ring-rose-500",
    badge: "bg-rose-500/10 text-rose-400 border-rose-500/20",
  },
};

export type AccentType = keyof typeof ACCENT_PRESETS;
