"use server";

import { promises as fs } from "fs";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { after } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { applyClean, enqueueScan, rematchSource, verifyFigma } from "@/lib/clean/pipeline";
import { figmaFileKey } from "@/lib/clean/figma";
import { applyCatalog } from "@/lib/catalog";
import { fileKey } from "@/lib/masterMap";
import { occurrences } from "@/lib/clean/match";
import { createSessionValue, SESSION_COOKIE, SESSION_MAX_AGE } from "@/lib/session";
import { mutate, newId, now, readDb, sourceDir, updateSource } from "@/lib/store";
import type { Finding, ImageItem, SourceKind, Term, TermType } from "@/lib/types";
import { DEFAULT_REPLACEMENT } from "@/lib/types";
import path from "path";

// ---------------------------------------------------------------- auth

export async function login(_prev: string | null, form: FormData): Promise<string | null> {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return "ADMIN_PASSWORD is not set on the server.";
  if (String(form.get("password") || "") !== expected) return "Wrong password.";
  const jar = await cookies();
  jar.set(SESSION_COOKIE, await createSessionValue(), { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", maxAge: SESSION_MAX_AGE, path: "/" });
  const next = String(form.get("next") || "/");
  redirect(next.startsWith("/") && !next.startsWith("//") ? next : "/");
}

export async function logout() {
  (await cookies()).delete(SESSION_COOKIE);
  redirect("/login");
}

// ---------------------------------------------------------------- review

export interface FindingEdit {
  id: string;
  enabled: boolean;
  replacement: string;
  type: TermType;
  /** Also save this finding to the dictionary so future uploads catch it. */
  remember?: "project" | "global";
}

/** Save the reviewer's decisions and regenerate the cleaned output. */
export async function saveReview(sourceId: string, edits: FindingEdit[], imageRedactions: Record<string, boolean>, newAreas: ImageItem[], removedAreaIds: string[]) {
  await requireAdmin();
  const remember: Term[] = [];
  const source = await updateSource(sourceId, (s) => {
    for (const e of edits) {
      const f = s.findings.find((x) => x.id === e.id);
      if (!f) continue;
      f.enabled = e.enabled;
      f.replacement = e.replacement.trim() || DEFAULT_REPLACEMENT[e.type];
      f.type = e.type;
      if (e.remember) remember.push({ id: newId(), text: f.text, type: f.type, replacement: f.replacement, scope: e.remember, projectId: e.remember === "project" ? s.projectId : undefined, enabled: true, createdAt: now() });
    }
    for (const im of s.images) if (im.id in imageRedactions) im.redact = imageRedactions[im.id];
    s.images = s.images.filter((im) => !removedAreaIds.includes(im.id));
    for (const a of newAreas) s.images.push({ ...a, id: "area-" + newId(), kind: "area", redact: true, suggested: false });
  });
  if (remember.length) {
    await mutate((db) => {
      for (const t of remember) {
        if (t.scope === "project" && !t.projectId) t.scope = "global";
        const dup = db.terms.find((x) => x.text.toLowerCase() === t.text.toLowerCase() && x.scope === t.scope && x.projectId === t.projectId);
        if (dup) Object.assign(dup, { replacement: t.replacement, type: t.type, enabled: true });
        else db.terms.push(t);
      }
    });
  }
  await applyClean(source.id);
  revalidatePath(`/sources/${sourceId}`);
}

/** Add a term the scan missed (e.g. a person's name) straight from the review screen. */
export async function addManualFinding(sourceId: string, form: FormData) {
  await requireAdmin();
  const text = String(form.get("text") || "").trim();
  if (text.length < 2) return;
  const type = (String(form.get("type") || "other") as TermType) || "other";
  const replacement = String(form.get("replacement") || "").trim() || DEFAULT_REPLACEMENT[type];
  const scope = String(form.get("remember") || "");
  const original = await fs.readFile(path.join(sourceDir(sourceId), "original.txt"), "utf8").catch(() => "");
  const occ = occurrences(original, text);
  const s = await updateSource(sourceId, (s) => {
    const existing = s.findings.find((f) => f.text.toLowerCase() === text.toLowerCase());
    if (existing) Object.assign(existing, { enabled: true, replacement, type });
    else s.findings.unshift({ id: newId(), text, variants: occ.variants.length ? occ.variants : [text], type, replacement, origin: "manual", count: occ.count, enabled: true, reason: "Added by reviewer" } satisfies Finding);
  });
  if (scope === "project" || scope === "global") {
    await mutate((db) => {
      db.terms.push({ id: newId(), text, type, replacement, scope: scope === "project" && s.projectId ? "project" : "global", projectId: scope === "project" ? s.projectId : undefined, enabled: true, createdAt: now() });
    });
  }
  await applyClean(sourceId);
  revalidatePath(`/sources/${sourceId}`);
}

export async function rescan(sourceId: string) {
  await requireAdmin();
  await updateSource(sourceId, (s) => {
    s.status = "processing";
  });
  after(() => enqueueScan(sourceId));
  revalidatePath(`/sources/${sourceId}`);
}

export async function setDecision(sourceId: string, form: FormData) {
  await requireAdmin();
  const decision = String(form.get("decision"));
  const note = String(form.get("note") || "").trim() || undefined;
  await updateSource(sourceId, (s) => {
    if (decision === "approve") {
      // Nothing can be approved until a cleaned copy exists (Figma: the cleaned duplicate has been verified).
      if (s.status === "processing" || s.status === "error" || s.status === "needs_access") throw new Error("This file hasn't been cleaned yet.");
      if (s.format === "figma" && !s.residualCheckedAt) throw new Error("Verify the cleaned Figma duplicate before approving.");
      if (s.residual.length && form.get("override") !== "on") throw new Error("This copy still has possible leftovers. Tick the override box if they are fine.");
      s.status = "approved";
      s.history.push({ at: now(), action: "approved", note });
    } else if (decision === "changes") {
      s.status = "changes_requested";
      s.history.push({ at: now(), action: "changes_requested", note });
    } else if (decision === "reopen") {
      s.status = "needs_review";
      s.history.push({ at: now(), action: "reopened", note });
    } else if (decision === "note" && note) {
      s.history.push({ at: now(), action: "note", note });
    }
  });
  revalidatePath(`/sources/${sourceId}`);
  revalidatePath("/sources");
  revalidatePath("/");
}

export async function updateSourceMeta(sourceId: string, form: FormData) {
  await requireAdmin();
  const projectId = String(form.get("projectId") || "") || undefined;
  const kind = String(form.get("kind") || "") as SourceKind;
  const title = String(form.get("title") || "").trim();
  let projectChanged = false;
  await updateSource(sourceId, (s) => {
    projectChanged = s.projectId !== projectId;
    s.projectId = projectId;
    if (kind) s.kind = kind;
    if (title) s.title = title;
  });
  // A different project brings different dictionary terms: scan again.
  if (projectChanged) after(() => enqueueScan(sourceId));
  revalidatePath(`/sources/${sourceId}`);
}

export async function verifyFigmaAction(sourceId: string, form: FormData) {
  await requireAdmin();
  const url = String(form.get("cleanedUrl") || "").trim();
  if (!url) return;
  await verifyFigma(sourceId, url);
  revalidatePath(`/sources/${sourceId}`);
}

export async function deleteSource(sourceId: string) {
  await requireAdmin();
  await mutate((db) => {
    db.sources = db.sources.filter((s) => s.id !== sourceId);
  });
  await fs.rm(sourceDir(sourceId), { recursive: true, force: true });
  revalidatePath("/sources");
  redirect("/sources");
}

// ---------------------------------------------------------------- dictionary

export async function saveTerm(form: FormData) {
  await requireAdmin();
  const id = String(form.get("id") || "");
  const text = String(form.get("text") || "").trim();
  const type = String(form.get("type") || "client") as TermType;
  const replacement = String(form.get("replacement") || "").trim() || DEFAULT_REPLACEMENT[type];
  const projectId = String(form.get("projectId") || "") || undefined;
  const enabled = form.get("enabled") !== "off";
  if (text.length < 2) return;
  await mutate((db) => {
    const existing = id ? db.terms.find((t) => t.id === id) : undefined;
    if (existing) Object.assign(existing, { text, type, replacement, projectId, scope: projectId ? "project" : "global", enabled });
    else db.terms.push({ id: newId(), text, type, replacement, scope: projectId ? "project" : "global", projectId, enabled: true, createdAt: now() });
  });
  revalidatePath("/terms");
  if (projectId) revalidatePath(`/projects/${projectId}`);
}

export async function deleteTerm(id: string) {
  await requireAdmin();
  await mutate((db) => {
    db.terms = db.terms.filter((t) => t.id !== id);
  });
  revalidatePath("/terms");
}

export async function toggleTerm(id: string) {
  await requireAdmin();
  await mutate((db) => {
    const t = db.terms.find((x) => x.id === id);
    if (t) t.enabled = !t.enabled;
  });
  revalidatePath("/terms");
}

// ---------------------------------------------------------------- projects

export async function createProject(form: FormData) {
  await requireAdmin();
  const name = String(form.get("name") || "").trim();
  if (!name) return;
  const aliases = String(form.get("aliases") || "").split(/[,\n]/).map((s) => s.trim()).filter((s) => s.length > 1);
  const id = newId();
  await mutate((db) => {
    db.projects.push({ id, name, industry: String(form.get("industry") || "").trim() || undefined, country: String(form.get("country") || "").trim() || undefined, createdAt: now() });
    for (const a of aliases) db.terms.push({ id: newId(), text: a, type: "client", replacement: DEFAULT_REPLACEMENT.client, scope: "project", projectId: id, enabled: true, createdAt: now() });
  });
  revalidatePath("/projects");
  redirect(`/projects/${id}`);
}

/**
 * Import the portfolio master catalog (JSON exported earlier). Each row becomes a
 * project; client contacts and live-site domains become that project's terms.
 */
export async function importCatalog(_prev: string | null, form: FormData): Promise<string | null> {
  await requireAdmin();
  const file = form.get("catalog");
  if (!(file instanceof File) || !file.size) return "Choose the portfolio_master.json file first.";
  let rows: Array<Record<string, unknown>>;
  try {
    rows = JSON.parse(await file.text());
    if (!Array.isArray(rows)) throw new Error();
  } catch {
    return "That file isn't a JSON array of projects.";
  }
  const { created, terms } = await mutate((db) => applyCatalog(db, rows));
  revalidatePath("/projects");
  return `Imported ${rows.length} rows: ${created} new projects, ${terms} dictionary terms.`;
}

export async function deleteProject(id: string) {
  await requireAdmin();
  await mutate((db) => {
    db.projects = db.projects.filter((p) => p.id !== id);
    db.terms = db.terms.filter((t) => t.projectId !== id);
    for (const s of db.sources) if (s.projectId === id) s.projectId = undefined;
  });
  revalidatePath("/projects");
  redirect("/projects");
}

// ---------------------------------------------------------------- mapping

/** Link sources to projects (from the Mapping page) and re-clean them with that project's dictionary. */
export async function confirmMatches(pairs: Array<{ sourceId: string; projectId: string }>) {
  await requireAdmin();
  const changed: string[] = [];
  await mutate((db) => {
    for (const { sourceId, projectId } of pairs) {
      const s = db.sources.find((x) => x.id === sourceId);
      if (!s || !db.projects.some((p) => p.id === projectId)) continue;
      if (s.projectId !== projectId) changed.push(s.id);
      s.projectId = projectId;
      s.match = { ...(s.match || { candidates: [], confidence: 100, matchedAt: now() }), status: "confirmed" };
      s.updatedAt = now();
    }
  });
  after(async () => {
    for (const id of changed) await enqueueScan(id);
  });
  revalidatePath("/mapping");
}

/** Mark sources as not belonging to any project (they stop showing as "needs a decision"). */
export async function markUnlinked(sourceIds: string[]) {
  await requireAdmin();
  await mutate((db) => {
    for (const s of db.sources.filter((x) => sourceIds.includes(x.id))) {
      s.projectId = undefined;
      s.match = { ...(s.match || { candidates: [], confidence: 0, matchedAt: now() }), status: "confirmed" };
    }
  });
  revalidatePath("/mapping");
}

/** Create a project for a group of unmatched files and link them all. */
export async function createProjectForSources(name: string, sourceIds: string[]) {
  await requireAdmin();
  name = name.trim();
  if (!name || !sourceIds.length) return;
  const id = newId();
  await mutate((db) => {
    db.projects.push({ id, name, createdAt: now() });
    for (const s of db.sources.filter((x) => sourceIds.includes(x.id))) {
      s.projectId = id;
      s.match = { ...(s.match || { candidates: [], confidence: 100, matchedAt: now() }), status: "confirmed" };
    }
  });
  after(async () => {
    for (const sid of sourceIds) await enqueueScan(sid);
  });
  revalidatePath("/mapping");
  revalidatePath("/projects");
}

export async function setSourceKind(sourceId: string, kind: SourceKind) {
  await requireAdmin();
  await updateSource(sourceId, (s) => {
    s.kind = kind;
    s.autoKind = false;
  });
  revalidatePath("/mapping");
}

/** Re-run matching for every source you haven't decided on yet (e.g. after importing the catalog). */
export async function rematchAll() {
  await requireAdmin();
  const ids = (await readDb()).sources.filter((s) => s.match?.status !== "confirmed" && s.status !== "processing" && (s.autoProject || s.match)).map((s) => s.id);
  for (const id of ids) await rematchSource(id);
  revalidatePath("/mapping");
}

/** Turn the Figma links listed in the catalog into sources, already linked to their project (one database write). */
export async function addCatalogFigmas(): Promise<void> {
  await requireAdmin();
  const t = now();
  const ids = await mutate((db) => {
    const have = new Set(db.sources.map((s) => (s.figmaUrl ? figmaFileKey(s.figmaUrl) : null)).filter(Boolean));
    const added: string[] = [];
    for (const p of db.projects) {
      for (const url of p.figmaLinks || []) {
        const key = figmaFileKey(url);
        if (!key || have.has(key)) continue;
        have.add(key);
        const id = newId();
        db.sources.unshift({
          id, kind: "figma", title: "", format: "figma", figmaUrl: url, projectId: p.id, status: "processing",
          findings: [], images: [], residual: [], aiUsed: false, history: [{ at: t, action: "uploaded", note: "Added from catalog" }], createdAt: t, updatedAt: t,
          match: { status: "confirmed", confidence: 100, candidates: [{ projectId: p.id, score: 100, evidence: ["Listed for this project in the catalog"] }], matchedAt: t },
        });
        added.push(id);
      }
    }
    return added;
  });
  await Promise.all(ids.map((id) => fs.mkdir(sourceDir(id), { recursive: true })));
  after(async () => {
    for (const id of ids) await enqueueScan(id);
  });
  revalidatePath("/mapping");
  revalidatePath("/sources");
}

// ---------------------------------------------------------------- master map

/** Load seed/master-map.json (projects, Figma files, known proposals / case studies, open questions). */
export async function importMasterMap(): Promise<void> {
  await requireAdmin();
  const { applyMasterMap } = await import("@/lib/masterMap");
  const { figmaConfigured } = await import("@/lib/clean/figma");
  const result = await mutate((db) => applyMasterMap(db));
  await Promise.all(result.figma.map((id) => fs.mkdir(sourceDir(id), { recursive: true })));
  // Without a Figma token the new Figma sources just wait ("Needs Figma access"); with one they get scanned.
  after(async () => {
    for (const id of result.figma) {
      if (figmaConfigured()) await enqueueScan(id);
      else
        await updateSource(id, (s) => {
          s.status = "needs_access";
          s.error = "Add FIGMA_TOKEN to scan and clean this file.";
        });
    }
  });
  revalidatePath("/map");
  revalidatePath("/projects");
  revalidatePath("/");
}

/** Answer an open question from the master map: re-link the files / Figma it is about. */
export async function answerQuestion(questionId: string, form: FormData) {
  await requireAdmin();
  const projectId = String(form.get("projectId") || "") || undefined;
  const text = String(form.get("text") || "").trim() || undefined;
  const rescan: string[] = [];
  await mutate((db) => {
    const q = (db.questions || []).find((x) => x.id === questionId);
    if (!q) return;
    q.answer = { projectId, text, at: now() };
    if (!projectId) return;
    for (const t of q.targets) {
      if (t.kind === "file") {
        for (const f of db.mapFiles || []) if (fileKey(f.fileName) === fileKey(t.fileName)) Object.assign(f, { projectId, confidence: "High", note: `Answered: ${q.item}` });
        for (const s of db.sources) if (s.fileName && fileKey(s.fileName) === fileKey(t.fileName) && s.projectId !== projectId) {
          s.projectId = projectId;
          s.match = { status: "confirmed", confidence: 100, candidates: [{ projectId, score: 100, evidence: ["Your answer on the Master map page"] }], matchedAt: now() };
          rescan.push(s.id);
        }
      } else {
        for (const s of db.sources) if (s.format === "figma" && s.title === t.name) {
          s.projectId = projectId;
          s.match = { status: "confirmed", confidence: 100, candidates: [{ projectId, score: 100, evidence: ["Your answer on the Master map page"] }], matchedAt: now() };
        }
      }
    }
  });
  after(async () => {
    for (const id of rescan) await enqueueScan(id);
  });
  revalidatePath("/map");
}

/** Download the case studies published on the portfolio site and add them, already linked, for cleaning. */
export async function fetchPortfolioCaseStudies(): Promise<void> {
  await requireAdmin();
  const db = await readDb();
  const have = new Set(db.sources.map((s) => s.fileName?.toLowerCase()).filter(Boolean));
  const todo = (db.mapFiles || []).filter((f) => f.kind === "case_study" && f.url && f.projectId && !have.has(f.fileName.toLowerCase()));
  after(async () => {
    const { createSource } = await import("@/lib/clean/pipeline");
    for (const f of todo) {
      try {
        const res = await fetch(f.url!);
        if (!res.ok) continue;
        const bytes = new Uint8Array(await res.arrayBuffer());
        if (bytes[0] !== 0x25 || bytes[1] !== 0x50) continue; // not a PDF
        const project = (await readDb()).projects.find((p) => p.id === f.projectId);
        const s = await createSource({ kind: "case_study", title: `${project?.name || "Case study"} – case study`, format: "pdf", fileName: f.fileName, projectId: f.projectId }, bytes);
        await updateSource(s.id, (x) => {
          x.match = { status: "confirmed", confidence: 100, candidates: [{ projectId: f.projectId!, score: 100, evidence: ["Master map: published on the portfolio site"] }], matchedAt: now() };
        });
        await enqueueScan(s.id);
      } catch {
        /* site unreachable for this file: skip, the button can be pressed again */
      }
    }
  });
  revalidatePath("/map");
}

// ---------------------------------------------------------------- store: listings & orders (admin)

/** Draft listings for projects with at least `min` asset types (proposal / case study / Figma) known or approved. */
export async function draftBlueprints(form: FormData) {
  await requireAdmin();
  const min = Number(form.get("min") || 2);
  const { draftBlueprint } = await import("@/lib/blueprints");
  await mutate((db) => {
    db.blueprints ||= [];
    for (const p of db.projects) {
      if (db.blueprints.some((b) => b.projectId === p.id)) continue;
      const files = (db.mapFiles || []).filter((f) => f.projectId === p.id);
      const srcs = db.sources.filter((s) => s.projectId === p.id);
      const kinds = [
        files.some((f) => f.kind === "proposal") || srcs.some((s) => s.kind === "proposal"),
        files.some((f) => f.kind === "case_study") || srcs.some((s) => s.kind === "case_study"),
        srcs.some((s) => s.format === "figma"),
      ].filter(Boolean).length;
      if (kinds < min || !(p.summary || p.details?.overview)) continue;
      db.blueprints.push(draftBlueprint(db, p));
    }
  });
  revalidatePath("/blueprints");
}

export async function createBlueprint(projectId: string) {
  await requireAdmin();
  const { draftBlueprint } = await import("@/lib/blueprints");
  const id = await mutate((db) => {
    db.blueprints ||= [];
    const p = db.projects.find((x) => x.id === projectId);
    if (!p) return null;
    const existing = db.blueprints.find((b) => b.projectId === projectId);
    if (existing) return existing.id;
    const bp = draftBlueprint(db, p);
    db.blueprints.push(bp);
    return bp.id;
  });
  if (id) redirect(`/blueprints/${id}`);
}

/** Re-draft the text from the catalog and refresh the included (approved) files. Keeps price and published state. */
export async function redraftBlueprint(id: string) {
  await requireAdmin();
  const { draftBlueprint } = await import("@/lib/blueprints");
  await mutate((db) => {
    const i = (db.blueprints || []).findIndex((b) => b.id === id);
    const p = i >= 0 ? db.projects.find((x) => x.id === db.blueprints![i].projectId) : undefined;
    if (p) db.blueprints![i] = draftBlueprint(db, p);
  });
  revalidatePath(`/blueprints/${id}`);
}

export async function saveBlueprint(id: string, form: FormData) {
  await requireAdmin();
  const lines = (k: string) => String(form.get(k) || "").split("\n").map((x) => x.trim()).filter(Boolean);
  const csv = (k: string) => String(form.get(k) || "").split(",").map((x) => x.trim()).filter(Boolean);
  await mutate((db) => {
    const bp = (db.blueprints || []).find((b) => b.id === id);
    if (!bp) return;
    Object.assign(bp, {
      title: String(form.get("title") || bp.title).trim(),
      tagline: String(form.get("tagline") || "").trim(),
      summary: String(form.get("summary") || "").trim(),
      industry: String(form.get("industry") || bp.industry).trim(),
      platforms: csv("platforms"),
      tech: csv("tech"),
      features: lines("features"),
      challenges: lines("challenges"),
      price: Math.max(0, Math.round(Number(form.get("price")) || 0)),
      sourceIds: form.getAll("sourceIds").map(String),
      updatedAt: now(),
    });
  });
  revalidatePath(`/blueprints/${id}`);
  revalidatePath("/store");
}

export async function setPublished(id: string, published: boolean, form?: FormData) {
  await requireAdmin();
  const { leakCheck } = await import("@/lib/blueprints");
  await mutate((db) => {
    const bp = (db.blueprints || []).find((b) => b.id === id);
    if (!bp) return;
    if (published && leakCheck(db, bp).length && form?.get("override") !== "on") throw new Error("The listing still has possible client names. Fix them or tick “I checked these”.");
    bp.published = published;
    bp.updatedAt = now();
  });
  revalidatePath(`/blueprints/${id}`);
  revalidatePath("/blueprints");
  revalidatePath("/store");
}

export async function deleteBlueprint(id: string) {
  await requireAdmin();
  await mutate((db) => {
    db.blueprints = (db.blueprints || []).filter((b) => b.id !== id);
  });
  redirect("/blueprints");
}

export async function setOrderStatus(id: string, status: "paid" | "cancelled" | "pending") {
  await requireAdmin();
  await mutate((db) => {
    const o = (db.orders || []).find((x) => x.id === id);
    if (!o) return;
    o.status = status;
    o.paidAt = status === "paid" ? now() : undefined;
  });
  revalidatePath("/orders");
}
