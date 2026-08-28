import { useEffect, useRef } from "react";

import { cn } from "@/lib/utils";

interface Props {
  text: string;
  active: boolean;
  error?: string | null;
  className?: string;
}

/** Live, auto-scrolling view of what a fighter is writing right now. */
export default function WorkStream({ text, active, error, className }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (node) node.scrollTop = node.scrollHeight;
  }, [text, error]);

  return (
    <div
      ref={ref}
      role="log"
      aria-live="polite"
      className={cn("work-stream h-32 overflow-y-auto whitespace-pre-wrap break-words p-2", className)}
    >
      {error ? (
        <span className="text-destructive">DQ — {error}</span>
      ) : text ? (
        <>
          {text}
          {active ? <span className="anim-caret">▍</span> : null}
        </>
      ) : (
        <span className="opacity-40">{active ? "warming up…" : "awaiting the bell"}</span>
      )}
    </div>
  );
}
