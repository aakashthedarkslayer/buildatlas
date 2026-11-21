import { Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Logo } from "./Logo";
import { cx } from "./mocks/primitives";

const LINKS = [
  ["Work", "#work"],
  ["Industries", "#industries"],
  ["Case Studies", "#inside"],
  ["About", "#about"],
  ["Contact", "#contact"],
] as const;

export function Nav() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 8);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  useEffect(() => {
    if (!open) return;
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", esc);
    return () => document.removeEventListener("keydown", esc);
  }, [open]);

  return (
    <header className={cx("fixed inset-x-0 top-0 z-40 transition", scrolled || open ? "border-b border-white/[0.06] bg-ink-900/80 backdrop-blur-xl" : "border-b border-transparent")}>
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-8" aria-label="Main">
        <a href="#top" className="flex items-center gap-2.5" aria-label="BuildAtlas home">
          <Logo />
          <span className="text-[15px] font-semibold tracking-tight text-white">BuildAtlas</span>
        </a>
        <ul className="hidden items-center gap-1 md:flex">
          {LINKS.map(([label, href]) => (
            <li key={href}>
              <a href={href} className="rounded-md px-3 py-2 text-sm text-slate-400 transition hover:text-white">{label}</a>
            </li>
          ))}
        </ul>
        <div className="flex items-center gap-2">
          <a href="#work" className="hidden rounded-lg bg-white px-3.5 py-2 text-sm font-medium text-ink-900 transition hover:bg-slate-200 sm:inline-block">Explore Projects</a>
          <button onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-controls="mobile-menu" aria-label={open ? "Close menu" : "Open menu"} className="rounded-lg p-2 text-slate-300 ring-1 ring-white/10 md:hidden">
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </nav>
      {open && (
        <div id="mobile-menu" className="border-t border-white/[0.06] px-5 pb-6 pt-2 md:hidden">
          <ul className="flex flex-col">
            {LINKS.map(([label, href]) => (
              <li key={href}>
                <a href={href} onClick={() => setOpen(false)} className="block border-b border-white/[0.05] py-3.5 text-base text-slate-200">{label}</a>
              </li>
            ))}
          </ul>
          <a href="#work" onClick={() => setOpen(false)} className="mt-5 block rounded-lg bg-white py-3 text-center text-sm font-medium text-ink-900">Explore Projects</a>
        </div>
      )}
    </header>
  );
}
