"use client";
import { useActionState } from "react";
import { placeOrder } from "@/app/store/actions";

export function CheckoutForm({ ids }: { ids: string[] }) {
  const [error, action, pending] = useActionState(placeOrder, null);
  return (
    <form action={action} className="space-y-4">
      {ids.map((id) => <input key={id} type="hidden" name="blueprint" value={id} />)}
      {/* Honeypot: hidden from people, filled by bots */}
      <input name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
      <Field name="name" label="Your name" required />
      <Field name="email" label="Work email" type="email" required />
      <Field name="company" label="Company (optional)" />
      <div>
        <label htmlFor="note" className="mb-1 block text-sm font-medium">What are you building? (optional)</label>
        <textarea id="note" name="note" rows={3} className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-100" />
      </div>
      {error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
      <button disabled={pending} className="w-full rounded-xl bg-brand-600 px-4 py-3 font-medium text-white hover:bg-brand-700 disabled:opacity-60">{pending ? "Placing order…" : "Place order"}</button>
      <p className="text-xs text-slate-500">By ordering you agree the blueprint is licensed for your own projects and not for resale.</p>
    </form>
  );
}

function Field({ name, label, type = "text", required }: { name: string; label: string; type?: string; required?: boolean }) {
  return (
    <div>
      <label htmlFor={name} className="mb-1 block text-sm font-medium">{label}</label>
      <input id={name} name={name} type={type} required={required} className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-100" />
    </div>
  );
}
