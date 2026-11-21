import { X } from "lucide-react";
import { useEffect, useRef } from "react";
import { industryName, type Project } from "../data/projects";
import { ProjectDetail } from "./ProjectDetail";
import { IllustrativeBadge } from "./ScreenPreview";

/** Accessible dialog: focus moves in, Tab stays inside, Escape or backdrop closes, focus returns. */
export function ProjectModal({ project, onClose }: { project: Project | null; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!project) return;
    const previous = document.activeElement as HTMLElement | null;
    const node = ref.current!;
    document.body.style.overflow = "hidden";
    node.querySelector<HTMLElement>("[data-autofocus]")?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key !== "Tab") return;
      const items = node.querySelectorAll<HTMLElement>('button, a[href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
      previous?.focus();
    };
  }, [project, onClose]);

  if (!project) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="absolute inset-0 bg-ink-950/80 backdrop-blur-sm" aria-hidden="true" />
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby="project-modal-title"
        className="relative max-h-[92vh] w-full max-w-5xl animate-rise overflow-y-auto rounded-t-2xl border border-white/10 bg-ink-900 p-5 shadow-2xl sm:rounded-2xl sm:p-8"
      >
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="font-medium text-accent-300">{industryName(project.industry)}</span>
              <span className="text-slate-600">·</span>
              <span className="text-slate-500">{project.platforms.join(" · ")}</span>
              {project.isPlaceholder && <IllustrativeBadge />}
            </div>
            <h2 id="project-modal-title" className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-3xl">{project.title}</h2>
          </div>
          <button data-autofocus onClick={onClose} aria-label="Close project" className="rounded-lg p-2 text-slate-400 ring-1 ring-white/10 hover:bg-white/[0.06] hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>
        <ProjectDetail project={project} />
      </div>
    </div>
  );
}
