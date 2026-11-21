import { useMemo } from "react";
import { PROJECTS, industryName, type Project } from "../data/projects";
import { ProjectCard } from "./ProjectCard";
import { ProjectFilters, type FilterState } from "./ProjectFilters";
import { Section } from "./Section";

export function FeaturedWork({ onOpen, filters, setFilters }: { onOpen: (p: Project) => void; filters: FilterState; setFilters: (f: FilterState) => void }) {
  const list = useMemo(() => {
    const q = filters.query.trim().toLowerCase();
    return PROJECTS.filter((p) => filters.industry === "all" || p.industry === filters.industry)
      .filter((p) => filters.platform === "all" || p.platforms.includes(filters.platform))
      .filter((p) => {
        if (!q) return true;
        const hay = [p.title, p.summary, p.overview, industryName(p.industry), ...p.platforms, ...p.features, ...p.roles.map((r) => r.name)].join(" ").toLowerCase();
        return q.split(/\s+/).every((w) => hay.includes(w));
      });
  }, [filters]);

  return (
    <Section id="work" eyebrow="Featured work" title="Products designed around how work actually gets done" intro="Multi-role products where the hard part is the hand-off: between a manager and a technician, a coordinator and a carer, an agent and a reviewer. Filter by industry or platform, then open a project to see its roles, workflows and screens.">
      <ProjectFilters value={filters} onChange={setFilters} count={list.length} total={PROJECTS.length} />
      {list.length ? (
        <div className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {list.map((p) => <ProjectCard key={p.id} project={p} onOpen={onOpen} />)}
        </div>
      ) : (
        <div className="mt-8 rounded-2xl border border-dashed border-white/10 px-6 py-16 text-center text-slate-500">
          No projects match these filters yet. More are added as they clear licensing review.
        </div>
      )}
    </Section>
  );
}
