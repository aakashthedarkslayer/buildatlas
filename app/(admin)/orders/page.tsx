import Link from "next/link";
import { setOrderStatus } from "@/app/actions";
import { timeAgo } from "@/components/Badges";
import { readDb } from "@/lib/store";

export default async function OrdersPage() {
  const db = await readDb();
  const orders = db.orders || [];
  const title = (id: string) => (db.blueprints || []).find((b) => b.id === id)?.title || "Deleted listing";
  return (
    <div className="max-w-6xl space-y-5">
      <header>
        <h1 className="text-2xl font-semibold">Orders</h1>
        <p className="text-sm text-slate-500">Store orders. Send the buyer an invoice, then mark the order paid: their order page unlocks the downloads. (Card payments can be added later.)</p>
      </header>
      <div className="card overflow-hidden">
        <table className="w-full">
          <thead className="border-b border-slate-200 bg-slate-50">
            <tr><th className="th">Buyer</th><th className="th">Blueprints</th><th className="th">Total</th><th className="th">Status</th><th className="th text-right">Actions</th></tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {orders.map((o) => (
              <tr key={o.id}>
                <td className="td"><div className="font-medium">{o.name}</div><div className="text-xs text-slate-500">{o.email}{o.company ? ` · ${o.company}` : ""} · {timeAgo(o.createdAt)}</div>{o.note && <div className="mt-1 text-xs text-slate-600">“{o.note}”</div>}</td>
                <td className="td text-sm">{o.blueprintIds.map((id) => <div key={id}>{title(id)}</div>)}</td>
                <td className="td">${o.total}</td>
                <td className="td text-sm capitalize">{o.status}</td>
                <td className="td">
                  <div className="flex justify-end gap-2 text-xs">
                    <Link href={`/store/order/${o.token}`} target="_blank" className="btn py-1 text-xs">Buyer page ↗</Link>
                    {o.status !== "paid" && <form action={setOrderStatus.bind(null, o.id, "paid")}><button className="btn btn-success py-1 text-xs">Mark paid</button></form>}
                    {o.status !== "cancelled" && <form action={setOrderStatus.bind(null, o.id, "cancelled")}><button className="btn py-1 text-xs">Cancel</button></form>}
                  </div>
                </td>
              </tr>
            ))}
            {orders.length === 0 && <tr><td colSpan={5} className="px-4 py-10 text-center text-sm text-slate-500">No orders yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
