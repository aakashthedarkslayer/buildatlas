import { useLayoutEffect, useRef, useState, type ReactNode } from "react";

/**
 * Renders children at a fixed design size (e.g. 720x450) and scales the whole thing to the
 * available width, so a drawn screen looks identical in the hero, a card or the modal.
 */
export function Scaled({ width, height, children }: { width: number; height: number; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => setScale(el.clientWidth / width);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [width]);
  return (
    <div ref={ref} className="relative h-full w-full overflow-hidden" style={{ aspectRatio: `${width} / ${height}` }}>
      <div className="absolute left-0 top-0 origin-top-left" style={{ width, height, transform: `scale(${scale})`, visibility: scale ? "visible" : "hidden" }}>
        {children}
      </div>
    </div>
  );
}
