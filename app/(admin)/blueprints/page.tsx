import Link from "next/link";
import { draftBlueprints } from "@/app/actions";
import { includedKinds, leakCheck } from "@/lib/blueprints";
import { readDb } from "@/lib/store";

export default async function BlueprintsPage() {
  const db = await readDb();
  const list = [...(db.blueprints || [])].sort((a, b) => Number(b.published) - Number(a.published) || a.title.localeCompare(b.title));
  return (
    <div className="max-w-6xl space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Store listings</h1>
          <p className="text-sm text-slate-500">What buyers see in the store. Drafts are written from the catalog and cleaned with each project&apos;s dictionary; nothing is public until you publish it, and only approved files are ever delivered.</p>
        </div>
        <Link href="/store" target="_blank" className="btn">Open the store ↗</Link>
      </header>

      <form action={draftBlueprints} className="card flex flex-wrap items-center gap-3 p-4 text-sm">
        <span>Create draft listings for projects with at least</span>
        <select name="min" defaultValue="2" className="input w-auto">
          <option value="3">all three assets</option>
          <option value="2">two of three assets</option>
          <option value="1">one asset</option>
        </select>
        <button className="btn btn-primary">Create drafts</button>
        <span className="text-xs text-slate-500">Or open any project and click “Create store listing”.</span>
      </form>

      <div className="card overflow-hidden">
        <table className="w-full">
          <thead className="border-b border-slate-200 bg-slate-50">
            <tr><th className="th">Listing</th><th className="th">Included (approved)</th><th className="th">Check</th><th className="th">Price</th><th className="th">Status</th></tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {list.map((b) => {
              const k = includedKinds(db, b);
              const leaks = leakCheck(db, b).length;
              const project = db.projects.find((p) => p.id === b.projectId);
              return (
                <tr key={b.id} className="hover:bg-slate-50">
                  <td className="td"><Link href={`/blueprints/${b.id}`} className="font-medium hover:text-brand-600">{b.title}</Link><div className="text-xs text-slate-500">{b.industry} · from {project?.name}</div></td>
                  <td className="td text-xs text-slate-600">{[k.proposal.length && "Proposal", k.case_study.length && "Case study", k.figma.length && "Figma"].filter(Boolean).join(" + ") || <span className="text-slate-400">nothing approved yet</span>}</td>
                  <td className="td text-xs">{leaks ? <span className="font-medium text-rose-600">{leaks} to check</span> : <span className="text-emerald-600">Clean</span>}</td>
                  <td className="td">${b.price}</td>
                  <td className="td">{b.published ? <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 ring-1 ring-emerald-200">Published</span> : <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">Draft</span>}</td>
                </tr>
              );
            })}
            {list.length === 0 && <tr><td colSpan={5} className="px-4 py-10 text-center text-sm text-slate-500">No listings yet. Create drafts above.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
