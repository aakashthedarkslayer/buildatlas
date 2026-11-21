import { CONTACT_EMAIL } from "./Contact";
import { Logo } from "./Logo";

export function Footer() {
  return (
    <footer className="border-t border-white/[0.06] px-5 py-12 sm:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-8 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="flex items-center gap-2.5"><Logo /><span className="font-semibold text-white">BuildAtlas</span></div>
          <p className="mt-3 max-w-xs text-sm text-slate-500">Real-world software design, product blueprints and UI resources.</p>
        </div>
        <nav aria-label="Footer" className="grid grid-cols-2 gap-x-12 gap-y-2 text-sm">
          {[["Work", "#work"], ["Industries", "#industries"], ["Case Studies", "#inside"], ["About", "#about"], ["Contact", "#contact"]].map(([l, h]) => (
            <a key={h} href={h} className="text-slate-400 hover:text-white">{l}</a>
          ))}
          <a href={`mailto:${CONTACT_EMAIL}`} className="text-slate-400 hover:text-white">{CONTACT_EMAIL}</a>
        </nav>
      </div>
      <div className="mx-auto mt-10 flex max-w-7xl flex-col gap-2 border-t border-white/[0.06] pt-6 text-xs text-slate-600 sm:flex-row sm:justify-between">
        <p>© {new Date().getFullYear()} BuildAtlas. All rights reserved.</p>
        <p>Previews marked “Illustrative” are placeholders. Client work is shown only with permission and anonymised.</p>
      </div>
    </footer>
  );
}
