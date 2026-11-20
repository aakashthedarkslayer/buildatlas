import { figmaFileKey } from "./clean/figma";
import { newId, now } from "./store";
import type { Db, TermType } from "./types";
import { DEFAULT_REPLACEMENT } from "./types";

const hostOf = (u: string) => {
  try {
    if (!/[a-z0-9-]+\.[a-z]{2,}/i.test(u)) return null; // free text such as "Android application"
    const h = new URL(/^https?:\/\//.test(u) ? u : `https://${u}`).hostname.replace(/^www\./, "");
    return /(apple\.com|google\.com|play\.google|herokuapp\.com|24livehost\.com|projectstatus\.in|figma\.com|sharepoint\.com|amazonaws\.com|web\.app)$/.test(h)
      ? null
      : h;
  } catch {
    return null;
  }
};

/**
 * Merge portfolio catalog rows (portfolio_master.json) into the database: one
 * project per row, plus dictionary terms and matching data. Safe to re-run.
 */
export function applyCatalog(db: Db, rows: Array<Record<string, unknown>>): { created: number; terms: number } {
  let created = 0;
  let terms = 0;
  for (const r of rows) {
    const name = String(r["Project Name"] || r.name || "").trim();
    if (!name) continue;
    const catalogId = String(r.ID || r.id || "");
    let p = db.projects.find((x) => (catalogId && x.catalogId === catalogId) || x.name.toLowerCase() === name.toLowerCase());
    if (!p) {
      p = {
        id: newId(),
        name,
        catalogId: catalogId || undefined,
        industry: String(r["Industry (normalised)"] || "") || undefined,
        country: String(r.Country || "") || undefined,
        createdAt: now(),
      };
      db.projects.push(p);
      created++;
    }
    // Matching data: a short description and the Figma files listed for the project.
    const summary = String(r.Summary || r.Overview || "")
      .replace(/\s+/g, " ")
      .trim();
    if (summary) p.summary = summary.slice(0, 300);
    const links = String(r["Design Link(s)"] || "")
      .split(/\s*\|\s*|\s+/)
      .filter((u) => /figma\.com\//.test(u));
    if (links.length) {
      p.figmaLinks = [...new Set([...(p.figmaLinks || []), ...links])];
      p.figmaKeys = [...new Set(p.figmaLinks.map((u) => figmaFileKey(u)).filter((k): k is string => Boolean(k)))];
    }
    const add = (text: string, type: TermType) => {
      text = text.trim();
      if (text.length < 3 || db.terms.some((t) => t.projectId === p!.id && t.text.toLowerCase() === text.toLowerCase())) return;
      db.terms.push({ id: newId(), text, type, replacement: DEFAULT_REPLACEMENT[type], scope: "project", projectId: p!.id, enabled: true, createdAt: now() });
      terms++;
    };
    const contact = String(r["Client Contact"] || "");
    if (contact && !/^(na|n\/a|-)$/i.test(contact)) add(contact, "person");
    for (const u of String(r["Live Link"] || "").split(/\s*\|\s*|\s+/)) {
      const h = hostOf(u);
      if (h) add(h, "url");
    }
    // Short brand form of the project name, e.g. "LimoMate" from "Website and app for MY LIMO MATE".
    const short = name
      .replace(/\s*[-–|:(].*$/, "")
      .replace(/\b(app|application|development|project|website|web|mobile|platform|phase\s*\d+)\b/gi, "")
      .replace(/\s+/g, " ")
      .trim();
    if (short && short.toLowerCase() !== name.toLowerCase()) add(short, "product");
  }
  return { created, terms };
}
