import type { Metadata } from "next";
import Link from "next/link";
import { isAdmin } from "@/lib/auth";

export const metadata: Metadata = {
  title: "BuildAtlas · Real software product blueprints",
  description: "Proposals, case studies and designs from real, delivered software projects, anonymised and ready to give your team or your AI coding agent a head start.",
};

export default async function StoreLayout({ children }: { children: React.ReactNode }) {
  const admin = await isAdmin();
  return (
    <div className="min-h-screen bg-white text-slate-900">
      {admin && (
        <div className="bg-slate-900 px-4 py-1.5 text-center text-xs text-slate-200">
          You are signed in as admin: draft listings are visible to you only. <Link href="/blueprints" className="underline">Manage listings</Link> · <Link href="/orders" className="underline">Orders</Link>
        </div>
      )}
      <header className="border-b border-slate-100">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <Link href="/store" className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-brand-500 to-violet-600 text-sm font-bold text-white">BA</span>
            <span className="text-lg font-semibold tracking-tight">BuildAtlas</span>
          </Link>
          <nav className="flex items-center gap-6 text-sm text-slate-600">
            <Link href="/store#browse" className="hover:text-slate-900">Browse blueprints</Link>
            <Link href="/store#how" className="hover:text-slate-900">How it works</Link>
          </nav>
        </div>
      </header>
      <main>{children}</main>
      <footer className="mt-20 border-t border-slate-100">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-5 py-8 text-sm text-slate-500">
          <span>© {new Date().getFullYear()} BuildAtlas. Blueprints are based on real projects; client details are removed.</span>
          <Link href="/store#how" className="hover:text-slate-800">What&apos;s in a blueprint?</Link>
        </div>
      </footer>
    </div>
  );
}
