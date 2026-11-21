import { Search, X } from "lucide-react";
import { INDUSTRIES, PLATFORMS, type IndustryId, type Platform } from "../data/projects";
import { cx } from "./mocks/primitives";

export interface FilterState {
  query: string;
  industry: IndustryId | "all";
  platform: Platform | "all";
}

export function ProjectFilters({ value, onChange, count, total }: { value: FilterState; onChange: (v: FilterState) => void; count: number; total: number }) {
  const set = (patch: Partial<FilterState>) => onChange({ ...value, ...patch });
  const active = value.query || value.industry !== "all" || value.platform !== "all";
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <label className="relative flex-1">
          <span className="sr-only">Search projects</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" aria-hidden="true" />
          <input
            type="search"
            value={value.query}
            onChange={(e) => set({ query: e.target.value })}
            placeholder="Search by product, feature or role…"
            className="w-full rounded-xl border border-white/10 bg-ink-850 py-2.5 pl-9 pr-3 text-sm text-white placeholder:text-slate-500 outline-none transition focus:border-accent-400/60 focus:ring-4 focus:ring-accent-400/10"
          />
        </label>
        <label className="sm:w-48">
          <span className="sr-only">Platform</span>
          <select
            value={value.platform}
            onChange={(e) => set({ platform: e.target.value as Platform | "all" })}
            className="w-full appearance-none rounded-xl border border-white/10 bg-ink-850 px-3 py-2.5 text-sm text-white outline-none focus:border-accent-400/60"
          >
            <option value="all">All platforms</option>
            {PLATFORMS.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </label>
      </div>
      <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filter by industry">
        <Pill on={value.industry === "all"} onClick={() => set({ industry: "all" })}>All industries</Pill>
        {INDUSTRIES.map((i) => (
          <Pill key={i.id} on={value.industry === i.id} onClick={() => set({ industry: i.id })}>{i.name}</Pill>
        ))}
        <span className="ml-auto text-xs text-slate-500" aria-live="polite">{count} of {total} projects</span>
        {active && (
          <button onClick={() => onChange({ query: "", industry: "all", platform: "all" })} className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-white">
            <X className="h-3.5 w-3.5" aria-hidden="true" /> Clear
          </button>
        )}
      </div>
    </div>
  );
}

function Pill({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      aria-pressed={on}
      className={cx("rounded-full px-3 py-1.5 text-xs font-medium transition", on ? "bg-white text-ink-900" : "bg-white/[0.04] text-slate-400 ring-1 ring-white/[0.08] hover:text-white hover:ring-white/20")}
    >
      {children}
    </button>
  );
}
