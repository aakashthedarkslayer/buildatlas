import type { Db, MatchCandidate, Project, SourceKind, SourceMatch, Term } from "../types";
import { termRegex } from "./match";

/**
 * Words that say nothing about which product a file is about. A project whose
 * name is only made of these ("Medical App", "Application Development") can't be
 * matched by name alone.
 */
const GENERIC = new Set(
  (
    "app apps application applications development develop dev project projects website web site mobile platform portal system systems solution solutions " +
    "phase discovery mvp poc prototype design designs redesign revamp support enhancement enhancements upgrade upgrades ad hoc adhoc maintenance migration " +
    "management manager admin panel dashboard tool tools service services booking android ios native flutter react net the and for of a an to in with " +
    "new v1 v2 v3 version final draft stage part module modules integration integrations based online digital smart pro plus my our your " +
    "proposal proposals case study studies scope estimate estimation quotation sow figma xd ui ux document doc pwa build uat staging live landing page " +
    "on off by is it be as at or from into ad hoc team"
  ).split(" "),
);

const tokens = (s: string) => s.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim().split(/\s+/).filter(Boolean);

/** Letters of the specific (non-generic) part of a name; 0 means "too generic to match on". */
/** Words from the agency's own branding appear in every file: never evidence. Filled per scoring run. */
const AGENCY = new Set<string>();
const isGeneric = (t: string) => GENERIC.has(t) || AGENCY.has(t);

export function specificity(name: string): number {
  return tokens(name)
    .filter((t) => !isGeneric(t) && !/^\d+$/.test(t))
    .join("").length;
}

