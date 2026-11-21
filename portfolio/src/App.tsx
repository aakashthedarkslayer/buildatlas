import { useCallback, useState } from "react";
import { About } from "./components/About";
import { Contact } from "./components/Contact";
import { FeaturedWork } from "./components/FeaturedWork";
import { Footer } from "./components/Footer";
import { Hero } from "./components/Hero";
import { Industries } from "./components/Industries";
import { InsideProject } from "./components/InsideProject";
import { Nav } from "./components/Nav";
import { ProjectModal } from "./components/ProjectModal";
import type { FilterState } from "./components/ProjectFilters";
import type { Project } from "./data/projects";

export default function App() {
  const [open, setOpen] = useState<Project | null>(null);
  const [filters, setFilters] = useState<FilterState>({ query: "", industry: "all", platform: "all" });
  const close = useCallback(() => setOpen(null), []);
  return (
    <>
      <a href="#work" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-white focus:px-3 focus:py-2 focus:text-ink-900">Skip to projects</a>
      <Nav />
      <main>
        <Hero />
        <FeaturedWork onOpen={setOpen} filters={filters} setFilters={setFilters} />
        <Industries
          onPick={(industry) => {
            setFilters({ query: "", platform: "all", industry });
            document.getElementById("work")?.scrollIntoView({ behavior: "smooth" });
          }}
        />
        <InsideProject />
        <About />
        <Contact />
      </main>
      <Footer />
      <ProjectModal project={open} onClose={close} />
    </>
  );
}
