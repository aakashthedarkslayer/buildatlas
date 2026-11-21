import type { ReactNode } from "react";
import { cx } from "./mocks/primitives";

/** A restrained browser window: three dots and an address pill. */
export function BrowserFrame({ children, className, url = "app.example.com" }: { children: ReactNode; className?: string; url?: string }) {
  return (
    <div className={cx("overflow-hidden rounded-xl border border-white/10 bg-ink-800 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.7)]", className)}>
      <div className="flex items-center gap-2 border-b border-white/[0.06] bg-ink-850/90 px-3 py-2">
        <span className="flex gap-1.5" aria-hidden="true">
          <i className="h-2 w-2 rounded-full bg-white/15" />
          <i className="h-2 w-2 rounded-full bg-white/15" />
          <i className="h-2 w-2 rounded-full bg-white/15" />
        </span>
        <span className="mx-auto hidden w-1/2 truncate rounded-md bg-white/[0.04] px-2 py-0.5 text-center font-mono text-[10px] text-slate-500 sm:block">{url}</span>
      </div>
      <div className="aspect-[16/10] overflow-hidden">{children}</div>
    </div>
  );
}

/** A phone with a slim bezel and dynamic-island cut-out. */
export function PhoneFrame({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cx("relative rounded-[28px] border border-white/15 bg-ink-950 p-[5px] shadow-[0_30px_70px_-15px_rgba(0,0,0,0.75)]", className)}>
      <div className="relative aspect-[9/19] overflow-hidden rounded-[23px]">
        <span aria-hidden="true" className="absolute left-1/2 top-[1.4%] z-10 h-[3.2%] w-[30%] -translate-x-1/2 rounded-full bg-black" />
        {children}
      </div>
    </div>
  );
}