/** "Website and app for MY LIMO MATE - Phase 2" -> "MY LIMO MATE"; "Baby Latch - Orbital Evolution - App Development" -> "Baby Latch". */
export function shortName(name: string): string {
  const head = name.split(/\s+[-–|:]\s+|\s*\(/)[0];
  const words = head.split(/\s+/).filter((w) => !isGeneric(w.toLowerCase().replace(/[^\p{L}\p{N}]/gu, "")) && !/^\d+$/.test(w));
  return words.join(" ").trim();
}

interface NameKey {
  text: string;
  /** 0-1: how much a hit on this name is worth. */
  weight: number;
}

interface ProjectKeys {
  project: Project;
  names: NameKey[];
  people: string[];
  domains: string[];
}

/** In how many projects' names/descriptions each word appears: common words make weak names. */
function wordFrequency(projects: Project[]): Map<string, number> {
  const df = new Map<string, number>();
  for (const p of projects) for (const t of new Set(tokens(`${p.name} ${p.summary || ""}`))) df.set(t, (df.get(t) || 0) + 1);
  return df;
}

function keysFor(project: Project, terms: Term[], df: Map<string, number>): ProjectKeys {
  const own = terms.filter((t) => t.enabled && t.projectId === project.id);
  const names = new Map<string, number>();
  const add = (text: string, weight: number) => {
    const clean = text.trim();
    const toks = tokens(clean);
    if (clean.length < 2 || !toks.some((t) => !isGeneric(t) && !/^\d+$/.test(t))) return;
    let w = weight * Math.min(1, 0.5 + specificity(clean) / 16);
    // A single everyday word ("Communication", "Investment") is weak evidence.
    const specific = toks.filter((t) => !isGeneric(t));
    if (specific.length === 1 && (df.get(specific[0]) || 0) >= 3) w *= 0.55;
    names.set(clean, Math.max(names.get(clean) || 0, w));
  };
  add(project.name, 1);
  const segments = project.name.split(/\s*[-–|:(]\s*|\s*\)\s*/).map((x) => x.trim()).filter(Boolean);
  segments.forEach((seg, i) => {
    const sn = shortName(seg);
    if (!sn) return;
    if (i === 0) add(sn, specificity(sn) >= 3 ? 1 : 0.6);
    else {
      // Later parts ("Orbital Evolution", "BykUp") only when they are distinctive.
      const toks = tokens(sn).filter((t) => !isGeneric(t));
      const rare = toks.every((t) => (df.get(t) || 0) <= 2);
      if (toks.length && rare && specificity(sn) >= 4) add(sn, 0.85);
    }
  });
  // First word of a longer name when it's distinctive ("Adelante" from "Adelante Training System").
  const first = tokens(shortName(segments[0] || project.name))[0];
  if (first && first.length >= 5 && !isGeneric(first) && (df.get(first) || 0) <= 2) add(first, 0.7);
  for (const t of own.filter((t) => t.type === "product" || t.type === "client")) add(t.text, 0.9);
  return {
    project,
    names: [...names].map(([text, weight]) => ({ text, weight })),
    people: own.filter((t) => t.type === "person" && specificity(t.text) >= 5).map((t) => t.text),
    // Real domains only (the catalog's link column also holds words like "android").
    domains: own.filter((t) => t.type === "url" && /^[a-z0-9-]{3,}(\.[a-z0-9-]+)+$/i.test(t.text)).map((t) => t.text),
  };
}

const compact = (x: string) =>
  x.toLowerCase().replace(/\+/g, "plus").replace(/&/g, "and").replace(/[^\p{L}\p{N}]+/gu, "");
const stem = (t: string) => t.replace(/(ings?|ions?|ers?|ed|es|s)$/, "").slice(0, 7);

/**
 * The title a document declares about itself. Agency templates put it between a
 * heading and the version line: "Case Study U-Chefs App Version 1.0",
 * "Project Information Benchtop Designer Version 1.0", "Proposal for Acme CRM".
 */
export function declaredTitle(head: string): string | undefined {
  const flat = head.replace(/\s+/g, " ");
  const m = flat.match(
    /(?:case study|project information|project proposal|technical proposal|commercial proposal|proposal for|proposal|scope of work for|scope of work|statement of work|requirements? document for)\s*[:\-–]?\s*(.{2,90}?)\s+(?:version\b|v\s?\d|prepared\b|this document\b|date\b|confidential\b|submitted\b|disclaimer\b|(?:\d{1,2}(?:st|nd|rd|th)?\s+)?(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\b)/i,
  );
  const t = m?.[1]?.replace(/^(for|of|the)\s+/i, "").trim();
  return t && specificity(t) >= 2 ? t : undefined;
}

/** 0-1 similarity between a declared title and a project name, ignoring generic words and spelling noise. */
function titleSimilarity(title: string, name: string): number {
  // Digits stay: "GET 2 COP" must equal "Get2cop", "Take 5" isn't "Take".
  const core = (x: string) => tokens(x).filter((t) => !isGeneric(t));
  const tt = core(title);
  const variants = [name, ...name.split(/\s*[-–|:(]\s*|\s*\)\s*/)].map(core).filter((v) => v.length);
  let best = 0;
  for (const pt of variants) {
    const a = compact(tt.join(""));
    const b = compact(pt.join(""));
    if (!a || !b) continue;
    if (a === b) best = Math.max(best, 1);
    else if ((a.length >= 4 && b.includes(a)) || (b.length >= 4 && a.includes(b))) best = Math.max(best, 0.85);
    else {
      const ps = new Set(pt.map(stem));
      const shared = tt.filter((t) => ps.has(stem(t))).length;
      if (shared) best = Math.max(best, (shared / Math.max(tt.length, pt.length)) * 0.8);
    }
  }
  return best;
}

export interface MatchInput {
  /** Full extracted text. */
  text: string;
  /** Title page / first part of the document, where the product name usually sits. */
  head: string;
  /** File name, or the Figma file name / URL slug. */
  label: string;
  /** Figma file keys this source is (figma) or mentions (documents). */
  figmaKeys: string[];
}

const esc = (x: string) => x.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const nameCache = new Map<string, RegExp>();
/** "IOT-Dash" matches "IoT Dash", "IOTDash", "iot_dash"; "Baby Latch" matches "BabyLatch". */
function nameRegex(name: string): RegExp {
  let re = nameCache.get(name);
  if (!re) {
    const parts = name.split(/[^\p{L}\p{N}]+/u).filter(Boolean).map(esc);
    re = new RegExp(`(?<![\\p{L}\\p{N}])${parts.join("[\\s\\-_.&+]*")}(?![\\p{L}\\p{N}])`, "giu");
    nameCache.set(name, re);
  }
  re.lastIndex = 0;
  return re;
}
let lastText = "";
let lastCompact = "";
/** Letters and digits only: "Wash’em All" -> "washemall". Memoised per text (scoring reuses the same texts). */
function compactOf(text: string): string {
  if (text !== lastText) {
    lastText = text;
    lastCompact = text.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, "");
  }
  return lastCompact;
}
/** Matches of a name in a text; long names also match with spacing/punctuation removed ("Washemall" = "Wash’em All"). */
const count = (text: string, term: string) => {
  if (!text) return 0;
  const n = (text.match(nameRegex(term)) || []).length;
  if (n) return n;
  const key = term.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, "");
  return key.length >= 7 && compactOf(text).includes(key) ? 1 : 0;
};
void termRegex;

