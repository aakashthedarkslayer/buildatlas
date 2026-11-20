import Link from "next/link";
import { notFound } from "next/navigation";
import { readDb } from "@/lib/store";
import { CheckoutForm } from "./CheckoutForm";

export default async function Checkout(props: PageProps<"/store/checkout">) {
  const sp = await props.searchParams;
  const ids = (Array.isArray(sp.b) ? sp.b : [sp.b]).filter((x): x is string => typeof x === "string");
  const db = await readDb();
  const items = (db.blueprints || []).filter((b) => b.published && ids.includes(b.id));
  if (!items.length) notFound();
  const total = items.reduce((n, b) => n + b.price, 0);
  return (
    <div className="mx-auto max-w-3xl px-5 py-12">
      <h1 className="text-3xl font-bold">Checkout</h1>
      <div className="mt-6 grid gap-8 md:grid-cols-[1fr_260px]">
        <CheckoutForm ids={items.map((b) => b.id)} />
        <div className="rounded-2xl border border-slate-200 p-5">
          <h2 className="text-sm font-semibold">Order</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {items.map((b) => (
              <li key={b.id} className="flex justify-between gap-3"><Link href={`/store/b/${b.slug}`} className="hover:underline">{b.title}</Link><span>${b.price}</span></li>
            ))}
          </ul>
          <div className="mt-4 flex justify-between border-t border-slate-100 pt-3 font-semibold"><span>Total</span><span>${total}</span></div>
          <p className="mt-3 text-xs text-slate-500">We&apos;ll email an invoice. Your download page unlocks as soon as payment is confirmed.</p>
        </div>
      </div>
    </div>
  );
}
