import Link from "next/link";
import { answerQuestion, fetchPortfolioCaseStudies, importMasterMap } from "@/app/actions";
import { StatusBadge } from "@/components/Badges";
import { fileKey, masterMapAvailable } from "@/lib/masterMap";
import { readDb } from "@/lib/store";
import type { Project, Source } from "@/lib/types";

type Kind = "proposal" | "case_study" | "figma";
const KIND_NAME: Record<Kind, string> = { proposal: "Proposal", case_study: "Case study", figma: "Figma" };
const SOURCE_NAME = { catalog: "Delivered project", lead: "2026 lead", new: "New" } as const;

export default async function MasterMapPage(props: PageProps<"/map">) {
  const sp = await props.searchParams;
  const one = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string) : "");
  const bundle = one("bundle");
  const origin = one("source");
  const q = one("q").toLowerCase();
  const showEmpty = one("empty") === "1";
  const db = await readDb();
  const available = await masterMapAvailable();

  if (!db.mapImportedAt) {
    return (
      <div className="max-w-3xl space-y-5">
        <h1 className="text-2xl font-semibold">Master map</h1>
        {available ? (
          <div className="card space-y-3 p-5">
            <p className="text-sm text-slate-600">
              The repository includes the master map prepared on {available.generatedAt}: every project with its proposals, case studies and Figma files, plus a few open questions. Load it once to browse it here; uploads with a known file name are then linked automatically.
            </p>
            <form action={importMasterMap}>
              <button className="btn btn-primary">Load master map</button>
            </form>
          </div>
        ) : (
          <p className="card p-5 text-sm text-slate-600">
            No master map in this copy of the app (<code>seed/master-map.json</code> is missing). Pull the latest version of the repository, or ask for the map file.
          </p>
        )}
      </div>
    );
  }

  const docsBy = new Map<string, Source[]>();
  for (const s of db.sources) if (s.projectId) docsBy.set(s.projectId, [...(docsBy.get(s.projectId) || []), s]);
  const uploadedNames = new Set(db.sources.map((s) => (s.fileName ? fileKey(s.fileName) : "")).filter(Boolean));

  const rows = db.projects
    .map((p) => {
      const files = (db.mapFiles || []).filter((f) => f.projectId === p.id);
      const srcs = docsBy.get(p.id) || [];
      const has: Record<Kind, boolean> = {
        proposal: files.some((f) => f.kind === "proposal") || srcs.some((s) => s.kind === "proposal"),
        case_study: files.some((f) => f.kind === "case_study") || srcs.some((s) => s.kind === "case_study"),
        figma: srcs.some((s) => s.format === "figma"),
      };
      const count = Object.values(has).filter(Boolean).length;
      return { p, files, srcs, has, count };
    })
    .filter((r) => showEmpty || r.count > 0)
    .filter((r) => !bundle || String(r.count) === bundle)
    .filter((r) => !origin || (r.p.source || "catalog") === origin)
    .filter((r) => !q || `${r.p.name} ${r.p.leadFolder || ""} ${r.p.industry || ""} ${r.files.map((f) => f.fileName).join(" ")}`.toLowerCase().includes(q))
    .sort((a, b) => b.count - a.count || a.p.name.localeCompare(b.p.name));

  const all = db.projects.map((p) => {
    const files = (db.mapFiles || []).filter((f) => f.projectId === p.id);
    const srcs = docsBy.get(p.id) || [];
    return [files.some((f) => f.kind === "proposal") || srcs.some((s) => s.kind === "proposal"), files.some((f) => f.kind === "case_study") || srcs.some((s) => s.kind === "case_study"), srcs.some((s) => s.format === "figma")].filter(Boolean).length;
  });
  const countOf = (n: number) => all.filter((c) => c === n).length;
  const open = (db.questions || []).filter((x) => !x.answer);
  const unassignedFigma = db.sources.filter((s) => s.format === "figma" && !s.projectId);
  const portfolioToFetch = (db.mapFiles || []).filter((f) => f.kind === "case_study" && f.url && !uploadedNames.has(fileKey(f.fileName))).length;
  const projectsSorted = [...db.projects].sort((a, b) => a.name.localeCompare(b.name));
  const qs = (o: Record<string, string>) => {
    const u = new URLSearchParams({ ...(bundle && { bundle }), ...(origin && { source: origin }), ...(q && { q }), ...(showEmpty && { empty: "1" }), ...o });
    for (const [k, v] of [...u.entries()]) if (!v) u.delete(k);
    return `/map?${u}`;
  };

  return (
    <div className="max-w-7xl space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Master map</h1>
          <p className="text-sm text-slate-500">Every project with the proposals, case studies and Figma files that belong to it. Uploading a file the map knows links it automatically.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {portfolioToFetch > 0 && (
            <form action={fetchPortfolioCaseStudies}>
              <button className="btn" title="Download the case studies published on your portfolio site and add them, already linked">Fetch {portfolioToFetch} case studies from portfolio site</button>
            </form>
          )}
          <Link href="/upload" className="btn btn-primary">Upload proposals</Link>
        </div>
      </header>

      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat href={qs({ bundle: "3" })} value={countOf(3)} label="Complete (all three)" tone="text-emerald-600" />
        <Stat href={qs({ bundle: "2" })} value={countOf(2)} label="Two of three" tone="text-amber-600" />
        <Stat href={qs({ bundle: "1" })} value={countOf(1)} label="One asset" tone="text-slate-600" />
        <Stat href="#questions" value={open.length} label="Questions for you" tone="text-rose-600" />
      </section>

      {open.length > 0 && (
        <section id="questions" className="card">
          <h2 className="border-b border-slate-100 px-4 py-3 text-sm font-semibold">Questions for you</h2>
          <ul className="divide-y divide-slate-100">
            {(db.questions || []).map((x) => (
              <li key={x.id} className="grid gap-3 px-4 py-3 lg:grid-cols-[1fr_1.1fr]">
                <div>
                  <p className="text-sm font-medium">{x.item}</p>
                  <p className="text-sm text-slate-600">{x.question}</p>
                  {x.answer && <p className="mt-1 text-xs text-emerald-700">Answered: {x.answer.projectId ? db.projects.find((p) => p.id === x.answer!.projectId)?.name : ""} {x.answer.text || ""}</p>}
                </div>
                <form action={answerQuestion.bind(null, x.id)} className="flex flex-wrap items-start gap-2">
                  <select name="projectId" className="input w-72" defaultValue={x.answer?.projectId || ""}>
                    <option value="">{x.targets.length ? "Choose the project…" : "(no project needed)"}</option>
                    {(x.suggest || []).length > 0 && (
                      <optgroup label="Likely">
                        {(x.suggest || []).map((id) => {
                          const p = db.projects.find((pp) => pp.id === id);
                          return p ? <option key={id} value={id}>{label(p)}</option> : null;
                        })}
                      </optgroup>
                    )}
                    <optgroup label="All projects">
                      {projectsSorted.map((p) => (
                        <option key={p.id} value={p.id}>{label(p)}</option>
                      ))}
                    </optgroup>
                  </select>
                  <input name="text" className="input w-48" placeholder="Or a note / yes / no" defaultValue={x.answer?.text || ""} />
                  <button className="btn">{x.answer ? "Update" : "Save"}</button>
                </form>
              </li>
            ))}
          </ul>
        </section>
      )}

      <form className="card flex flex-wrap items-end gap-3 p-3">
        <div className="min-w-56 flex-1">
          <label className="label" htmlFor="q">Search</label>
          <input id="q" name="q" defaultValue={one("q")} className="input" placeholder="Project, client folder, file name…" />
        </div>
        <div>
          <label className="label" htmlFor="bundle">Bundle</label>
          <select id="bundle" name="bundle" defaultValue={bundle} className="input">
            <option value="">All</option>
            <option value="3">All three</option>
            <option value="2">Two of three</option>
            <option value="1">One</option>
          </select>
        </div>
        <div>
          <label className="label" htmlFor="source">Type</label>
          <select id="source" name="source" defaultValue={origin} className="input">
            <option value="">All</option>
            <option value="catalog">Delivered projects</option>
            <option value="lead">2026 leads</option>
            <option value="new">New</option>
          </select>
        </div>
        <label className="flex items-center gap-2 pb-2 text-sm text-slate-600">
          <input type="checkbox" name="empty" value="1" defaultChecked={showEmpty} /> Include projects with no files
        </label>
        <button className="btn">Apply</button>
        {(bundle || origin || q || showEmpty) && <Link href="/map" className="btn">Clear</Link>}
      </form>

      <section className="card overflow-hidden">
        <div className="border-b border-slate-100 px-4 py-2.5 text-sm text-slate-500">{rows.length} projects · click a project to see its files</div>
        <ul className="divide-y divide-slate-100">
          {rows.slice(0, 500).map(({ p, files, srcs, has, count }) => (
            <li key={p.id}>
              <details className="group">
                <summary className="flex cursor-pointer list-none items-center gap-3 px-4 py-2.5 hover:bg-slate-50">
                  <span className={`grid h-6 w-9 shrink-0 place-items-center rounded text-xs font-semibold ${count === 3 ? "bg-emerald-100 text-emerald-800" : count === 2 ? "bg-amber-100 text-amber-800" : "bg-slate-100 text-slate-600"}`}>{count}/3</span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{p.name}</span>
                    <span className="block truncate text-xs text-slate-500">
                      {SOURCE_NAME[p.source || "catalog"]}
                      {p.catalogId ? ` · ${p.catalogId}` : ""}
                      {p.industry ? ` · ${p.industry}` : ""}
                      {p.leadFolder ? ` · ${p.month} · ${p.leadFolder}` : ""}
                    </span>
                  </span>
                  {(["proposal", "case_study", "figma"] as Kind[]).map((k) => (
                    <span key={k} className={`w-24 text-center text-xs ${has[k] ? "font-medium text-slate-800" : "text-slate-300"}`}>{has[k] ? "✓ " : ""}{KIND_NAME[k]}</span>
                  ))}
                  <span className="text-slate-400 transition group-open:rotate-90">›</span>
                </summary>
                <div className="grid gap-4 bg-slate-50/70 px-4 py-3 text-sm lg:grid-cols-3">
                  <Column title="Proposals" items={[...files.filter((f) => f.kind === "proposal").map((f) => ({ key: f.fileName, name: f.fileName, sub: `${f.location}${f.confidence !== "High" ? ` · ${f.confidence}` : ""}${f.note && f.note !== "In this lead's folder" ? ` · ${f.note}` : ""}`, uploaded: srcs.find((s) => s.fileName && fileKey(s.fileName) === fileKey(f.fileName)) })), ...srcs.filter((s) => s.kind === "proposal" && !files.some((f) => s.fileName && fileKey(f.fileName) === fileKey(s.fileName))).map((s) => ({ key: s.id, name: s.title, sub: "Uploaded", uploaded: s }))]} />
                  <Column title="Case studies" items={[...files.filter((f) => f.kind === "case_study").map((f) => ({ key: f.fileName, name: f.location === "portfolio site" ? "Portfolio site case study" : f.fileName, href: f.url, sub: `${f.location}${f.note ? ` · ${f.note}` : ""}`, uploaded: srcs.find((s) => s.fileName && fileKey(s.fileName) === fileKey(f.fileName)) })), ...srcs.filter((s) => s.kind === "case_study" && !files.some((f) => s.fileName && fileKey(f.fileName) === fileKey(s.fileName))).map((s) => ({ key: s.id, name: s.title, sub: "Uploaded", uploaded: s }))]} />
                  <Column title="Figma" items={srcs.filter((s) => s.format === "figma").map((s) => ({ key: s.id, name: s.title || "Figma file", href: s.figmaUrl, sub: s.match?.candidates?.[0]?.evidence?.[0] || "", uploaded: s }))} />
                  {(p.notes || p.summary) && <p className="text-xs text-slate-500 lg:col-span-3">{p.notes || p.summary}</p>}
                  <div className="flex gap-3 text-xs lg:col-span-3">
                    <Link className="text-brand-600 hover:underline" href={`/projects/${p.id}`}>Open project</Link>
                    <Link className="text-brand-600 hover:underline" href={`/upload?project=${p.id}`}>Upload for this project</Link>
                  </div>
                </div>
              </details>
            </li>
          ))}
          {rows.length === 0 && <li className="px-4 py-10 text-center text-sm text-slate-500">No projects match.</li>}
        </ul>
        {rows.length > 500 && <p className="border-t border-slate-100 px-4 py-2 text-xs text-slate-500">Showing 500 of {rows.length}. Narrow it down with the filters.</p>}
      </section>

      {unassignedFigma.length > 0 && (
        <section className="card">
          <h2 className="border-b border-slate-100 px-4 py-3 text-sm font-semibold">
            Figma files without a project <span className="font-normal text-slate-500">({unassignedFigma.length}) · link them from the Mapping page</span>
          </h2>
          <p className="flex flex-wrap gap-x-4 gap-y-1 px-4 py-3 text-sm">
            {unassignedFigma.map((s) => (
              <a key={s.id} href={s.figmaUrl} target="_blank" rel="noreferrer" className="text-slate-600 hover:text-brand-600">{s.title}</a>
            ))}
          </p>
        </section>
      )}
    </div>
  );
}

