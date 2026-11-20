import Link from "next/link";
import { includedKinds } from "@/lib/blueprints";
import { isAdmin } from "@/lib/auth";
import { readDb } from "@/lib/store";
import type { Blueprint, Db } from "@/lib/types";

export default async function StoreHome(props: PageProps<"/store">) {
  const sp = await props.searchParams;
  const q = typeof sp.q === "string" ? sp.q : "";
  const industry = typeof sp.industry === "string" ? sp.industry : "";
  const admin = await isAdmin();
  const db = await readDb();
  const visible = (db.blueprints || []).filter((b) => b.published || admin);
  const industries = [...new Set(visible.map((b) => b.industry))].sort();
  const list = visible
    .filter((b) => !industry || b.industry === industry)
    .filter((b) => !q || `${b.title} ${b.tagline} ${b.summary} ${b.features.join(" ")} ${b.industry}`.toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => Number(b.published) - Number(a.published) || score(db, b) - score(db, a) || a.title.localeCompare(b.title));

  return (
    <>
      <section className="bg-gradient-to-b from-brand-50 to-white">
        <div className="mx-auto max-w-6xl px-5 py-16 text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-brand-600">Software product blueprints</p>
          <h1 className="mx-auto max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl">Start from a product that was actually built</h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-600">
            Real proposals, case studies and UI designs from delivered apps and platforms, anonymised and packaged so your team (or your AI coding agent) skips weeks of discovery.
          </p>
          <form className="mx-auto mt-8 flex max-w-xl gap-2" action="/store">
            <input name="q" defaultValue={q} placeholder="Try “booking app”, “NDIS”, “marketplace”, “IoT”…" className="flex-1 rounded-xl border border-slate-300 px-4 py-3 text-base shadow-sm outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-100" />
            {industry && <input type="hidden" name="industry" value={industry} />}
            <button className="rounded-xl bg-brand-600 px-5 py-3 font-medium text-white shadow-sm hover:bg-brand-700">Search</button>
          </form>
        </div>
      </section>

      <section id="browse" className="mx-auto max-w-6xl px-5 pt-10">
        <div className="mb-6 flex flex-wrap gap-2">
          <Chip href={q ? `/store?q=${encodeURIComponent(q)}#browse` : "/store#browse"} active={!industry}>All industries</Chip>
          {industries.map((i) => (
            <Chip key={i} href={`/store?industry=${encodeURIComponent(i)}${q ? `&q=${encodeURIComponent(q)}` : ""}#browse`} active={industry === i}>{i}</Chip>
          ))}
        </div>
        {list.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 p-12 text-center text-slate-500">
            {visible.length === 0 ? "New blueprints are being prepared. Check back soon." : "No blueprints match your search."}
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {list.map((b) => (
              <Card key={b.id} b={b} db={db} />
            ))}
          </div>
        )}
      </section>

      <section id="how" className="mx-auto mt-20 max-w-6xl px-5">
        <h2 className="text-2xl font-bold">What&apos;s in a blueprint</h2>
        <div className="mt-6 grid gap-5 md:grid-cols-3">
          {[
            ["Proposal & scope", "The real scope document: modules, user roles, features, phases and assumptions, so you know what to build and what you'd miss."],
            ["Case study", "How it was delivered: challenges, solution, workflows, integrations and screens from the live product."],
            ["UI design (Figma)", "The product's actual screens and flows as an editable Figma file, ready to rebrand."],
          ].map(([t, d]) => (
            <div key={t} className="rounded-2xl border border-slate-200 p-5">
              <h3 className="font-semibold">{t}</h3>
              <p className="mt-2 text-sm text-slate-600">{d}</p>
            </div>
          ))}
        </div>
        <p className="mt-6 text-sm text-slate-500">Every file is reviewed by a person before it is listed: client names, people, contact details, logos and links are removed.</p>
      </section>
    </>
  );
}

function score(db: Db, b: Blueprint) {
  const k = includedKinds(db, b);
  return [k.proposal, k.case_study, k.figma].filter((x) => x.length).length;
}

function Chip({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link href={href} className={`rounded-full px-3.5 py-1.5 text-sm ${active ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"}`}>
      {children}
    </Link>
  );
}

function Card({ b, db }: { b: Blueprint; db: Db }) {
  const k = includedKinds(db, b);
  const parts = [k.proposal.length && "Proposal", k.case_study.length && "Case study", k.figma.length && "Figma"].filter(Boolean) as string[];
  return (
    <Link href={`/store/b/${b.slug}`} className="group flex flex-col rounded-2xl border border-slate-200 p-5 transition hover:-translate-y-0.5 hover:border-brand-500 hover:shadow-lg">
      <div className="flex items-center justify-between gap-2">
        <span className="rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-medium text-brand-700">{b.industry}</span>
        {!b.published && <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-amber-800">Draft</span>}
      </div>
      <h3 className="mt-3 text-lg font-semibold leading-snug group-hover:text-brand-700">{b.title}</h3>
      <p className="mt-1.5 line-clamp-3 flex-1 text-sm text-slate-600">{b.tagline || b.summary}</p>
      {b.platforms.length > 0 && <p className="mt-3 text-xs text-slate-500">{b.platforms.join(" · ")}</p>}
      <div className="mt-4 flex items-end justify-between border-t border-slate-100 pt-3">
        <span className="text-xs text-slate-500">{parts.length ? parts.join(" + ") : "Files being prepared"}</span>
        <span className="text-lg font-semibold">${b.price}</span>
      </div>
    </Link>
  );
}
