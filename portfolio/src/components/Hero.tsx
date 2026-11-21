import { ArrowRight } from "lucide-react";
import { COLLECTION } from "../data/projects";
import { BrowserFrame, PhoneFrame } from "./DeviceFrames";
import { DesktopMock, MobileMock } from "./mocks/ScreenMock";
import { IllustrativeBadge } from "./ScreenPreview";

export function Hero() {
  return (
    <section id="top" className="relative overflow-hidden px-5 pb-20 pt-32 sm:px-8 lg:pb-28 lg:pt-40">
      <div className="hairline-grid pointer-events-none absolute inset-0" aria-hidden="true" />
      <div className="relative mx-auto max-w-7xl">
        <div className="mx-auto max-w-5xl text-center">
          <p className="inline-flex animate-rise items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs text-slate-400">
            <span className="h-1.5 w-1.5 rounded-full bg-signal" aria-hidden="true" />
            <span className="sm:hidden">Software design & product blueprints</span>
            <span className="hidden sm:inline">Real-world software design, product blueprints and UI resources</span>
          </p>
          <h1 className="mt-6 animate-rise text-[2.6rem] font-semibold leading-[1.05] tracking-[-0.035em] text-white [animation-delay:60ms] sm:text-5xl md:text-6xl lg:text-[4.5rem]">
            <span className="block">Real-World <span className="whitespace-nowrap">Product Design.</span></span>
            <span className="block text-slate-500">Ready to Explore.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-xl animate-rise text-base leading-relaxed text-slate-400 [animation-delay:120ms] sm:text-lg">
            Discover a curated collection of interface designs, software workflows, and product references built around real business problems.
          </p>
          <div className="mt-9 flex animate-rise flex-col items-center justify-center gap-3 [animation-delay:180ms] sm:flex-row">
            <a href="#work" className="group inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-medium text-ink-900 transition hover:bg-slate-200">
              Explore Projects <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" aria-hidden="true" />
            </a>
            <a href="#inside" className="inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-medium text-white ring-1 ring-white/15 transition hover:bg-white/[0.05]">
              View Featured Work
            </a>
          </div>
        </div>

        {/* Product showcase: overlapping dashboards and phones (illustrative) */}
        <div className="relative mx-auto mt-16 max-w-6xl animate-rise [animation-delay:260ms] lg:mt-20">
          <div className="relative">
            <BrowserFrame url="portfolio.example.com/property-operations" className="relative z-10 mx-auto w-[92%] sm:w-[78%]">
              <DesktopMock variant="property" />
            </BrowserFrame>
            <BrowserFrame className="absolute -left-2 top-[14%] hidden w-[38%] -rotate-[1.5deg] opacity-90 lg:block">
              <DesktopMock variant="warehouse" />
            </BrowserFrame>
            <BrowserFrame className="absolute -right-2 top-[6%] hidden w-[38%] rotate-[1.5deg] opacity-90 lg:block">
              <DesktopMock variant="agent" />
            </BrowserFrame>
            <PhoneFrame className="absolute bottom-[-12%] left-[6%] z-20 w-[22%] sm:w-[15%] lg:left-[14%] lg:w-[12%]">
              <MobileMock variant="healthcare" />
            </PhoneFrame>
            <PhoneFrame className="absolute bottom-[-8%] right-[6%] z-20 w-[22%] sm:w-[15%] lg:right-[14%] lg:w-[12%]">
              <MobileMock variant="sports" />
            </PhoneFrame>
          </div>
          <div className="pointer-events-none absolute inset-x-0 -bottom-24 h-40 bg-gradient-to-t from-ink-900 to-transparent" aria-hidden="true" />
          <IllustrativeBadge className="absolute right-[12%] top-[-2.25rem] sm:right-[12%]" />
        </div>

        <dl className="relative z-10 mx-auto mt-28 grid max-w-3xl grid-cols-3 divide-x divide-white/[0.07] rounded-2xl border border-white/[0.07] bg-ink-850/70 backdrop-blur">
          {[
            [`~${COLLECTION.designs}`, "UI/UX design projects"],
            [`~${COLLECTION.caseStudies}`, "software case studies"],
            [`~${COLLECTION.proposals}`, "product proposals"],
          ].map(([n, l]) => (
            <div key={l} className="px-3 py-5 text-center sm:px-6">
              <dt className="sr-only">{l}</dt>
              <dd className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">{n}</dd>
              <dd className="mt-1 text-xs text-slate-500 sm:text-sm">{l}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-3 text-center text-xs text-slate-600">Approximate size of the source collection. Projects are published selectively, after licensing review and anonymisation.</p>
      </div>
    </section>
  );
}
