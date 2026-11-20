import Link from "next/link";
import { notFound } from "next/navigation";
import { includedKinds } from "@/lib/blueprints";
import { readDb } from "@/lib/store";

const KIND = { proposal: "Proposal & scope document", case_study: "Case study", figma: "Figma UI design" } as const;

export default async function OrderPage(props: PageProps<"/store/order/[token]">) {
  const { token } = await props.params;
  const db = await readDb();
  const o = (db.orders || []).find((x) => x.token === token);
  if (!o) notFound();
  const items = (db.blueprints || []).filter((b) => o.blueprintIds.includes(b.id));
  return (
    <div className="mx-auto max-w-3xl px-5 py-12">
      <p className="text-sm text-slate-500">Order for {o.name} · {new Date(o.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</p>
      <h1 className="mt-1 text-3xl font-bold">{o.status === "paid" ? "Your blueprints" : o.status === "cancelled" ? "Order cancelled" : "Thanks, your order is in"}</h1>
      {o.status === "pending" && (
        <p className="mt-3 rounded-xl bg-brand-50 px-4 py-3 text-slate-700">
          We&apos;ll email an invoice to <b>{o.email}</b>. This page unlocks your downloads as soon as payment is confirmed, so bookmark it.
        </p>
      )}
      <div className="mt-8 space-y-5">
        {items.map((b) => {
          const k = includedKinds(db, b);
          return (
            <section key={b.id} className="rounded-2xl border border-slate-200 p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold">{b.title}</h2>
                  <p className="text-sm text-slate-500">{b.industry}</p>
                </div>
                <Link href={`/store/b/${b.slug}`} className="text-sm text-brand-600 hover:underline">View listing</Link>
              </div>
              <ul className="mt-4 divide-y divide-slate-100 text-sm">
                {(["proposal", "case_study", "figma"] as const).flatMap((kind) =>
                  k[kind].map((s, i) => (
                    <li key={s.id} className="flex items-center justify-between gap-3 py-2.5">
                      <span>{KIND[kind]}{k[kind].length > 1 ? ` ${i + 1}` : ""}</span>
                      {o.status !== "paid" ? (
                        <span className="text-slate-400">Unlocks after payment</span>
                      ) : kind === "figma" ? (
                        s.cleanedFigmaUrl ? <a href={s.cleanedFigmaUrl} target="_blank" rel="noreferrer" className="font-medium text-brand-600 hover:underline">Open in Figma</a> : <span className="text-slate-500">We&apos;ll share the Figma file with {o.email}</span>
                      ) : (
                        <a href={`/api/store/download/${o.token}/${s.id}`} className="font-medium text-brand-600 hover:underline">Download</a>
                      )}
                    </li>
                  )),
                )}
                {k.proposal.length + k.case_study.length + k.figma.length === 0 && <li className="py-2.5 text-slate-500">Files are being prepared; we&apos;ll email you when they&apos;re ready.</li>}
              </ul>
            </section>
          );
        })}
      </div>
      <p className="mt-8 text-sm text-slate-500">Total ${o.total} · Questions? Reply to the invoice email.</p>
    </div>
  );
}
