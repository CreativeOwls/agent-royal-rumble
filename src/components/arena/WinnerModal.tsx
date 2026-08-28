import { useCallback, useEffect, useRef } from "react";
import { Link } from "@tanstack/react-router";
import { X } from "lucide-react";

import FighterFigure from "./FighterFigure";
import { competitorById } from "@/lib/roster";
import type { MatchFinal, ScoredEntry } from "@/lib/match/types";

const KPI_FIELDS = [
  { key: "quality", label: "Quality" },
  { key: "result", label: "Result" },
  { key: "efficiency", label: "Efficiency" },
  { key: "cost", label: "Cost" },
] as const;

const PYRO_PIECES = [6, 18, 30, 44, 56, 68, 82, 94];

const FOCUSABLE =
  'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

interface Props {
  final: MatchFinal;
  onClose: () => void;
}

export default function WinnerModal({ final, onClose }: Props) {
  const cardRef = useRef<HTMLDivElement | null>(null);
  const restoreRef = useRef<HTMLElement | null>(null);

  const winner = final.winnerModel ? competitorById(final.winnerModel) : undefined;
  const entry: ScoredEntry | undefined = final.entries.find(
    (e) => e.modelId === final.winnerModel,
  );

  useEffect(() => {
    restoreRef.current = document.activeElement as HTMLElement | null;
    const card = cardRef.current;
    card?.querySelector<HTMLElement>(FOCUSABLE)?.focus();
    return () => restoreRef.current?.focus?.();
  }, []);

  const onKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        onClose();
        return;
      }
      if (event.key !== "Tab") return;
      const nodes = Array.from(
        cardRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? [],
      );
      if (nodes.length === 0) return;
      const first = nodes[0]!;
      const last = nodes[nodes.length - 1]!;
      const active = document.activeElement;
      if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    },
    [onClose],
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onKeyDown={onKeyDown}
    >
      <button
        type="button"
        aria-label="Close winner announcement"
        onClick={onClose}
        className="absolute inset-0 h-full w-full cursor-default bg-background/80 backdrop-blur-sm"
      />

      <div
        ref={cardRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="winner-modal-heading"
        className="anim-belt gold-elevated panel-elevated relative max-h-[90svh] w-full max-w-lg overflow-y-auto rounded-2xl border border-gold/60 bg-arena-panel/95 p-5 text-center sm:p-7"
        style={
          winner
            ? ({
                "--accent": `var(${winner.accentVar})`,
                "--accent-soft": `var(${winner.accentSoftVar})`,
              } as React.CSSProperties)
            : undefined
        }
      >
        <span aria-hidden="true" className="header-rule absolute inset-x-0 top-0" />
        {PYRO_PIECES.map((left, index) => (
          <span
            key={left}
            aria-hidden="true"
            className="anim-pyro pointer-events-none absolute top-0 h-2 w-1 rounded-sm bg-gold"
            style={{ left: `${left}%`, animationDelay: `${index * 0.12}s` }}
          />
        ))}

        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="spice absolute right-3 top-3 rounded-full border border-arena-panel-edge p-1.5 text-muted-foreground hover:border-gold hover:text-gold"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>

        <p className="numeral-type text-[10px] uppercase tracking-[0.35em] text-gold">
          {winner ? "Champion" : "No decision"}
        </p>

        {winner ? (
          <>
            <div className="relative mx-auto mt-4 h-40 w-28">
              <span aria-hidden="true" className="fighter-portal fighter-portal-champion" />
              <FighterFigure
                competitor={winner}
                state="finished"
                isWinner
                className="relative h-full w-full"
              />
            </div>
            <h2
              id="winner-modal-heading"
              className="display-type mt-4 text-3xl leading-tight tracking-tight text-gold sm:text-4xl"
            >
              {winner.ringName}
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">“{winner.nickname}”</p>
          </>
        ) : (
          <h2
            id="winner-modal-heading"
            className="display-type mt-4 text-2xl tracking-tight text-foreground"
          >
            The referee returned no decision
          </h2>
        )}

        {final.exhibition ? (
          <p className="mt-3 rounded-md border border-gold/40 bg-gold/10 p-2 text-[11px] text-gold">
            Exhibition mode — these numbers are mock data.
          </p>
        ) : null}

        {entry ? (
          <>
            <p className="numeral-type mt-4 text-4xl text-gold">{entry.overall.toFixed(1)}</p>
            <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
              Overall score
            </p>

            <div className="mt-5 grid grid-cols-2 gap-3 text-left sm:grid-cols-4">
              {KPI_FIELDS.map((field) => (
                <div key={field.key}>
                  <div className="numeral-type flex justify-between text-[10px] text-muted-foreground">
                    <span>{field.label}</span>
                    <span className="text-foreground">{entry[field.key]}</span>
                  </div>
                  <div className="kpi-bar mt-1">
                    <span
                      className="kpi-fill"
                      style={{ width: `${Math.max(0, Math.min(100, entry[field.key]))}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : null}

        <p className="mt-4 text-[11px] leading-relaxed text-muted-foreground">
          {final.refereeNotes}
        </p>

        <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
          <Link
            to="/match/$matchId"
            params={{ matchId: final.matchId }}
            className="spice rounded-full border border-gold/50 px-4 py-2 text-[11px] text-gold hover:bg-gold/10"
          >
            View match details →
          </Link>
          <button
            type="button"
            onClick={onClose}
            className="spice rounded-full border border-arena-panel-edge px-4 py-2 text-[11px] text-muted-foreground hover:border-gold hover:text-gold"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
