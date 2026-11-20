"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { confirmMatches, createProjectForSources, markUnlinked, setSourceKind } from "@/app/actions";
import type { SourceKind } from "@/lib/types";
import { KIND_LABEL } from "@/lib/types";

export interface Row {
  id: string;
  title: string;
  kind: SourceKind;
  format: string;
  status: "auto" | "suggested" | "none" | "confirmed";
  confidence: number;
  projectId?: string;
  guessedName?: string;
  aiNote?: string;
  candidates: Array<{ projectId: string; score: number; evidence: string[]; name: string }>;
}

type Project = { id: string; name: string };

const norm = (s?: string) => (s || "").toLowerCase().replace(/[^\p{L}\p{N}]+/gu, "");

export function MappingDecisions({ undecided, auto, projects }: { undecided: Row[]; auto: Row[]; projects: Project[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  // Chosen project per row: the best candidate by default.
  const [choice, setChoice] = useState<Record<string, string>>({});
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [groupNames, setGroupNames] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState<string | null>(null);

  const chosen = (r: Row) => choice[r.id] ?? r.candidates[0]?.projectId ?? "";
  const run = (fn: () => Promise<unknown>, done: string) =>
    start(async () => {
      await fn();
      setSelected(new Set());
      setMsg(done);
      router.refresh();
    });

  const suggested = undecided.filter((r) => r.candidates.length > 0).sort((a, b) => b.confidence - a.confidence);
  const unmatched = undecided.filter((r) => r.candidates.length === 0);

  // Unmatched files that seem to be about the same product: offer one new project per group.
  const groups = useMemo(() => {
    const m = new Map<string, Row[]>();
    for (const r of unmatched) {
      const key = norm(r.guessedName) || `__${r.id}`;
      m.set(key, [...(m.get(key) || []), r]);
    }
    return [...m.entries()].sort((a, b) => b[1].length - a[1].length);
  }, [unmatched]);

  const toggle = (id: string) => setSelected((s) => {
    const n = new Set(s);
    if (n.has(id)) n.delete(id);
    else n.add(id);
    return n;
  });

  const confirmSelected = (rows: Row[]) => {
    const pairs = rows.filter((r) => selected.has(r.id) && chosen(r)).map((r) => ({ sourceId: r.id, projectId: chosen(r) }));
    if (pairs.length) run(() => confirmMatches(pairs), `Linked ${pairs.length} file${pairs.length > 1 ? "s" : ""}. They are being re-cleaned with their project's dictionary.`);
  };

  return (
    <div className="space-y-6">
      {msg && <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm text-emerald-800">{msg}</p>}

      <section className="card">
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 px-4 py-3">
          <h2 className="mr-auto text-sm font-semibold">Suggested matches <span className="font-normal text-slate-500">({suggested.length})</span></h2>
          <button className="btn py-1 text-xs" onClick={() => setSelected(new Set(suggested.filter((r) => r.confidence >= 50).map((r) => r.id)))}>Select ≥ 50% confident</button>
          <button className="btn py-1 text-xs" onClick={() => setSelected(new Set(suggested.map((r) => r.id)))}>Select all</button>
          <button className="btn btn-primary py-1 text-xs" disabled={pending || !suggested.some((r) => selected.has(r.id))} onClick={() => confirmSelected(suggested)}>
            Confirm {suggested.filter((r) => selected.has(r.id)).length || ""} selected
          </button>
          <button className="btn py-1 text-xs" disabled={pending || !suggested.some((r) => selected.has(r.id))} onClick={() => run(() => markUnlinked(suggested.filter((r) => selected.has(r.id)).map((r) => r.id)), "Marked as not belonging to a project.")}>
            Not in any project
          </button>
        </div>
        {suggested.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-slate-500">Nothing waiting. New uploads set to “Detect automatically” show up here when the match isn&apos;t certain.</p>
        ) : (
          <div className="max-h-[640px] overflow-auto">
            <table className="w-full">
              <thead className="sticky top-0 z-10 bg-slate-50">
                <tr>
                  <th className="th w-8" />
                  <th className="th">File</th>
                  <th className="th">Belongs to</th>
                  <th className="th w-20">Confidence</th>
                  <th className="th">Why</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {suggested.map((r) => (
                  <DecisionRow key={r.id} r={r} projects={projects} selected={selected.has(r.id)} onToggle={() => toggle(r.id)} value={chosen(r)} onChange={(v) => setChoice((c) => ({ ...c, [r.id]: v }))} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {groups.length > 0 && (
        <section className="card">
          <div className="border-b border-slate-100 px-4 py-3">
            <h2 className="text-sm font-semibold">No matching project <span className="font-normal text-slate-500">({unmatched.length} files)</span></h2>
            <p className="text-xs text-slate-500">Grouped by the product each file seems to be about. Create a project for a group, or pick an existing one.</p>
          </div>
          <ul className="divide-y divide-slate-100">
            {groups.map(([key, rows]) => {
              const name = groupNames[key] ?? rows[0].guessedName ?? "";
              return (
                <li key={key} className="grid gap-3 px-4 py-3 lg:grid-cols-[1fr_1.2fr]">
                  <div className="space-y-1">
                    {rows.map((r) => (
                      <div key={r.id} className="flex items-center gap-2 text-sm">
                        <KindSelect r={r} onDone={() => router.refresh()} />
                        <Link href={`/sources/${r.id}`} className="truncate hover:text-brand-600">{r.title}</Link>
                      </div>
                    ))}
                    {rows[0].aiNote && <p className="text-xs text-indigo-700">{rows[0].aiNote}</p>}
                  </div>
                  <div className="flex flex-wrap items-start gap-2">
                    <input className="input w-56" value={name} placeholder="New project name" onChange={(e) => setGroupNames((g) => ({ ...g, [key]: e.target.value }))} />
                    <button className="btn btn-primary" disabled={pending || !name.trim()} onClick={() => run(() => createProjectForSources(name, rows.map((r) => r.id)), `Created “${name}” and linked ${rows.length} file${rows.length > 1 ? "s" : ""}.`)}>
                      Create project
                    </button>
                    <ProjectPicker
                      projects={projects}
                      onPick={(pid) => run(() => confirmMatches(rows.map((r) => ({ sourceId: r.id, projectId: pid }))), `Linked ${rows.length} file${rows.length > 1 ? "s" : ""}.`)}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {auto.length > 0 && (
        <section className="card">
          <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 px-4 py-3">
            <h2 className="mr-auto text-sm font-semibold">
              Linked automatically <span className="font-normal text-slate-500">({auto.length}): spot-check, then confirm</span>
            </h2>
            <button className="btn py-1 text-xs" onClick={() => setSelected(new Set(auto.map((r) => r.id)))}>Select all</button>
            <button className="btn btn-primary py-1 text-xs" disabled={pending || !auto.some((r) => selected.has(r.id))} onClick={() => confirmSelected(auto)}>
              Confirm {auto.filter((r) => selected.has(r.id)).length || ""} selected
            </button>
          </div>
          <div className="max-h-[480px] overflow-auto">
            <table className="w-full">
              <tbody className="divide-y divide-slate-100">
                {auto.map((r) => (
                  <DecisionRow key={r.id} r={r} projects={projects} selected={selected.has(r.id)} onToggle={() => toggle(r.id)} value={choice[r.id] ?? r.projectId ?? ""} onChange={(v) => setChoice((c) => ({ ...c, [r.id]: v }))} />
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}

function DecisionRow({ r, projects, selected, onToggle, value, onChange }: { r: Row; projects: Project[]; selected: boolean; onToggle: () => void; value: string; onChange: (v: string) => void }) {
  const router = useRouter();
  const ev = r.candidates.find((c) => c.projectId === value)?.evidence || [];
  const tone = r.confidence >= 70 ? "bg-emerald-500" : r.confidence >= 45 ? "bg-amber-400" : "bg-rose-400";
  return (
    <tr className={selected ? "bg-brand-50/60" : ""}>
      <td className="td"><input type="checkbox" checked={selected} onChange={onToggle} aria-label={`Select ${r.title}`} /></td>
      <td className="td max-w-xs">
        <Link href={`/sources/${r.id}`} className="block truncate font-medium hover:text-brand-600" title={r.title}>{r.title}</Link>
        <div className="mt-1"><KindSelect r={r} onDone={() => router.refresh()} /></div>
      </td>
      <td className="td min-w-64">
        <select className="input py-1" value={value} onChange={(e) => onChange(e.target.value)}>
          {!value && <option value="">Choose a project…</option>}
          {r.candidates.length > 0 && (
            <optgroup label="Suggested">
              {r.candidates.map((c) => (
                <option key={c.projectId} value={c.projectId}>{c.name} ({c.score})</option>
              ))}
            </optgroup>
          )}
          <optgroup label="All projects">
            {projects.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </optgroup>
        </select>
      </td>
      <td className="td">
        <div className="flex items-center gap-1.5">
          <div className="h-1.5 w-12 overflow-hidden rounded-full bg-slate-100"><div className={`h-full ${tone}`} style={{ width: `${r.confidence}%` }} /></div>
          <span className="text-xs tabular-nums text-slate-500">{r.confidence}</span>
        </div>
      </td>
      <td className="td text-xs text-slate-600">
        {ev.length ? ev.slice(0, 3).map((e, i) => <div key={i}>{e}</div>) : <span className="text-slate-400">Chosen by you</span>}
        {r.aiNote && !ev.some((e) => e.startsWith("AI")) && <div className="text-indigo-700">{r.aiNote}</div>}
      </td>
    </tr>
  );
}

function KindSelect({ r, onDone }: { r: Row; onDone: () => void }) {
  const [pending, start] = useTransition();
  if (r.format === "figma") return <span className="rounded bg-pink-50 px-1.5 py-0.5 text-xs font-medium text-pink-700">Figma</span>;
  return (
    <select
      disabled={pending}
      value={r.kind}
      onChange={(e) => start(async () => { await setSourceKind(r.id, e.target.value as SourceKind); onDone(); })}
      className="rounded border border-slate-200 bg-white px-1 py-0.5 text-xs text-slate-600"
      title="Detected type: change it if wrong"
    >
      {(["proposal", "case_study", "other"] as SourceKind[]).map((k) => (
        <option key={k} value={k}>{KIND_LABEL[k]}</option>
      ))}
    </select>
  );
}

function ProjectPicker({ projects, onPick }: { projects: Project[]; onPick: (id: string) => void }) {
  const [q, setQ] = useState("");
  const listId = useMemo(() => `pp-${Math.random().toString(36).slice(2)}`, []);
  const match = projects.find((p) => p.name === q);
  return (
    <div className="flex gap-2">
      <input list={listId} className="input w-56" placeholder="…or existing project" value={q} onChange={(e) => setQ(e.target.value)} />
      <datalist id={listId}>
        {projects.map((p) => (
          <option key={p.id} value={p.name} />
        ))}
      </datalist>
      <button className="btn" disabled={!match} onClick={() => match && onPick(match.id)}>Link</button>
    </div>
  );
}
