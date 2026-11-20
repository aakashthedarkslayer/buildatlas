import { promises as fs } from "fs";
import { cleanedPath } from "@/lib/clean/pipeline";
import { readDb } from "@/lib/store";

const MIME: Record<string, string> = { pdf: "application/pdf", docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" };
const KIND = { proposal: "Proposal", case_study: "Case study", other: "Document", figma: "Figma" } as const;

/** Buyer downloads: paid order + approved, cleaned file that belongs to a blueprint in the order. Never the original. */
export async function GET(_req: Request, ctx: RouteContext<"/api/store/download/[token]/[source]">) {
  const { token, source } = await ctx.params;
  const db = await readDb();
  const o = (db.orders || []).find((x) => x.token === token);
  const s = db.sources.find((x) => x.id === source);
  if (!o || o.status !== "paid" || !s || s.status !== "approved" || s.format === "figma") return new Response("Not found", { status: 404 });
  const b = (db.blueprints || []).find((x) => o.blueprintIds.includes(x.id) && x.sourceIds.includes(s.id) && x.projectId === s.projectId);
  if (!b) return new Response("Not found", { status: 404 });
  try {
    const data = await fs.readFile(/*turbopackIgnore: true*/ cleanedPath(s));
    // File name from the public listing title, never the original (client) file name.
    const name = `${b.title} - ${KIND[s.kind]}.${s.format}`.replace(/[^\w.\- ]+/g, "").slice(0, 120);
    return new Response(new Uint8Array(data), { headers: { "Content-Type": MIME[s.format], "Content-Disposition": `attachment; filename="${name}"`, "Cache-Control": "private, no-store" } });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
