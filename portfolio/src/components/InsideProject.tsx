import { useState } from "react";
import { PROJECTS } from "../data/projects";
import { cx } from "./mocks/primitives";
import { ProjectDetail } from "./ProjectDetail";
import { Section } from "./Section";

/** "What's inside a project": a live, switchable preview of the detail view. */
export function InsideProject() {
  const options = PROJECTS.filter((p) => p.featured).slice(0, 4);
  const [id, setId] = useState(options[0]?.id);
  const project = options.find((p) => p.id === id) ?? options[0];
  if (!project) return null;
  return (
    <Section id="inside" eyebrow="Inside a project" title="More than screens: the product behind them" intro="Each project is organised the same way, so you can go from the big picture to the detail in a few clicks. What's available varies by project; not every project has a case study or requirements document.">
      <div className="mb-6 flex flex-wrap gap-2" role="group" aria-label="Choose a sample project">
        {options.map((p) => (
          <button key={p.id} onClick={() => setId(p.id)} aria-pressed={p.id === project.id} className={cx("rounded-full px-3.5 py-1.5 text-sm transition", p.id === project.id ? "bg-white text-ink-900" : "bg-white/[0.04] text-slate-400 ring-1 ring-white/[0.08] hover:text-white")}>
            {p.title}
          </button>
        ))}
      </div>
      <div className="rounded-3xl border border-white/[0.07] bg-ink-850 p-5 sm:p-8">
        <ProjectDetail key={project.id} project={project} />
      </div>
    </Section>
  );
}
