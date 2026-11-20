import "server-only";
import { promises as fs } from "fs";
import path from "path";
import { applyCatalog } from "./catalog";
import { figmaFileKey } from "./clean/figma";
import { newId, now } from "./store";
import type { Db, MapFile, MapQuestion, Source } from "./types";

/** The master map that ships with the repository (seed/master-map.json). */
export const MASTER_MAP_FILE = path.join(process.cwd(), "seed", "master-map.json");

interface SeedProject {
  key: string;
  name: string;
  source: "catalog" | "lead" | "new";
  catalogId?: string;
  month?: string;
  leadFolder?: string;
  notes?: string;
}
interface SeedFile extends Omit<MapFile, "projectId"> {
  projectKey: string | null;
}
interface SeedFigma {
  name: string;
  url: string;
  projectKey: string | null;
  confidence: string;
  how: string;
}
interface Seed {
  version: number;
  generatedAt: string;
  catalog: Array<Record<string, unknown>>;
  projects: SeedProject[];
  files: SeedFile[];
  figma: SeedFigma[];
  questions: Array<Omit<MapQuestion, "answer">>;
}

export async function masterMapAvailable(): Promise<{ generatedAt: string } | null> {
  try {
    const seed = JSON.parse(await fs.readFile(/*turbopackIgnore: true*/ MASTER_MAP_FILE, "utf8")) as Seed;
    return { generatedAt: seed.generatedAt };
  } catch {
    return null;
  }
}

/** Normalised file name used to recognise uploads: case, spacing and the chat-upload id prefix don't matter. */
export const fileKey = (name: string) =>
  name
    .split(/[\\/]/)
    .pop()!
    .replace(/^[0-9a-f]{8}-/i, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();

/**
 * Load the master map into the database. Safe to run again: projects are
 * matched by key/catalog ID, Figma files by file key, answers are kept.
 * Returns the ids of new Figma sources (to scan when a token is set).
 */
export async function applyMasterMap(db: Db): Promise<{ projects: number; figma: string[]; files: number; questions: number }> {
  const seed = JSON.parse(await fs.readFile(/*turbopackIgnore: true*/ MASTER_MAP_FILE, "utf8")) as Seed;
  applyCatalog(db, seed.catalog);

  const t = now();
  const idFor = new Map<string, string>();
  let created = 0;
  for (const sp of seed.projects) {
    let p = db.projects.find((x) => x.mapKey === sp.key || (sp.catalogId && x.catalogId === sp.catalogId));
    if (!p && sp.source !== "catalog") p = db.projects.find((x) => x.name.toLowerCase() === sp.name.toLowerCase() && x.source !== "catalog");
    if (!p) {
      p = { id: newId(), name: sp.name, createdAt: t };
      db.projects.push(p);
      created++;
    }
    Object.assign(p, { mapKey: sp.key, source: sp.source, month: sp.month ?? p.month, leadFolder: sp.leadFolder ?? p.leadFolder, notes: sp.notes ?? p.notes });
    idFor.set(sp.key, p.id);
  }
  // Catalog projects referenced by key "cat:<ID>" that weren't listed explicitly.
  for (const p of db.projects) if (p.catalogId) {
    idFor.set(`cat:${p.catalogId}`, idFor.get(`cat:${p.catalogId}`) || p.id);
    p.source ||= "catalog";
  }

  db.mapFiles = seed.files.map((f) => ({ kind: f.kind, fileName: f.fileName, location: f.location, url: f.url, confidence: f.confidence, note: f.note, projectId: f.projectKey ? idFor.get(f.projectKey) : undefined }));

  // Figma: one source per Figma file, linked to its project; existing ones are kept.
  const have = new Map(db.sources.filter((s) => s.figmaUrl).map((s) => [figmaFileKey(s.figmaUrl!), s]));
  const newFigma: string[] = [];
  for (const g of seed.figma) {
    const key = figmaFileKey(g.url);
    if (!key) continue;
    const projectId = g.projectKey ? idFor.get(g.projectKey) : undefined;
    const existing = have.get(key);
    if (existing) {
      if (!existing.projectId && projectId) existing.projectId = projectId;
      existing.title ||= g.name;
      continue;
    }
    const s: Source = {
      id: newId(),
      kind: "figma",
      title: g.name,
      format: "figma",
      figmaUrl: g.url,
      projectId,
      status: "processing",
      findings: [],
      images: [],
      residual: [],
      aiUsed: false,
      history: [{ at: t, action: "uploaded", note: "Added from the master map" }],
      createdAt: t,
      updatedAt: t,
      match: { status: projectId ? "confirmed" : "none", confidence: projectId ? 100 : 0, candidates: projectId ? [{ projectId, score: 100, evidence: [`Master map: ${g.how}`] }] : [], guessedName: g.name, matchedAt: t },
    };
    db.sources.unshift(s);
    have.set(key, s);
    newFigma.push(s.id);
  }

  const answers = new Map((db.questions || []).map((q) => [q.id, q.answer]));
  db.questions = seed.questions.map((q) => ({ ...q, suggest: (q.suggest || []).map((k) => idFor.get(k) || k).filter((id) => db.projects.some((p) => p.id === id)), answer: answers.get(q.id) }));
  db.mapImportedAt = t;
  return { projects: created, figma: newFigma, files: db.mapFiles.length, questions: db.questions.length };
}

/** The master map's entry for an uploaded file, if it knows the file. */
export function mapHintFor(db: Db, fileName: string): MapFile | undefined {
  const k = fileKey(fileName);
  return (db.mapFiles || []).find((f) => fileKey(f.fileName) === k);
}
