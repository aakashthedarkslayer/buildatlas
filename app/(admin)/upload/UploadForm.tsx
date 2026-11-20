"use client";
import Link from "next/link";
import { useRef, useState } from "react";

type Created = { id: string; title: string };
type Rejected = { name: string; reason: string };

const ACCEPT = /\.(pdf|docx)$/i;

export function UploadForm({ projects, defaultProjectId }: { projects: Array<{ id: string; name: string }>; defaultProjectId: string }) {
  const [files, setFiles] = useState<File[]>([]);
  const [skipped, setSkipped] = useState(0);
  const [drag, setDrag] = useState(false);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(0);
  const [created, setCreated] = useState<Created[]>([]);
  const [rejected, setRejected] = useState<Rejected[]>([]);
  const [duplicates, setDuplicates] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [kind, setKind] = useState("auto");
  const [projectId, setProjectId] = useState(defaultProjectId || "auto");
  const [figmaUrls, setFigmaUrls] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const folderRef = useRef<HTMLInputElement>(null);

  const addFiles = (list: FileList | File[] | null) => {
    if (!list) return;
    const all = Array.from(list);
    const ok = all.filter((f) => ACCEPT.test(f.name) && !f.name.startsWith("~$"));
    setSkipped((n) => n + (all.length - ok.length));
    setFiles((prev) => [...prev, ...ok.filter((f) => !prev.some((p) => p.name === f.name && p.size === f.size))]);
  };

  /** Folders dropped onto the zone: walk them recursively. */
  async function collect(items: DataTransferItemList): Promise<File[]> {
    const out: File[] = [];
    const walk = async (entry: FileSystemEntry | null): Promise<void> => {
      if (!entry) return;
      if (entry.isFile) out.push(await new Promise<File>((res, rej) => (entry as FileSystemFileEntry).file(res, rej)));
      else if (entry.isDirectory) {
        const reader = (entry as FileSystemDirectoryEntry).createReader();
        let batch: FileSystemEntry[];
        do {
          batch = await new Promise<FileSystemEntry[]>((res, rej) => reader.readEntries(res, rej));
          for (const e of batch) await walk(e);
        } while (batch.length);
      }
    };
    await Promise.all(Array.from(items).map((i) => walk(i.webkitGetAsEntry())));
    return out;
  }

  async function post(fd: FormData): Promise<{ created: Created[]; rejected: Rejected[]; duplicates?: number }> {
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    if (res.status === 401) throw new Error("Your session expired. Sign in again.");
    if (!res.ok) throw new Error(`Upload failed (${res.status})`);
    return res.json();
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setCreated([]);
    setRejected([]);
    setDuplicates(0);
    setDone(0);
    try {
      if (kind === "figma") {
        const fd = new FormData();
        fd.set("kind", "figma");
        fd.set("projectId", projectId);
        fd.set("figmaUrls", figmaUrls);
        const r = await post(fd);
        setCreated(r.created);
        setRejected(r.rejected);
        setDuplicates(r.duplicates || 0);
        setFigmaUrls("");
      } else {
        // One request per file: big folders upload steadily and a failure only loses one file.
        for (const f of files) {
          const fd = new FormData();
          fd.set("kind", kind);
          fd.set("projectId", projectId);
          fd.append("files", f);
          try {
            const r = await post(fd);
            setCreated((c) => [...c, ...r.created]);
            setRejected((x) => [...x, ...r.rejected]);
          } catch (err) {
            setRejected((x) => [...x, { name: f.name, reason: (err as Error).message }]);
            if ((err as Error).message.includes("session")) throw err;
          }
          setDone((d) => d + 1);
        }
        setFiles([]);
        setSkipped(0);
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const total = files.reduce((n, f) => n + f.size, 0);

  return (
    <form onSubmit={submit} className="card space-y-5 p-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="kind">Type</label>
          <select id="kind" className="input" value={kind} onChange={(e) => setKind(e.target.value)}>
            <option value="auto">Detect automatically</option>
            <option value="proposal">Proposal</option>
            <option value="case_study">Case study</option>
            <option value="figma">Figma design (links)</option>
            <option value="other">Other document</option>
          </select>
        </div>
        <div>
          <label className="label" htmlFor="projectId">Project</label>
          <select id="projectId" className="input" value={projectId} onChange={(e) => setProjectId(e.target.value)}>
            <option value="auto">Detect automatically</option>
            <option value="">Leave unlinked</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          <p className="mt-1 text-xs text-slate-500">
            {projectId === "auto" ? (
              <>Each file is matched to a catalog project; unsure ones wait on the <Link href="/mapping" className="text-brand-600 hover:underline">Mapping</Link> page.</>
            ) : (
              "Linking a project applies its dictionary terms (client names, people, domains)."
            )}
          </p>
        </div>
      </div>

      {kind === "figma" ? (
        <div>
          <label className="label" htmlFor="figmaUrls">Figma links (one per line, as many as you like)</label>
          <textarea id="figmaUrls" value={figmaUrls} onChange={(e) => setFigmaUrls(e.target.value)} rows={7} className="input font-mono text-xs" placeholder="https://www.figma.com/design/AbC123.../Project-name" />
        </div>
      ) : (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDrag(true);
          }}
          onDragLeave={() => setDrag(false)}
          onDrop={async (e) => {
            e.preventDefault();
            setDrag(false);
            addFiles(await collect(e.dataTransfer.items));
          }}
          className={`rounded-xl border-2 border-dashed px-6 py-10 text-center transition ${drag ? "border-brand-500 bg-brand-50" : "border-slate-300"}`}
        >
          <input ref={fileRef} type="file" multiple accept=".pdf,.docx" className="hidden" onChange={(e) => addFiles(e.target.files)} />
          {/* webkitdirectory lets you pick a whole folder (sub-folders included) */}
          <input ref={folderRef} type="file" multiple className="hidden" {...({ webkitdirectory: "", directory: "" } as Record<string, string>)} onChange={(e) => addFiles(e.target.files)} />
          <p className="text-sm font-medium text-slate-700">Drop files or whole folders here</p>
          <p className="mt-1 text-xs text-slate-500">PDF and DOCX, up to 80 MB each. Other files in a folder are skipped.</p>
          <div className="mt-4 flex justify-center gap-2">
            <button type="button" className="btn" onClick={() => fileRef.current?.click()}>Choose files</button>
            <button type="button" className="btn" onClick={() => folderRef.current?.click()}>Choose a folder</button>
          </div>
        </div>
      )}

      {files.length > 0 && kind !== "figma" && (
        <div className="rounded-lg border border-slate-200">
          <div className="flex items-center justify-between border-b border-slate-100 px-3 py-2 text-sm">
            <span className="font-medium">{files.length} file{files.length === 1 ? "" : "s"} · {(total / 1024 / 1024).toFixed(1)} MB{skipped ? <span className="ml-2 font-normal text-slate-500">({skipped} non-PDF/DOCX skipped)</span> : null}</span>
            {!busy && <button type="button" className="text-xs text-rose-600 hover:underline" onClick={() => { setFiles([]); setSkipped(0); }}>Clear</button>}
          </div>
          <ul className="max-h-56 divide-y divide-slate-100 overflow-auto text-sm">
            {files.map((f, i) => (
              <li key={f.name + f.size} className="flex items-center justify-between px-3 py-1.5">
                <span className="truncate">{(f as File & { webkitRelativePath?: string }).webkitRelativePath || f.name}</span>
                <span className="ml-3 shrink-0 text-xs text-slate-500">{busy ? (i < done ? "✓" : i === done ? "uploading…" : "") : `${(f.size / 1024 / 1024).toFixed(1)} MB`}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {busy && kind !== "figma" && files.length > 0 && (
        <div className="h-2 overflow-hidden rounded-full bg-slate-100">
          <div className="h-full bg-brand-600 transition-all" style={{ width: `${(done / files.length) * 100}%` }} />
        </div>
      )}

      <div className="flex items-center gap-3">
        <button className="btn btn-primary" disabled={busy || (kind === "figma" ? !figmaUrls.trim() : files.length === 0)}>
          {busy ? `Uploading ${done} / ${files.length || "…"}` : kind === "figma" ? "Add Figma files" : `Upload ${files.length || ""} file${files.length === 1 ? "" : "s"}`}
        </button>
        {error && <span className="text-sm text-rose-600">{error}</span>}
      </div>

      {(created.length > 0 || rejected.length > 0 || duplicates > 0) && !busy && (
        <div className="space-y-2 rounded-lg bg-slate-50 p-3 text-sm">
          {duplicates > 0 && (
            <p className="text-slate-600">
              Skipped {duplicates} link{duplicates === 1 ? "" : "s"} to Figma file{duplicates === 1 ? "" : "s"} already added{created.length === 0 ? ": nothing new in this list" : ""}.
            </p>
          )}
          {created.length > 0 && (
            <p>
              Added {created.length}. They are processed one by one in the background.{" "}
              {projectId === "auto" ? (
                <Link href="/mapping" className="font-medium text-brand-600 hover:underline">Check the mapping →</Link>
              ) : (
                <Link href="/sources" className="font-medium text-brand-600 hover:underline">Open the review queue →</Link>
              )}
            </p>
          )}
          {rejected.map((r) => (
            <p key={r.name} className="text-rose-600">Skipped {r.name}: {r.reason}</p>
          ))}
        </div>
      )}
    </form>
  );
}
