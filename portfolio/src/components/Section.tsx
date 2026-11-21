import type { ReactNode } from "react";
import { cx } from "./mocks/primitives";

export function Section({ id, eyebrow, title, intro, children, className, light }: { id?: string; eyebrow?: string; title: ReactNode; intro?: ReactNode; children: ReactNode; className?: string; light?: boolean }) {
  return (
    <section id={id} className={cx("px-5 py-24 sm:px-8 lg:py-32", light && "bg-[#f6f7f9] text-slate-700", className)}>
      <div className="mx-auto max-w-7xl">
        <header className="max-w-2xl">
          {eyebrow && <p className={cx("font-mono text-xs uppercase tracking-[0.18em]", light ? "text-sky-700" : "text-accent-400")}>{eyebrow}</p>}
          <h2 className={cx("mt-3 text-3xl font-semibold tracking-tight sm:text-4xl", light ? "text-slate-900" : "text-white")}>{title}</h2>
          {intro && <p className={cx("mt-4 text-base leading-relaxed sm:text-lg", light ? "text-slate-600" : "text-slate-400")}>{intro}</p>}
        </header>
        <div className="mt-12">{children}</div>
      </div>
    </section>
  );
}
