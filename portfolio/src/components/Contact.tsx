import { Mail, ArrowRight } from "lucide-react";
import { useState } from "react";
import { Section } from "./Section";

/** Replace with your real address. The form opens the visitor's email app (no server needed). */
export const CONTACT_EMAIL = "hello@example.com";

const TOPICS = ["Licensing inquiry", "Design collaboration", "Marketplace partnership", "Something else"];

export function Contact() {
  const [topic, setTopic] = useState(TOPICS[0]);
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const href = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(`${topic} · BuildAtlas`)}&body=${encodeURIComponent(`${message}\n\n${name}`)}`;
  return (
    <Section id="contact" eyebrow="Contact" title="Let's talk" intro="For licensing inquiries, design collaborations and marketplace partnerships.">
      <div className="grid gap-8 lg:grid-cols-[1fr_1.3fr]">
        <div className="space-y-4">
          {TOPICS.slice(0, 3).map((t, i) => (
            <div key={t} className="rounded-2xl border border-white/[0.07] bg-ink-850 p-5">
              <div className="font-medium text-white">{t}</div>
              <p className="mt-1 text-sm text-slate-400">
                {["Use selected designs or blueprints in your own products, under a written licence.", "Work together on new product design, UI kits or design systems.", "Feature, bundle or distribute curated collections."][i]}
              </p>
            </div>
          ))}
          <a href={`mailto:${CONTACT_EMAIL}`} className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white"><Mail className="h-4 w-4" aria-hidden="true" />{CONTACT_EMAIL}</a>
        </div>
        <form
          className="rounded-2xl border border-white/[0.07] bg-ink-850 p-6 sm:p-8"
          onSubmit={(e) => {
            e.preventDefault();
            window.location.href = href;
          }}
        >
          <fieldset>
            <legend className="text-sm font-medium text-white">What is it about?</legend>
            <div className="mt-3 flex flex-wrap gap-2">
              {TOPICS.map((t) => (
                <label key={t} className={`cursor-pointer rounded-full px-3 py-1.5 text-xs ring-1 transition has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-accent-400 ${topic === t ? "bg-white text-ink-900 ring-white" : "text-slate-400 ring-white/10 hover:text-white"}`}>
                  <input type="radio" name="topic" value={t} checked={topic === t} onChange={() => setTopic(t)} className="sr-only" />
                  {t}
                </label>
              ))}
            </div>
          </fieldset>
          <label className="mt-6 block">
            <span className="text-sm text-slate-300">Your name</span>
            <input required value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" className="mt-1.5 w-full rounded-xl border border-white/10 bg-ink-900 px-3.5 py-2.5 text-white outline-none focus:border-accent-400/60 focus:ring-4 focus:ring-accent-400/10" />
          </label>
          <label className="mt-4 block">
            <span className="text-sm text-slate-300">Message</span>
            <textarea required value={message} onChange={(e) => setMessage(e.target.value)} rows={5} className="mt-1.5 w-full rounded-xl border border-white/10 bg-ink-900 px-3.5 py-2.5 text-white outline-none focus:border-accent-400/60 focus:ring-4 focus:ring-accent-400/10" placeholder="Tell us what you're working on…" />
          </label>
          <button className="group mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-medium text-ink-900 transition hover:bg-slate-200 sm:w-auto">
            Send message <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" aria-hidden="true" />
          </button>
          <p className="mt-3 text-xs text-slate-500">Opens your email app with the message filled in.</p>
        </form>
      </div>
    </Section>
  );
}
