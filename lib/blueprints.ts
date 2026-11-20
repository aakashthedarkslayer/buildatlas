import "server-only";
import { detectPatterns, matchersFromFindings, replaceAll, residualCheck } from "./clean/match";
import { newId, now, termsFor } from "./store";
import type { Blueprint, Db, Finding, Project, Source } from "./types";
import { DEFAULT_REPLACEMENT } from "./types";

/** Starting prices by how complete the bundle is (you can change any listing). */
export const PRICE_BY_ASSETS: Record<number, number> = { 0: 49, 1: 49, 2: 149, 3: 299 };

const FEATURE_LABEL: Record<string, string> = {
  booking: "Booking & scheduling",
  payments: "Payments & subscriptions",
  "chat/messaging": "In-app chat & messaging",
  "video calls": "Video calls / consultations",
  "maps/GPS": "Maps, GPS & location tracking",
  marketplace: "Multi-sided marketplace",
  "multi-role admin": "Role-based admin panel",
  "reports/analytics": "Reports & analytics dashboard",
  notifications: "Push / email notifications",
  AI: "AI features",
  "e-commerce": "Catalogue, cart & orders",
  "social feed": "Social feed & community",
  "LMS/courses": "Courses & learning content",
  inventory: "Inventory management",
  "invoicing/quotes": "Quotes & invoicing",
  "job management": "Job / task management",
  "compliance/forms": "Forms, checklists & compliance",
  "reviews/ratings": "Reviews & ratings",
  "IoT/sensors": "IoT devices & sensors",
  subscriptions: "Memberships & plans",
};

/**
 * Everything that identifies this project's client: its dictionary terms,
 * global agency terms, the project name and the findings of its cleaned files.
 */
export function identifyingFindings(db: Db, project: Project): Finding[] {
  const out: Finding[] = [];
  const add = (text: string, type: Finding["type"], replacement: string) => {
    if (text.trim().length < 2 || out.some((f) => f.text.toLowerCase() === text.toLowerCase())) return;
    out.push({ id: newId(), text, variants: [text], type, replacement, origin: "project", count: 1, enabled: true });
  };
  add(project.name, "product", "the platform");
  for (const part of project.name.split(/\s+[-–|:]\s+/)) if (part !== project.name) add(part, "product", "the platform");
  for (const t of termsFor(db, project.id)) add(t.text, t.type, t.replacement || DEFAULT_REPLACEMENT[t.type]);
  for (const s of db.sources.filter((x) => x.projectId === project.id)) for (const f of s.findings) if (f.enabled) add(f.text, f.type, f.replacement);
  return out;
}

export function cleanText(text: string, findings: Finding[]): string {
  const out = replaceAll(text, matchersFromFindings(findings)).text;
  // Contact details that slipped into catalog prose.
  let t = out;
  for (const p of detectPatterns(out)) if (p.type !== "person") t = t.split(p.text).join(p.replacement);
  return t.replace(/\b(the platform)(\s+the platform)+/gi, "$1").replace(/\s{2,}/g, " ").trim();
}

/** Leftovers in a listing: anything identifying that is still in its public text. */
export function leakCheck(db: Db, bp: Blueprint) {
  const project = db.projects.find((p) => p.id === bp.projectId);
  if (!project) return [];
  const text = [bp.title, bp.tagline, bp.summary, ...bp.features, ...bp.challenges].join("\n");
  const hits = residualCheck(text, identifyingFindings(db, project));
  // Proper names the dictionary doesn't know ("Australian Menopause Centre", "Shepherd Neame").
  for (const m of text.matchAll(/(?<![.!?]\s|^)\b([A-Z][a-z]+(?:[ -](?:&|of|and|[A-Z][a-z]+)){1,4})\b/gm)) {
    const name = m[1];
    if (COMMON_PHRASES.test(name) || hits.some((h) => h.text === name)) continue;
    hits.push({ text: name, count: 1, context: "Looks like a proper name: check it isn't a client, person or brand" });
  }
  return hits;
}

const COMMON_PHRASES = /^(?:Apple|Google|App Store|Google Play|Play Store|Stripe|Xero|PayPal|Firebase|Amazon|Microsoft|React Native|Node|Admin Panel|Web App|Mobile App|United Kingdom|United States|New Zealand|Australia|Artificial Intelligence|Machine Learning|Super Admin|Customer Support|National Disability Insurance Scheme|Real Estate|Health and Fitness|Software|Push Notifications?)\b/;

/** A readable product title from a summary: "A food ordering and delivery app for ..." -> "Food ordering and delivery app". */
function titleFrom(summary: string, fallback: string): string {
  const m = summary.match(/^(?:an?|the)\s+(.{6,70}?)\s+(?:for|that|which|designed|built|connecting|enabling|to|where|allowing|used|helping|with)\b/i);
  const t = (m?.[1] || "").replace(/[,.;:]+$/, "").trim();
  if (t && !/the client|the platform/i.test(t)) return t[0].toUpperCase() + t.slice(1);
  return fallback;
}

const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);

export function assetsFor(db: Db, projectId: string) {
  const approved = db.sources.filter((s) => s.projectId === projectId && s.status === "approved");
  const pick = (k: Source["kind"]) => approved.filter((s) => s.kind === k);
  return { approved, proposal: pick("proposal"), case_study: pick("case_study"), figma: pick("figma") };
}

/** Draft (or refresh) a listing for a project. Never published automatically. */
export function draftBlueprint(db: Db, project: Project): Blueprint {
  const findings = identifyingFindings(db, project);
  const d = project.details || {};
  const raw = project.summary || d.overview || "";
  const summary = cleanText(d.overview || raw, findings);
  const tagline = cleanText(raw, findings).split(/(?<=\.)\s/)[0].slice(0, 180);
  const industry = project.industry || "Software";
  const title = titleFrom(cleanText(raw, findings), `${industry} platform`);
  const challenges = (d.challenges || "")
    .split(/[;\n]|(?<=\.)\s+/)
    .map((x) => cleanText(x, findings).replace(/^[•\-\s]+/, ""))
    .filter((x) => x.length > 12)
    .slice(0, 6);
  const assets = assetsFor(db, project.id);
  const kinds = [assets.proposal.length, assets.case_study.length, assets.figma.length].filter(Boolean).length;
  const existing = (db.blueprints || []).find((b) => b.projectId === project.id);
  const t = now();
  const bp: Blueprint = {
    id: existing?.id || newId(),
    projectId: project.id,
    slug: existing?.slug || `${slugify(title)}-${newId().slice(0, 4)}`,
    title,
    tagline,
    summary,
    industry,
    platforms: d.platforms || [],
    tech: d.tech || [],
    features: (d.features || []).map((f) => FEATURE_LABEL[f] || f),
    challenges,
    durationMonths: d.durationMonths,
    teamSize: d.teamSize,
    price: existing?.price ?? PRICE_BY_ASSETS[kinds],
    published: existing?.published ?? false,
    sourceIds: assets.approved.map((s) => s.id),
    createdAt: existing?.createdAt || t,
    updatedAt: t,
  };
  return bp;
}

/** Included asset kinds for display: only approved files count. */
export function includedKinds(db: Db, bp: Blueprint) {
  const srcs = db.sources.filter((s) => bp.sourceIds.includes(s.id) && s.status === "approved");
  return {
    proposal: srcs.filter((s) => s.kind === "proposal"),
    case_study: srcs.filter((s) => s.kind === "case_study"),
    figma: srcs.filter((s) => s.kind === "figma"),
  };
}
