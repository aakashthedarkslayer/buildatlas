/** Small building blocks for the drawn (illustrative) product screens. */
import type { ReactNode } from "react";

export const cx = (...c: Array<string | false | undefined | null>) => c.filter(Boolean).join(" ");

export function Bar({ w, className }: { w: string; className?: string }) {
  return <div className={cx("h-1.5 rounded-full bg-white/10", className)} style={{ width: w }} />;
}

export function Dot({ tone = "slate" }: { tone?: "sky" | "teal" | "amber" | "rose" | "slate" | "violet" }) {
  const c = { sky: "bg-sky-400", teal: "bg-teal-400", amber: "bg-amber-400", rose: "bg-rose-400", slate: "bg-slate-500", violet: "bg-violet-400" }[tone];
  return <span className={cx("inline-block h-1.5 w-1.5 shrink-0 rounded-full", c)} />;
}

export function Chip({ children, tone = "slate" }: { children: ReactNode; tone?: "sky" | "teal" | "amber" | "rose" | "slate" }) {
  const c = {
    sky: "bg-sky-400/10 text-sky-300 ring-sky-400/20",
    teal: "bg-teal-400/10 text-teal-300 ring-teal-400/20",
    amber: "bg-amber-400/10 text-amber-300 ring-amber-400/20",
    rose: "bg-rose-400/10 text-rose-300 ring-rose-400/20",
    slate: "bg-white/5 text-slate-300 ring-white/10",
  }[tone];
  return <span className={cx("inline-flex items-center rounded px-1 py-px text-[7px] font-medium ring-1 ring-inset", c)}>{children}</span>;
}

export function Kpi({ label, value, delta, tone = "teal" }: { label: string; value: string; delta?: string; tone?: "teal" | "rose" | "sky" }) {
  return (
    <div className="rounded-md border border-white/[0.06] bg-white/[0.025] p-1.5">
      <div className="text-[6.5px] uppercase tracking-wider text-slate-500">{label}</div>
      <div className="mt-0.5 flex items-baseline gap-1">
        <span className="text-[11px] font-semibold tracking-tight text-slate-100">{value}</span>
        {delta && <span className={cx("text-[6.5px] font-medium", tone === "rose" ? "text-rose-300" : tone === "sky" ? "text-sky-300" : "text-teal-300")}>{delta}</span>}
      </div>
    </div>
  );
}

/** Area/line chart from a list of values (0-100). */
export function Spark({ values, className, fill = true }: { values: number[]; className?: string; fill?: boolean }) {
  const w = 100;
  const h = 40;
  const step = w / (values.length - 1);
  const pts = values.map((v, i) => `${(i * step).toFixed(1)},${(h - (v / 100) * h).toFixed(1)}`);
  const id = `g${values.join("")}`.slice(0, 24);
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className={cx("h-full w-full", className)} aria-hidden="true">
      <defs>
        <linearGradient id={id} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#38bdf8" stopOpacity="0.28" />
          <stop offset="1" stopColor="#38bdf8" stopOpacity="0" />
        </linearGradient>
      </defs>
      {fill && <polygon points={`0,${h} ${pts.join(" ")} ${w},${h}`} fill={`url(#${id})`} />}
      <polyline points={pts.join(" ")} fill="none" stroke="#38bdf8" strokeWidth="1.2" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

export function Sidebar({ items, active = 0, brand }: { items: string[]; active?: number; brand: string }) {
  return (
    <div className="hidden w-[22%] shrink-0 flex-col gap-1 border-r border-white/[0.06] bg-black/20 p-2 sm:flex">
      <div className="mb-1.5 flex items-center gap-1.5">
        <div className="h-3 w-3 rounded bg-gradient-to-br from-sky-400 to-sky-600" />
        <span className="text-[8px] font-semibold text-slate-200">{brand}</span>
      </div>
      {items.map((it, i) => (
        <div key={it} className={cx("flex items-center gap-1.5 rounded px-1.5 py-1 text-[7.5px]", i === active ? "bg-white/[0.06] text-slate-100" : "text-slate-500")}>
          <span className={cx("h-1.5 w-1.5 rounded-sm", i === active ? "bg-sky-400" : "bg-white/15")} />
          {it}
        </div>
      ))}
    </div>
  );
}

export function TopBar({ title, right }: { title: string; right?: ReactNode }) {
  return (
    <div className="flex items-center justify-between border-b border-white/[0.06] px-2.5 py-1.5">
      <span className="text-[9px] font-semibold text-slate-100">{title}</span>
      <div className="flex items-center gap-1.5">
        <div className="hidden h-3.5 w-20 rounded bg-white/[0.05] ring-1 ring-white/[0.06] md:block" />
        {right}
        <div className="h-3.5 w-3.5 rounded-full bg-gradient-to-br from-slate-400 to-slate-600" />
      </div>
    </div>
  );
}

export function Row({ cells, widths }: { cells: ReactNode[]; widths: string[] }) {
  return (
    <div className="flex items-center gap-2 border-b border-white/[0.04] px-2 py-[5px] text-[7.5px] text-slate-400 last:border-0">
      {cells.map((c, i) => (
        <div key={i} className="min-w-0 truncate" style={{ width: widths[i] }}>
          {c}
        </div>
      ))}
    </div>
  );
}

export function Card({ title, children, className }: { title?: string; children: ReactNode; className?: string }) {
  return (
    <div className={cx("rounded-md border border-white/[0.06] bg-white/[0.02] p-2", className)}>
      {title && <div className="mb-1.5 text-[7.5px] font-medium text-slate-300">{title}</div>}
      {children}
    </div>
  );
}

/** Generic phone chrome inside the phone frame. */
export function PhoneHeader({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="px-3 pt-1">
      {sub && <div className="text-[7px] text-slate-500">{sub}</div>}
      <div className="text-[12px] font-semibold tracking-tight text-slate-100">{title}</div>
    </div>
  );
}

export function TabBar({ active = 0 }: { active?: number }) {
  return (
    <div className="mt-auto flex justify-around border-t border-white/[0.06] px-3 py-2">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className={cx("h-1.5 w-5 rounded-full", i === active ? "bg-sky-400" : "bg-white/10")} />
      ))}
    </div>
  );
}
