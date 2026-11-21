import { Bot, Briefcase, Building2, HeartPulse, Landmark, ShoppingBag, Trophy, Truck, ArrowUpRight } from "lucide-react";
import type { ReactNode } from "react";
import { INDUSTRIES, PROJECTS, type IndustryId } from "../data/projects";
import { cx } from "./mocks/primitives";
import { Section } from "./Section";

const ICON: Record<IndustryId, ReactNode> = {
  healthcare: <HeartPulse className="h-5 w-5" />,
  "real-estate": <Building2 className="h-5 w-5" />,
  logistics: <Truck className="h-5 w-5" />,
  finance: <Landmark className="h-5 w-5" />,
  ai: <Bot className="h-5 w-5" />,
  sports: <Trophy className="h-5 w-5" />,
  ecommerce: <ShoppingBag className="h-5 w-5" />,
  enterprise: <Briefcase className="h-5 w-5" />,
};

/** Bento layout: wide / regular / wide rows (2+2, 1+1+1+1, 2+2). */
const SPAN: Partial<Record<IndustryId, string>> = { healthcare: "lg:col-span-2", "real-estate": "lg:col-span-2", ecommerce: "lg:col-span-2", enterprise: "lg:col-span-2" };

export function Industries({ onPick }: { onPick: (id: IndustryId) => void }) {
  return (
    <Section id="industries" eyebrow="Industries" title="Eight industries, one standard of craft" intro="Each area brings its own roles, rules and edge cases. These are the domains the collection covers.">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {INDUSTRIES.map((ind) => {
          const n = PROJECTS.filter((p) => p.industry === ind.id).length;
          return (
            <button
              key={ind.id}
              onClick={() => onPick(ind.id)}
              className={cx("group relative flex min-h-44 flex-col overflow-hidden rounded-2xl border border-white/[0.07] bg-ink-850 p-6 text-left transition hover:border-white/15 hover:bg-ink-800", SPAN[ind.id])}
            >
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-white/[0.04] text-accent-300 ring-1 ring-white/[0.07] transition group-hover:bg-accent-400/10">{ICON[ind.id]}</span>
              <span className="mt-5 text-lg font-semibold tracking-tight text-white">{ind.name}</span>
              <span className="mt-1.5 text-sm leading-relaxed text-slate-400">{ind.blurb}</span>
              <span className="mt-auto flex items-center justify-between pt-5 text-xs text-slate-500">
                {n ? `${n} featured ${n === 1 ? "project" : "projects"}` : "More coming soon"}
                <ArrowUpRight className="h-4 w-4 opacity-0 transition group-hover:opacity-100" aria-hidden="true" />
              </span>
            </button>
          );
        })}
      </div>
    </Section>
  );
}
