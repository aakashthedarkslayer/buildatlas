"use server";

import { randomBytes } from "crypto";
import { redirect } from "next/navigation";
import { mutate, newId, now, readDb } from "@/lib/store";

/** Public: a buyer asks to buy blueprints. Creates a pending order; you confirm payment in the admin. */
export async function placeOrder(_prev: string | null, form: FormData): Promise<string | null> {
  const name = String(form.get("name") || "").trim().slice(0, 120);
  const email = String(form.get("email") || "").trim().slice(0, 200);
  const company = String(form.get("company") || "").trim().slice(0, 160) || undefined;
  const note = String(form.get("note") || "").trim().slice(0, 2000) || undefined;
  const ids = [...new Set(form.getAll("blueprint").map(String))].slice(0, 20);
  if (form.get("website")) return null; // honeypot field: bots fill it in
  if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "Please enter your name and a valid email address.";
  const db = await readDb();
  const items = (db.blueprints || []).filter((b) => b.published && ids.includes(b.id));
  if (!items.length) return "Those blueprints are no longer available.";
  const token = randomBytes(18).toString("base64url");
  await mutate((d) => {
    d.orders ||= [];
    d.orders.unshift({ id: newId(), token, blueprintIds: items.map((b) => b.id), name, email, company, note, total: items.reduce((n, b) => n + b.price, 0), status: "pending", createdAt: now() });
  });
  redirect(`/store/order/${token}`);
}
