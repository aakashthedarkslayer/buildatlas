import Link from "next/link";
import { addCatalogFigmas, rematchAll } from "@/app/actions";
import { AutoRefresh } from "@/components/AutoRefresh";
import { aiConfigured } from "@/lib/clean/ai";
import { figmaFileKey } from "@/lib/clean/figma";
import { readDb } from "@/lib/store";
import type { SourceKind } from "@/lib/types";
import { MappingDecisions, type Row } from "./MappingDecisions";

export default async function MappingPage(props: PageProps<"/mapping">) {
  const sp = await props.searchParams;
  const bundleFilter = typeof sp.bundles === "string" ? sp.bundles : "all";
  const db = await readDb();
  const projectName = new Map(db.projects.map((p) => [p.id, p.name]));
  const projectsLite = db.projects.map((p) => ({ id: p.id, name: p.name })).sort((a, b) => a.name.localeCompare(b.name));

  const toRow = (s: (typeof db.sources)[number]): Row => ({
    id: s.id,
    title: s.title || s.fileName || s.figmaUrl || "Untitled",
    kind: s.kind,
    format: s.format,
    status: s.match?.status || "none",
    confidence: s.match?.confidence ?? 0,
    projectId: s.projectId,
    guessedName: s.match?.guessedName,
    aiNote: s.match?.aiNote,
    candidates: (s.match?.candidates || []).filter((c) => projectName.has(c.projectId)).map((c) => ({ ...c, name: projectName.get(c.projectId)! })),
  });

  const processing = db.sources.filter((s) => s.status === "processing").length;
  const mapped = db.sources.filter((s) => s.autoProject || s.match);
  const undecided = mapped.filter((s) => s.match && (s.match.status === "suggested" || s.match.status === "none") && s.status !== "processing");
  const auto = mapped.filter((s) => s.match?.status === "auto");
  const confirmed = db.sources.filter((s) => s.match?.status === "confirmed" || (!s.autoProject && s.projectId && !s.match)).length;
  const unlinked = db.sources.filter((s) => !s.projectId).length;

  // Coverage per project: which of the three asset types exist / are approved.
  const kinds: SourceKind[] = ["proposal", "case_study", "figma"];
  const have = new Set(db.sources.map((s) => (s.figmaUrl ? figmaFileKey(s.figmaUrl) : null)).filter(Boolean));
  // Unique Figma files listed in the catalog but not added yet (some files are listed under two projects).
  const catalogFigmaPending = new Set(db.projects.flatMap((p) => (p.figmaLinks || []).map((u) => figmaFileKey(u)).filter((k): k is string => Boolean(k) && !have.has(k)))).size;
  const bundles = db.projects
    .map((p) => {
      const srcs = db.sources.filter((s) => s.projectId === p.id);
      const per = Object.fromEntries(kinds.map((k) => [k, srcs.filter((s) => s.kind === k)])) as Record<SourceKind, typeof srcs>;
      const present = kinds.filter((k) => per[k].length > 0).length;
      return { p, per, present, catalogFigma: (p.figmaLinks || []).length };
    })
    .filter((b) => b.present > 0)
    .filter((b) => (bundleFilter === "complete" ? b.present === 3 : bundleFilter === "two" ? b.present === 2 : bundleFilter === "one" ? b.present === 1 : true))
    .sort((a, b) => b.present - a.present || a.p.name.localeCompare(b.p.name));
  const countPresent = (n: number) => db.projects.filter((p) => kinds.filter((k) => db.sources.some((s) => s.projectId === p.id && s.kind === k)).length === n).length;

  return (
    <div className="max-w-7xl space-y-6">
      {processing > 0 && <AutoRefresh every={4000} />}
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Mapping</h1>
          <p className="text-sm text-slate-500">
            Which proposal, case study and Figma belong to which project. Uploads set to “Detect automatically” land here; confident matches are linked for you, the rest wait for a click.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <form action={rematchAll}>
            <button className="btn" title="Match again every file you haven't decided on (use after importing the catalog or adding dictionary terms)">Re-run matching</button>
          </form>
          {catalogFigmaPending > 0 && (
            <form action={addCatalogFigmas}>
              <button className="btn btn-primary" title="Create a Figma source for every Figma link in the catalog, already linked to its project">Add {catalogFigmaPending} Figma links from catalog</button>
            </form>
          )}
        </div>
      </header>

      <section className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <Stat label="Need your decision" value={undecided.length} tone="text-amber-600" />
        <Stat label="Linked automatically" value={auto.length} tone="text-sky-600" />
        <Stat label="Confirmed / set by you" value={confirmed} tone="text-emerald-600" />
        <Stat label="Not linked" value={unlinked} tone="text-slate-600" />
        <Stat label="Processing" value={processing} tone="text-slate-400" />
      </section>

      {!aiConfigured() && (
        <p className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
          Matching uses names, people, domains and Figma IDs. Add <code>ANTHROPIC_API_KEY</code> and Claude will also settle the unclear files by reading their title pages.
        </p>
      )}
      {db.projects.length === 0 && (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          There are no projects to match against yet. <Link href="/projects" className="font-medium underline">Import the portfolio catalog</Link> first, then click Re-run matching.
        </p>
      )}

      <MappingDecisions undecided={undecided.map(toRow)} auto={auto.map(toRow)} projects={projectsLite} />

      <section className="card">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-4 py-3">
          <h2 className="text-sm font-semibold">Blueprint bundles</h2>
          <div className="flex gap-1.5 text-xs">
            {[["all", "All"], ["complete", `All three (${countPresent(3)})`], ["two", `Two of three (${countPresent(2)})`], ["one", `One (${countPresent(1)})`]].map(([v, l]) => (
              <Link key={v} href={`/mapping?bundles=${v}`} className={`rounded-full px-2.5 py-1 ${bundleFilter === v ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>{l}</Link>
            ))}
          </div>
        </div>
        <div className="max-h-[560px] overflow-auto">
          <table className="w-full">
            <thead className="sticky top-0 bg-slate-50">
              <tr>
                <th className="th">Project</th>
                <th className="th text-center">Proposal</th>
                <th className="th text-center">Case study</th>
                <th className="th text-center">Figma</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {bundles.map(({ p, per, present, catalogFigma }) => (
                <tr key={p.id} className="hover:bg-slate-50">
                  <td className="td">
                    <Link href={`/projects/${p.id}`} className="font-medium hover:text-brand-600">{p.name}</Link>
                    {present === 3 && <span className="ml-2 rounded bg-emerald-50 px-1.5 py-0.5 text-xs font-medium text-emerald-700">complete</span>}
                  </td>
                  {kinds.map((k) => (
                    <td key={k} className="td text-center">
                      {per[k].length ? (
                        <span className="inline-flex flex-wrap justify-center gap-1">
                          {per[k].map((s) => (
                            <Link key={s.id} href={`/sources/${s.id}`} title={`${s.title || s.figmaUrl} (${s.status.replace("_", " ")})`} className={`h-3 w-3 rounded-full ${s.status === "approved" ? "bg-emerald-500" : s.status === "error" ? "bg-rose-500" : "bg-amber-400"}`} />
                          ))}
                        </span>
                      ) : k === "figma" && catalogFigma ? (
                        <span className="text-xs text-slate-400" title="Listed in the catalog but not added yet">in catalog</span>
                      ) : (
                        <span className="text-slate-300">–</span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
              {bundles.length === 0 && (
                <tr><td colSpan={4} className="px-4 py-8 text-center text-sm text-slate-500">No linked files yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <p className="border-t border-slate-100 px-4 py-2 text-xs text-slate-400">Dots: green = approved, amber = waiting for review, red = error. Click a dot to open the file.</p>
      </section>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div className="card p-4">
      <div className={`text-3xl font-semibold ${tone}`}>{value}</div>
      <div className="mt-1 text-sm text-slate-500">{label}</div>
    </div>
  );
}
