import { BookOpen, Check, FileText, Layers, ListChecks, PenTool, Route, Users } from "lucide-react";
import { useId, useState, type ReactNode } from "react";
import { industryName, type Project } from "../data/projects";
import { cx } from "./mocks/primitives";
import { IllustrativeBadge, ScreenPreview } from "./ScreenPreview";

type Tab = "overview" | "roles" | "features" | "workflows" | "screens" | "case" | "requirements";

/** Tabbed project view: used in the modal and in the "inside a project" section. */
export function ProjectDetail({ project }: { project: Project }) {
  const tabs: Array<{ id: Tab; label: string; icon: ReactNode; show: boolean }> = [
    { id: "overview", label: "Overview", icon: <Layers className="h-4 w-4" />, show: true },
    { id: "roles", label: "User roles", icon: <Users className="h-4 w-4" />, show: project.roles.length > 0 },
    { id: "features", label: "Key features", icon: <ListChecks className="h-4 w-4" />, show: project.features.length > 0 },
    { id: "workflows", label: "Workflows", icon: <Route className="h-4 w-4" />, show: project.workflows.length > 0 },
    { id: "screens", label: "Design screens", icon: <PenTool className="h-4 w-4" />, show: project.screens.length > 0 },
    { id: "case", label: "Case study", icon: <BookOpen className="h-4 w-4" />, show: project.resources.caseStudy },
    { id: "requirements", label: "Requirements", icon: <FileText className="h-4 w-4" />, show: project.resources.requirements },
  ];
  const visible = tabs.filter((t) => t.show);
  const [tab, setTab] = useState<Tab>("overview");
  const base = useId();

  const onKey = (e: React.KeyboardEvent) => {
    const i = visible.findIndex((t) => t.id === tab);
    if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
      e.preventDefault();
      const next = visible[(i + (e.key === "ArrowRight" ? 1 : visible.length - 1)) % visible.length];
      setTab(next.id);
      document.getElementById(`${base}-tab-${next.id}`)?.focus();
    }
  };

  return (
    <div>
      <div role="tablist" aria-label="Project sections" onKeyDown={onKey} className="flex gap-1 overflow-x-auto border-b border-white/[0.07] pb-px [scrollbar-width:none]">
        {visible.map((t) => (
          <button
            key={t.id}
            id={`${base}-tab-${t.id}`}
            role="tab"
            aria-selected={tab === t.id}
            aria-controls={`${base}-panel`}
            tabIndex={tab === t.id ? 0 : -1}
            onClick={() => setTab(t.id)}
            className={cx(
              "-mb-px inline-flex shrink-0 items-center gap-1.5 border-b-2 px-3 py-2.5 text-sm transition",
              tab === t.id ? "border-accent-400 text-white" : "border-transparent text-slate-500 hover:text-slate-200",
            )}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      <div id={`${base}-panel`} role="tabpanel" aria-labelledby={`${base}-tab-${tab}`} className="pt-6">
        {tab === "overview" && (
          <div className="grid gap-8 lg:grid-cols-[1.2fr_1fr]">
            <div>
              <p className="text-[15px] leading-relaxed text-slate-300">{project.overview}</p>
              <dl className="mt-6 grid grid-cols-2 gap-4 text-sm">
                <Fact label="Industry" value={industryName(project.industry)} />
                <Fact label="Platforms" value={project.platforms.join(", ")} />
                <Fact label="User roles" value={String(project.roles.length)} />
                <Fact label="Resources" value={[project.resources.design && "UI design", project.resources.caseStudy && "Case study", project.resources.requirements && "Requirements"].filter(Boolean).join(", ")} />
              </dl>
            </div>
            {project.screens[0] && (
              <div className="relative">
                <ScreenPreview screen={project.screens[0]} />
                {project.isPlaceholder && <IllustrativeBadge className="absolute right-3 top-12" />}
              </div>
            )}
          </div>
        )}

        {tab === "roles" && (
          <ul className="grid gap-3 sm:grid-cols-2">
            {project.roles.map((r) => (
              <li key={r.name} className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4">
                <div className="flex items-center gap-2 font-medium text-white"><Users className="h-4 w-4 text-accent-400" aria-hidden="true" />{r.name}</div>
                <p className="mt-1 text-sm text-slate-400">{r.does}</p>
              </li>
            ))}
          </ul>
        )}

        {tab === "features" && (
          <ul className="grid gap-2.5 sm:grid-cols-2">
            {project.features.map((f) => (
              <li key={f} className="flex items-start gap-2.5 text-sm text-slate-300"><Check className="mt-0.5 h-4 w-4 shrink-0 text-signal" aria-hidden="true" />{f}</li>
            ))}
          </ul>
        )}

        {tab === "workflows" && (
          <div className="space-y-6">
            {project.workflows.map((w) => (
              <div key={w.name}>
                <h4 className="text-sm font-medium text-white">{w.name}</h4>
                <ol className="mt-3 flex flex-col gap-2 md:flex-row md:items-stretch">
                  {w.steps.map((s, i) => (
                    <li key={s} className="relative flex flex-1 items-start gap-2 rounded-lg border border-white/[0.07] bg-white/[0.02] p-3 text-sm text-slate-300">
                      <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-accent-400/15 font-mono text-[11px] text-accent-300">{i + 1}</span>
                      {s}
                    </li>
                  ))}
                </ol>
              </div>
            ))}
          </div>
        )}

        {tab === "screens" && (
          <div className="grid items-end gap-6 sm:grid-cols-[3fr_1fr]">
            {project.screens.map((s) => (
              <figure key={s.caption} className={s.device === "mobile" ? "mx-auto w-40 sm:w-full" : ""}>
                <ScreenPreview screen={s} />
                <figcaption className="mt-2 text-center text-xs text-slate-500">{s.caption}{project.isPlaceholder ? " · illustrative" : ""}</figcaption>
              </figure>
            ))}
          </div>
        )}

        {tab === "case" && <DocCard icon={<BookOpen className="h-5 w-5" />} kind="Case study" doc={project.caseStudy} placeholder={project.isPlaceholder} />}
        {tab === "requirements" && <DocCard icon={<FileText className="h-5 w-5" />} kind="Product requirements" doc={project.requirements} placeholder={project.isPlaceholder} />}
      </div>
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wider text-slate-500">{label}</dt>
      <dd className="mt-1 text-slate-200">{value || "–"}</dd>
    </div>
  );
}

function DocCard({ icon, kind, doc, placeholder }: { icon: ReactNode; kind: string; doc?: { title: string; summary: string; url?: string }; placeholder: boolean }) {
  return (
    <div className="flex items-start gap-4 rounded-xl border border-white/[0.07] bg-white/[0.02] p-5">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-accent-400/10 text-accent-300">{icon}</span>
      <div>
        <div className="text-xs uppercase tracking-wider text-slate-500">{kind}</div>
        <div className="mt-1 font-medium text-white">{doc?.title ?? kind}</div>
        <p className="mt-1 text-sm text-slate-400">{doc?.summary ?? "Available on request."}</p>
        {doc?.url ? (
          <a href={doc.url} className="mt-3 inline-block text-sm font-medium text-accent-300 hover:text-accent-400">Open document →</a>
        ) : (
          <p className="mt-3 text-xs text-slate-500">{placeholder ? "Sample entry. The anonymised document is shared on request once licensing is confirmed." : "Shared on request."}</p>
        )}
      </div>
    </div>
  );
}
