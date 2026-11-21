import type { Screen } from "../data/projects";
import { BrowserFrame, PhoneFrame } from "./DeviceFrames";
import { DesktopMock, MobileMock } from "./mocks/ScreenMock";
import { cx } from "./mocks/primitives";

/** Renders a project screen: a real screenshot if supplied, otherwise the drawn illustration. */
export function ScreenPreview({ screen, className, frame = true }: { screen: Screen; className?: string; frame?: boolean }) {
  const inner =
    screen.kind === "image" && screen.src ? (
      <img src={screen.src} alt={screen.caption} loading="lazy" decoding="async" className="h-full w-full object-cover object-top" />
    ) : screen.device === "desktop" ? (
      <DesktopMock variant={screen.variant ?? "property"} />
    ) : (
      <MobileMock variant={screen.variant ?? "property"} />
    );
  if (!frame) return <div className={className}>{inner}</div>;
  return screen.device === "desktop" ? (
    <BrowserFrame className={className}>{inner}</BrowserFrame>
  ) : (
    <PhoneFrame className={cx("w-full", className)}>{inner}</PhoneFrame>
  );
}

/** Small honest label shown on every drawn placeholder. */
export function IllustrativeBadge({ className }: { className?: string }) {
  return (
    <span className={cx("inline-flex items-center gap-1 rounded-full border border-white/10 bg-ink-900/80 px-2 py-0.5 text-[10px] font-medium tracking-wide text-slate-400 backdrop-blur", className)} title="Illustrative placeholder: real, approved screenshots will replace this">
      Illustrative
    </span>
  );
}
