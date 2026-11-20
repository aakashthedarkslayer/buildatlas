/**
 * Accuracy check for automatic project matching.
 *   npx tsx --conditions=react-server scripts/test-match.ts <portfolio_master.json> <list.txt> <pdf dir>
 * list.txt: "<catalog ID> <pdf url>" per line: the project each PDF really belongs to.
 * Uses a throwaway DATA_DIR. Matching only (no cleaning), so it runs fast.
 */
import { promises as fs } from "fs";
import os from "os";
import path from "path";

async function main() {
  const [catalogFile, listFile, dir] = process.argv.slice(2);
  process.env.DATA_DIR = await fs.mkdtemp(path.join(os.tmpdir(), "bs-match-"));
  const store = await import("../lib/store");
  const { applyCatalog } = await import("../lib/catalog");
  const { createSource, matchSource } = await import("../lib/clean/pipeline");
  const { pdfText } = await import("../lib/clean/pdf");

  const rows = JSON.parse(await fs.readFile(catalogFile, "utf8"));
  await store.mutate((db) => applyCatalog(db, rows));
  const db = await store.readDb();
  const byCatalog = new Map(db.projects.map((p) => [p.catalogId, p]));
  const name = (id?: string) => db.projects.find((p) => p.id === id)?.name || "—";

  const tally = { autoRight: 0, autoWrong: 0, suggestedTop: 0, suggestedListed: 0, suggestedMissing: 0, none: 0 };
  const lines = (await fs.readFile(listFile, "utf8")).trim().split("\n");
  for (const line of lines) {
    const [catId, url] = line.split(/\s+/);
    const file = path.join(dir, path.basename(url));
    const buf = await fs.readFile(file).catch(() => null);
    if (!buf) continue;
    const expected = byCatalog.get(catId)!;
    const s = await createSource({ kind: "case_study", autoProject: true, title: path.basename(file, ".pdf"), format: "pdf", fileName: path.basename(file) });
    const m = await matchSource(s.id, pdfText(new Uint8Array(buf)));
    const top = m.candidates[0]?.projectId;
    let verdict: string;
    if (m.status === "auto") verdict = top === expected.id ? (tally.autoRight++, "AUTO ✓") : (tally.autoWrong++, "AUTO ✗");
    else if (m.status === "suggested") {
      if (top === expected.id) (tally.suggestedTop++, (verdict = "SUGG ✓ top"));
      else if (m.candidates.some((c) => c.projectId === expected.id)) (tally.suggestedListed++, (verdict = "SUGG ~ listed"));
      else (tally.suggestedMissing++, (verdict = "SUGG ✗"));
    } else (tally.none++, (verdict = "NONE"));
    const why = m.candidates[0]?.evidence[0] || m.guessedName || "";
    console.log(`${verdict.padEnd(14)} ${String(m.confidence).padStart(3)}  expected: ${expected.name.slice(0, 40).padEnd(40)} got: ${name(top).slice(0, 34).padEnd(34)} ${why.slice(0, 60)}`);
  }
  const total = Object.values(tally).reduce((a, b) => a + b, 0);
  console.log("\n", tally, `total ${total}`);
  console.log(`Linked automatically and correct: ${tally.autoRight}/${total}; wrong auto-links: ${tally.autoWrong}; right answer offered first: ${tally.autoRight + tally.suggestedTop}/${total}`);
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