export function scoreProjects(db: Db, input: MatchInput): MatchCandidate[] {
  const out: MatchCandidate[] = [];
  const df = wordFrequency(db.projects);
  const title = declaredTitle(input.head);
  const titleCore = title ? tokens(title).filter((t) => !GENERIC.has(t)) : [];
  // A one-word title made of an everyday word ("Medical") is weak evidence.
  const titleWeight = titleCore.length === 1 && (df.get(titleCore[0]) || 0) >= 3 ? 0.5 : 1;
  // How many projects share each name key: a shared name ("Adelante", "Translite") never links automatically.
  const owners = new Map<string, number>();
  AGENCY.clear();
  for (const t of db.terms) if (t.scope === "global" && t.enabled && (t.type === "agency" || t.type === "url")) for (const w of tokens(t.text.split(".")[0])) AGENCY.add(w);
  const allKeys = db.projects.map((project) => keysFor(project, db.terms, df));
  for (const k of allKeys) for (const n of new Set(k.names.map((x) => compact(x.text)))) owners.set(n, (owners.get(n) || 0) + 1);
  const titleSims = new Map(title ? db.projects.map((p) => [p.id, titleSimilarity(title, p.name)] as const) : []);
  // Several projects answering to the same title ("Adelante") means the title alone can't decide.
  const titleOwners = [...titleSims.values()].filter((v) => v >= 0.85).length;
  for (const k of allKeys) {
    const project = k.project;
    const evidence: string[] = [];
    let score = 0;

    // Name: best single name hit (title page and file name weigh most).
    let nameScore = 0;
    let nameEvidence = "";
    for (const { text: n, weight } of k.names) {
      const inHead = count(input.head, n) > 0;
      const inLabel = count(input.label, n) > 0;
      const inBody = count(input.text, n);
      if (!inHead && !inLabel && !inBody) continue;
      const s = ((inHead ? 45 : 0) + (inLabel ? 40 : 0) + (inBody ? 10 + Math.min(15, inBody * 3) : 0)) * weight;
      if (s > nameScore) {
        nameScore = s;
        nameEvidence = `“${n}” ${[inHead && "on the title page", inLabel && "in the file name", inBody && `${inBody}× in the text`].filter(Boolean).join(", ")}`;
      }
    }
    if (nameScore) {
      score += Math.min(75, nameScore);
      evidence.push(nameEvidence);
    }

    if (title) {
      const sim = titleSims.get(project.id) || 0;
      if (sim >= 0.5) {
        score += 55 * sim * titleWeight;
        evidence.unshift(`Document title “${title}”${sim >= 1 ? "" : " (close match)"}`);
      }
    }

    // Names that several projects share can't settle it on their own.
    const shared = Math.max(0, ...k.names.filter((x) => count(input.head, x.text) || count(input.text, x.text)).map((x) => owners.get(compact(x.text)) || 0));
    const exactTitle = (titleSims.get(project.id) || 0) >= 1 && titleOwners <= 1;
    if ((shared >= 2 && !exactTitle) || ((titleSims.get(project.id) || 0) >= 0.85 && titleOwners >= 2)) {
      score = Math.min(score, 58);
      evidence.push(`Name shared by ${Math.max(shared, titleOwners)} projects`);
    }

    let peopleScore = 0;
    for (const p of k.people) {
      const c = count(input.text, p);
      if (c) {
        peopleScore += 15;
        evidence.push(`Client contact “${p}” mentioned`);
      }
    }
    score += Math.min(30, peopleScore);

    for (const d of k.domains) {
      const base = d.split(".")[0];
      if (count(input.text, d) || (base.length >= 5 && count(input.label, base))) {
        score += 25;
        evidence.push(`Client domain ${d}`);
        break;
      }
    }

    const keyHit = (project.figmaKeys || []).find((key) => input.figmaKeys.includes(key));
    if (keyHit) {
      score += 100;
      evidence.unshift("Same Figma file as listed in the catalog");
    }

    if (score > 0) out.push({ projectId: project.id, score: Math.min(100, Math.round(score)), evidence });
  }
  return out.sort((a, b) => b.score - a.score).slice(0, 8);
}

