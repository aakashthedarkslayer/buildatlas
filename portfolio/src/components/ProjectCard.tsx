import { ArrowUpRight, FileText, PenTool, BookOpen } from "lucide-react";
import { industryName, type Project } from "../data/projects";
import { IllustrativeBadge, ScreenPreview } from "./ScreenPreview";

export function ProjectCard({ project, onOpen }: { project: Project; onOpen: (p: Project) => void }) {
  const desktop = project.screens.find((s) => s.device === "desktop");
  const mobile = project.screens.find((s) => s.device === "mobile");
  return (
    <article onClick={() => onOpen(project)} className="group relative flex cursor-pointer flex-col overflow-hidden rounded-2xl border border-white/[0.07] bg-ink-850 transition duration-300 hover:-translate-y-1 hover:border-white/15 hover:bg-ink-800">
      {/* Preview: desktop with a phone overlapping the corner */}
      <div className="relative overflow-hidden border-b border-white/[0.06] bg-gradient-to-b from-ink-800 to-ink-850 px-6 pb-0 pt-6">
        {desktop && <ScreenPreview screen={desktop} className="translate-y-2 transition duration-500 group-hover:translate-y-0" />}
        {mobile && (
          <div className="absolute bottom-[-10%] right-4 w-[22%] transition duration-500 group-hover:-translate-y-2">
            <ScreenPreview screen={mobile} />
          </div>
        )}
        {project.isPlaceholder && <IllustrativeBadge className="absolute left-3 top-3" />}
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-center gap-2 text-xs">
          <span className="font-medium text-accent-300">{industryName(project.industry)}</span>
          <span className="text-slate-600">·</span>
          <span className="truncate text-slate-500">{project.platforms.join(" · ")}</span>
        </div>
        <h3 className="mt-2 text-lg font-semibold tracking-tight text-white">{project.title}</h3>
        <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-slate-400">{project.summary}</p>

        <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-5">
          <ul className="flex gap-1.5" aria-label="Available resources">
            {project.resources.design && <Resource icon={<PenTool className="h-3.5 w-3.5" />} label="UI design" />}
            {project.resources.caseStudy && <Resource icon={<BookOpen className="h-3.5 w-3.5" />} label="Case study" />}
            {project.resources.requirements && <Resource icon={<FileText className="h-3.5 w-3.5" />} label="Requirements" />}
          </ul>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onOpen(project);
            }}
            className="ml-auto inline-flex items-center gap-1 whitespace-nowrap rounded-lg px-2.5 py-1.5 text-sm font-medium text-white ring-1 ring-white/10 transition hover:bg-white/[0.06] hover:ring-white/20"
          >
            View project
            <ArrowUpRight className="h-4 w-4 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden="true" />
          </button>
        </div>
      </div>
    </article>
  );
}

function Resource({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <li title={label} className="inline-flex items-center gap-1 whitespace-nowrap rounded-md bg-white/[0.04] px-1.5 py-1 text-[11px] text-slate-400 ring-1 ring-white/[0.06]">
      {icon}
      <span>{label}</span>
    </li>
  );
}