function label(p: Project) {
  return `${p.name}${p.source === "lead" ? " (2026 lead)" : p.catalogId ? ` (${p.catalogId})` : ""}`;
}

function Stat({ href, value, label, tone }: { href: string; value: number; label: string; tone: string }) {
  return (
    <Link href={href} className="card p-4 hover:border-brand-500">
      <div className={`text-3xl font-semibold ${tone}`}>{value}</div>
      <div className="mt-1 text-sm text-slate-500">{label}</div>
    </Link>
  );
}

function Column({ title, items }: { title: string; items: Array<{ key: string; name: string; sub?: string; href?: string; uploaded?: Source }> }) {
  return (
    <div>
      <h3 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</h3>
      {items.length === 0 ? (
        <p className="text-xs text-slate-400">None known</p>
      ) : (
        <ul className="space-y-2">
          {items.map((it) => (
            <li key={it.key} className="leading-snug">
              <div className="flex items-start gap-2">
                {it.href ? (
                  <a href={it.href} target="_blank" rel="noreferrer" className="break-all font-medium text-slate-800 hover:text-brand-600">{it.name}</a>
                ) : (
                  <span className="break-all font-medium text-slate-800">{it.name}</span>
                )}
              </div>
              {it.sub && <div className="text-xs text-slate-500">{it.sub}</div>}
              <div className="mt-0.5 text-xs">
                {it.uploaded ? (
                  <Link href={`/sources/${it.uploaded.id}`} className="inline-flex items-center gap-1.5 hover:underline">
                    <StatusBadge status={it.uploaded.status} />
                  </Link>
                ) : (
                  <span className="text-slate-400">Not uploaded yet</span>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
