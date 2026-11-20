import Link from "next/link";
import { notFound } from "next/navigation";
import { deleteBlueprint, redraftBlueprint, saveBlueprint, setPublished } from "@/app/actions";
import { StatusBadge } from "@/components/Badges";
import { leakCheck } from "@/lib/blueprints";
import { readDb } from "@/lib/store";
import { KIND_LABEL } from "@/lib/types";

export default async function BlueprintEditor(props: PageProps<"/blueprints/[id]">) {
  const { id } = await props.params;
  const db = await readDb();
  const b = (db.blueprints || []).find((x) => x.id === id);
  if (!b) notFound();
  const project = db.projects.find((p) => p.id === b.projectId);
  const leaks = leakCheck(db, b);
  const sources = db.sources.filter((s) => s.projectId === b.projectId);
  const save = saveBlueprint.bind(null, id);

  return (
    <div className="max-w-5xl space-y-5">
      <nav className="text-sm text-slate-500"><Link href="/blueprints" className="hover:text-slate-800">Store listings</Link> / {b.title}</nav>
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">{b.title}</h1>
          <p className="text-sm text-slate-500">From project <Link href={`/projects/${b.projectId}`} className="text-brand-600 hover:underline">{project?.name}</Link> · {b.published ? "Published" : "Draft"}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href={`/store/b/${b.slug}`} target="_blank" className="btn">Preview in store ↗</Link>
          <form action={redraftBlueprint.bind(null, id)}><button className="btn" title="Rewrite the text from the catalog and refresh the approved files (keeps price and status)">Re-draft</button></form>
        </div>
      </header>

      {leaks.length > 0 ? (
        <div className="card border-rose-200 bg-rose-50/60 p-4">
          <h2 className="text-sm font-semibold text-rose-800">Check before publishing ({leaks.length})</h2>
          <ul className="mt-2 space-y-1 text-sm">
            {leaks.map((l, i) => (<li key={i}><b className="text-rose-800">{l.text}</b>: <span className="text-slate-600">{l.context}</span></li>))}
          </ul>
        </div>
      ) : (
        <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">No known client names, people, contact details or unknown proper names in the listing text. Still read it once before publishing.</p>
      )}

      <form action={save} className="card grid gap-4 p-5">
        <Field label="Title" name="title" value={b.title} />
        <Field label="Tagline (one sentence)" name="tagline" value={b.tagline} />
        <div>
          <label className="label" htmlFor="summary">Overview</label>
          <textarea id="summary" name="summary" rows={6} className="input" defaultValue={b.summary} />
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Industry" name="industry" value={b.industry} />
          <Field label="Platforms (comma separated)" name="platforms" value={b.platforms.join(", ")} />
          <Field label="Price (USD)" name="price" value={String(b.price)} type="number" />
        </div>
        <Field label="Technology (comma separated)" name="tech" value={b.tech.join(", ")} />
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="features">Key features (one per line)</label>
            <textarea id="features" name="features" rows={7} className="input" defaultValue={b.features.join("\n")} />
          </div>
          <div>
            <label className="label" htmlFor="challenges">Problems it solves (one per line)</label>
            <textarea id="challenges" name="challenges" rows={7} className="input" defaultValue={b.challenges.join("\n")} />
          </div>
        </div>
        <div>
          <span className="label">Files delivered to buyers</span>
          <p className="mb-2 text-xs text-slate-500">Only approved, cleaned files can be included. Buyers never get the originals.</p>
          <ul className="space-y-1.5 text-sm">
            {sources.map((s) => (
              <li key={s.id} className="flex items-center gap-2">
                <input type="checkbox" name="sourceIds" value={s.id} defaultChecked={b.sourceIds.includes(s.id)} disabled={s.status !== "approved"} />
                <Link href={`/sources/${s.id}`} className="hover:underline">{s.title || s.fileName || "Figma file"}</Link>
                <span className="text-xs text-slate-500">{KIND_LABEL[s.kind]}</span>
                <StatusBadge status={s.status} />
              </li>
            ))}
            {sources.length === 0 && <li className="text-slate-500">No files uploaded for this project yet.</li>}
          </ul>
        </div>
        <div><button className="btn btn-primary">Save listing</button></div>
      </form>

      <div className="card flex flex-wrap items-center gap-3 p-4">
        {b.published ? (
          <form action={setPublished.bind(null, id, false)}><button className="btn">Unpublish</button></form>
        ) : (
          <form action={setPublished.bind(null, id, true)} className="flex flex-wrap items-center gap-3">
            {leaks.length > 0 && <label className="flex items-center gap-2 text-sm text-rose-700"><input type="checkbox" name="override" /> I checked these</label>}
            <button className="btn btn-success">Publish to store</button>
          </form>
        )}
        <form action={deleteBlueprint.bind(null, id)} className="ml-auto"><button className="btn btn-danger">Delete listing</button></form>
      </div>
    </div>
  );
}

function Field({ label, name, value, type = "text" }: { label: string; name: string; value: string; type?: string }) {
  return (
    <div>
      <label className="label" htmlFor={name}>{label}</label>
      <input id={name} name={name} type={type} defaultValue={value} className="input" />
    </div>
  );
}
