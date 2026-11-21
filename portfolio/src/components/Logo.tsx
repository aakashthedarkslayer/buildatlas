/** BuildAtlas mark: an "A" made of a roof line and a crossbar, like a plan drawing. */
export function Logo({ className = "h-7 w-7" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <rect width="32" height="32" rx="8" fill="#111827" stroke="rgba(255,255,255,0.12)" />
      <path d="M8 22 16 8l8 14" fill="none" stroke="#38bdf8" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M11.5 17h9" stroke="#e2e8f0" strokeWidth="2.6" strokeLinecap="round" />
    </svg>
  );
}
