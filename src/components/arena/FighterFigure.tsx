import { useState } from "react";

import { cn } from "@/lib/utils";
import type { Competitor } from "@/lib/roster";
import type { FighterState } from "@/lib/match/types";

const STATE_CLASS: Record<FighterState, string> = {
  waiting: "anim-idle opacity-70",
  entrance: "anim-entrance",
  fighting: "anim-fighting",
  finished: "anim-idle",
  disqualified: "anim-dq",
};

interface Props {
  competitor: Competitor;
  state: FighterState;
  isWinner?: boolean;
  className?: string;
}

export default function FighterFigure({ competitor, state, isWinner, className }: Props) {
  const [broken, setBroken] = useState(false);

  return (
    <div className={cn("relative flex items-end justify-center", className)}>
      {isWinner ? (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-full blur-2xl"
          style={{ background: "var(--gold-soft)" }}
        />
      ) : null}

      {broken ? (
        <div
          className={cn(
            "flex h-full w-full items-end justify-center rounded-lg",
            STATE_CLASS[state],
          )}
          style={{
            background: "linear-gradient(180deg, var(--accent-soft), transparent)",
            border: "1px dashed var(--accent)",
          }}
        >
          <span className="display-type pb-2 text-[10px]" style={{ color: "var(--accent)" }}>
            {competitor.ringName}
          </span>
        </div>
      ) : (
        <img
          src={competitor.image}
          alt={`${competitor.ringName}, "${competitor.nickname}", in the ring`}
          loading="lazy"
          onError={() => setBroken(true)}
          className={cn("h-full w-auto max-w-full object-contain drop-shadow-2xl", STATE_CLASS[state])}
        />
      )}
    </div>
  );
}