export function decide(candidates: MatchCandidate[]): Pick<SourceMatch, "status" | "confidence"> {
  const [top, second] = candidates;
  if (!top) return { status: "none", confidence: 0 };
  const margin = top.score - (second?.score ?? 0);
  if (top.score >= 60 && margin >= 15) return { status: "auto", confidence: top.score };
  if (top.score >= 25) return { status: "suggested", confidence: Math.round(top.score * Math.min(1, 0.5 + margin / 40)) };
  return { status: "none", confidence: top.score };
}

/** A readable product name from a file name: "BabyLatch_Proposal_v2 final.pdf" -> "BabyLatch". */
export function nameFromLabel(label: string): string {
  const stem = label
    .replace(/\.(pdf|docx?)$/i, "")
    .replace(/https?:\/\/\S+?\/(design|file|proto)\/[A-Za-z0-9]+\/?/i, "")
    .replace(/\?.*$/, "")
    .replace(/[_\-.+]+/g, " ")
    .replace(/\b(19|20)\d{2}\b|\b\d{1,2}\s?(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\w*\b/gi, " ");
  const words = stem.split(/\s+/).filter((w) => w && !GENERIC.has(w.toLowerCase()) && !/^v?\d+(\.\d+)*$/i.test(w));
  return words.slice(0, 5).join(" ").trim();
}

const KIND_SIGNALS: Array<[SourceKind, RegExp, RegExp]> = [
  ["case_study", /case[\s_-]?stud|casestudy|project[\s_-]information|success[\s_-]story/i, /\bcase stud(y|ies)\b|\bchallenges identified\b|\bresults?\b.*\b(achieved|delivered)\b|\boutcomes?\b|\btestimonial|\bproject information\b/gi],
  ["proposal", /proposal|scope|sow|estimat|quot|rfp|requirement|brd|frd|srs/i, /\bproposal\b|\bscope of work\b|\bestimat(e|ion)\b|\bquotation\b|\bmilestones?\b|\bpayment (terms|schedule)\b|\bdeliverables\b|\bassumptions\b|\bout of scope\b|\btimeline\b/gi],
];

/** Guess whether a document is a proposal or a case study from its name and wording. */
export function detectKind(fileName: string, text: string): SourceKind {
  for (const [kind, nameRe] of KIND_SIGNALS) if (nameRe.test(fileName)) return kind;
  const sample = text.slice(0, 40_000);
  const scores = KIND_SIGNALS.map(([kind, , textRe]) => [kind, (sample.match(textRe) || []).length] as const).sort((a, b) => b[1] - a[1]);
  return scores[0][1] >= 3 && scores[0][1] > scores[1][1] ? scores[0][0] : "other";
}

export function figmaKeysIn(text: string): string[] {
  return [...new Set([...text.matchAll(/figma\.com\/(?:file|design|proto|board)\/([A-Za-z0-9]{10,})/g)].map((m) => m[1]))];
}

/**
 * Distinctive names of every project ("OAPG", "Washemall", "Baby Latch"): used to catch another
 * client's name left behind in a document copied from an earlier template. Everyday words are skipped.
 */
export function distinctiveProjectNames(db: Db): Array<{ projectId: string; name: string }> {
  const df = wordFrequency(db.projects);
  AGENCY.clear();
  for (const t of db.terms) if (t.scope === "global" && t.enabled && (t.type === "agency" || t.type === "url")) for (const w of tokens(t.text.split(".")[0])) AGENCY.add(w);
  const out: Array<{ projectId: string; name: string }> = [];
  for (const p of db.projects) {
    if (p.source === "lead") continue; // lead folder names are descriptions, not brand names
    for (const k of keysFor(p, db.terms, df).names) {
      const specific = tokens(k.text).filter((t) => !isGeneric(t));
      if (k.weight < 0.6 || !specific.length) continue;
      if (specific.length === 1) {
        // One word: only brand-shaped ones (OAPG, StreetPin, BabyLatch, Get2cop), never everyday words like "Waste".
        const word = k.text.split(/[^\p{L}\p{N}]+/u).find((w) => w.toLowerCase() === specific[0]) || "";
        const brandShaped = (word.match(/\p{Lu}/gu) || []).length >= 2 || /\d/.test(word);
        if (!brandShaped || word.length < 4 || (df.get(specific[0]) || 0) >= 3) continue;
      } else if (specificity(k.text) < 8) continue;
      out.push({ projectId: p.id, name: k.text });
    }
  }
  return out;
}
