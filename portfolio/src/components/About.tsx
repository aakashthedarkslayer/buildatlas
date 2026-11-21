import { BookOpen, FileText, PenTool } from "lucide-react";
import { Section } from "./Section";

const RESOURCES = [
  { icon: <PenTool className="h-5 w-5" />, name: "Interface designs", text: "Desktop dashboards, admin panels and mobile apps, organised as complete flows rather than isolated screens." },
  { icon: <FileText className="h-5 w-5" />, name: "Product requirements", text: "Modules, user roles, permissions, phases and assumptions: the structure behind a product, where it can be shared." },
  { icon: <BookOpen className="h-5 w-5" />, name: "Case studies", text: "The problem, the approach and the workflows that shipped, written up after delivery." },
];

export function About() {
  return (
    <Section id="about" light eyebrow="About the collection" title="Software designed around real operational challenges" intro="The collection comes from years of building software for operations-heavy businesses: care providers, property managers, workshops, warehouses, clubs and service marketplaces. The common thread is multi-role work, where one person's screen is another person's to-do list.">
      <div className="grid gap-4 md:grid-cols-3">
        {RESOURCES.map((r) => (
          <div key={r.name} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_1px_0_rgba(15,23,42,0.04)]">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-sky-50 text-sky-700 ring-1 ring-sky-100">{r.icon}</span>
            <h3 className="mt-5 text-lg font-semibold tracking-tight text-slate-900">{r.name}</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">{r.text}</p>
          </div>
        ))}
      </div>
      <div className="mt-10 grid gap-6 rounded-2xl border border-slate-200 bg-white p-6 text-sm leading-relaxed text-slate-600 md:grid-cols-2 md:p-8">
        <p><strong className="font-semibold text-slate-900">Not every project has all three.</strong> Some come with designs only; some with a case study and designs; a smaller number with requirements as well. Each project shows exactly what is available.</p>
        <p><strong className="font-semibold text-slate-900">Published with care.</strong> Projects are released only after licensing review, and every file is anonymised: client names, people, contact details and branding are removed. Previews marked “Illustrative” are placeholders until approved screenshots are added.</p>
      </div>
    </Section>
  );
}
