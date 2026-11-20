import { promises as fs } from "fs";
import path from "path";
import { isAdmin } from "@/lib/auth";
import { readDb, sourceDir } from "@/lib/store";

/** Public preview images: only cleaned pages of approved files that belong to a published listing. */
export async function GET(_req: Request, ctx: RouteContext<"/api/store/preview/[bp]/[source]/[file]">) {
  const { bp, source, file } = await ctx.params;
  if (!/^clean-\d{3}\.png$/.test(file)) return new Response("Not found", { status: 404 });
  const db = await readDb();
  const b = (db.blueprints || []).find((x) => x.id === bp);
  const s = db.sources.find((x) => x.id === source);
  if (!b || !s || !(b.published || (await isAdmin())) || !b.sourceIds.includes(s.id) || s.status !== "approved" || s.projectId !== b.projectId) return new Response("Not found", { status: 404 });
  try {
    const data = await fs.readFile(/*turbopackIgnore: true*/ path.join(sourceDir(s.id), "preview", file));
    return new Response(new Uint8Array(data), { headers: { "Content-Type": "image/png", "Cache-Control": "public, max-age=300" } });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
