import Link from "next/link";
import { notFound } from "next/navigation";
import { includedKinds } from "@/lib/blueprints";
import { isAdmin } from "@/lib/auth";
import { listPreviews } from "@/lib/clean/pipeline";
import { readDb } from "@/lib/store";

export default async function BlueprintPage(props: PageProps<"/store/b/[slug]">) {
  const { slug } = await props.params;
  const admin = await isAdmin();
  const db = await readDb();
  const b = (db.blueprints || []).find((x) => x.slug === slug && (x.published || admin));
  if (!b) notFound();
  const k = includedKinds(db, b);
  // Preview: the first cleaned pages of each approved document (and Figma frames once verified).
  const previews: Array<{ src: string; label: string }> = [];
  for (const s of [...k.case_study, ...k.proposal, ...k.figma]) {
    const pages = (await listPreviews(s.id, "clean")).slice(0, s.kind === "figma" ? 4 : 2);
    for (const f of pages) previews.push({ src: `/api/store/preview/${b.id}/${s.id}/${f}`, label: s.kind === "figma" ? "UI design" : s.kind === "case_study" ? "Case study" : "Proposal" });
  }
  const included = [
    { on: k.proposal.length > 0, t: "Proposal & scope document", d: "Modules, user roles, features, phases and assumptions from the real scope." },
    { on: k.case_study.length > 0, t: "Case study", d: "Challenges, solution, workflows, integrations and delivered screens." },
    { on: k.figma.length > 0, t: "Figma UI design", d: "Editable screens and flows from the product, ready to rebrand." },
  ];

  return (
    <div className="mx-auto max-w-6xl px-5 py-10">
      <nav className="mb-6 text-sm text-slate-500">
        <Link href="/store" className="hover:text-slate-800">Blueprints</Link> / <span>{b.industry}</span>
      </nav>
      {!b.published && <p className="mb-4 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">Draft: only you can see this. <Link className="underline" href={`/blueprints/${b.id}`}>Edit listing</Link></p>}
      <div className="grid gap-10 lg:grid-cols-[1fr_340px]">
        <article>
          <span className="rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-medium text-brand-700">{b.industry}</span>
          <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">{b.title}</h1>
          {b.tagline && <p className="mt-3 text-lg text-slate-600">{b.tagline}</p>}

          {previews.length > 0 && (
            <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {previews.slice(0, 6).map((p) => (
                <figure key={p.src} className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.src} alt={p.label} className="aspect-[3/4] w-full object-cover object-top" />
                  <figcaption className="border-t border-slate-200 px-2 py-1 text-xs text-slate-500">{p.label}</figcaption>
                </figure>
              ))}
            </div>
          )}

          <Section title="Overview">
            <p className="whitespace-pre-line text-slate-700">{b.summary}</p>
          </Section>
          {b.features.length > 0 && (
            <Section title="Key features">
              <ul className="grid gap-2 sm:grid-cols-2">
                {b.features.map((f) => (
                  <li key={f} className="flex gap-2 text-slate-700"><span className="text-brand-600">✓</span>{f}</li>
                ))}
              </ul>
            </Section>
          )}
          {b.challenges.length > 0 && (
            <Section title="Problems it solves">
              <ul className="list-disc space-y-1 pl-5 text-slate-700">
                {b.challenges.map((c) => <li key={c}>{c}</li>)}
              </ul>
            </Section>
          )}
          {(b.platforms.length > 0 || b.tech.length > 0) && (
            <Section title="Platforms & technology">
              <div className="flex flex-wrap gap-2">
                {[...b.platforms, ...b.tech].map((t) => (
                  <span key={t} className="rounded-lg bg-slate-100 px-2.5 py-1 text-sm text-slate-700">{t}</span>
                ))}
              </div>
            </Section>
          )}
        </article>

        <aside className="lg:sticky lg:top-6 lg:self-start">
          <div className="rounded-2xl border border-slate-200 p-5 shadow-sm">
            <div className="text-3xl font-bold">${b.price}</div>
            <p className="text-sm text-slate-500">One-time licence · instant access once payment is confirmed</p>
            <Link href={`/store/checkout?b=${b.id}`} className="mt-4 block rounded-xl bg-brand-600 px-4 py-3 text-center font-medium text-white hover:bg-brand-700">Buy this blueprint</Link>
            <h3 className="mt-6 text-sm font-semibold">What&apos;s included</h3>
            <ul className="mt-2 space-y-2.5">
              {included.map((i) => (
                <li key={i.t} className={`text-sm ${i.on ? "" : "text-slate-400"}`}>
                  <div className="font-medium">{i.on ? "✓" : "–"} {i.t}</div>
                  <div className="text-xs text-slate-500">{i.on ? i.d : "Not included in this blueprint"}</div>
                </li>
              ))}
            </ul>
            {(b.durationMonths || b.teamSize) && (
              <dl className="mt-5 grid grid-cols-2 gap-3 border-t border-slate-100 pt-4 text-sm">
                {b.durationMonths && (<div><dt className="text-xs text-slate-500">Original build</dt><dd className="font-medium">{b.durationMonths} months</dd></div>)}
                {b.teamSize && (<div><dt className="text-xs text-slate-500">Core team</dt><dd className="font-medium">{b.teamSize} {b.teamSize === 1 ? "person" : "people"}</dd></div>)}
              </dl>
            )}
          </div>
          <p className="mt-3 px-1 text-xs text-slate-500">Based on a real delivered project. Client names, people, contact details and branding have been removed and every file was reviewed by a person.</p>
        </aside>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-10">
      <h2 className="mb-3 text-xl font-semibold">{title}</h2>
      {children}
    </section>
  );
}
