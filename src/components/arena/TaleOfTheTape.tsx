import { Link } from "@tanstack/react-router";

import { competitorById, ROSTER } from "@/lib/roster";
import type { MatchFinal } from "@/lib/match/types";
import { cn } from "@/lib/utils";

interface Props {
  final: MatchFinal | null;
  fatal: string | null;
}

function nameOf(modelId: string | null) {
  if (!modelId) return "—";
  return competitorById(modelId)?.ringName ?? modelId;
}

const KPI_FIELDS = [
  { key: "quality", label: "Q" },
  { key: "result", label: "R" },
  { key: "efficiency", label: "E" },
  { key: "cost", label: "C" },
] as const;

const PYRO_PIECES = [8, 24, 42, 58, 74, 90];

export default function TaleOfTheTape({ final, fatal }: Props) {
  return (
    <section
      aria-labelledby="tape-heading"
      className="panel-elevated rounded-2xl border border-arena-panel-edge bg-arena-panel/70 p-5 backdrop-blur sm:p-6"
    >
      <h2 id="tape-heading" className="display-type text-lg text-foreground">
        Tale of the Tape
      </h2>
      <span aria-hidden="true" className="header-rule mt-1.5 w-32" />

      {fatal ? (
        <p className="mt-3 rounded-md border border-destructive/50 bg-destructive/10 p-3 text-xs text-destructive">
          {fatal}
        </p>
      ) : null}

      {!final ? (
        <p className="mt-3 text-xs text-muted-foreground">
          No decision yet. Ring the bell and the scorecard fills in live.
        </p>
      ) : (
        <>
          {final.exhibition ? (
            <p className="mt-3 rounded-md border border-gold/40 bg-gold/10 p-2 text-[11px] text-gold">
              Exhibition mode — the live gateway was unavailable, so these numbers are mock data.
            </p>
          ) : null}

          <div className="anim-belt gold-elevated relative mt-5 overflow-hidden rounded-xl border border-gold/60 bg-gradient-to-b from-gold/15 to-gold/5 p-5 text-center">
            <span aria-hidden="true" className="header-rule absolute inset-x-0 top-0" />
            {PYRO_PIECES.map((left, index) => (
              <span
                key={left}
                aria-hidden="true"
                className="anim-pyro pointer-events-none absolute top-0 h-2 w-1 rounded-sm bg-gold"
                style={{ left: `${left}%`, animationDelay: `${index * 0.14}s` }}
              />
            ))}
            <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Champion</p>
            <p className="display-type mt-2 text-3xl tracking-tight text-gold">
              {nameOf(final.winnerModel)}
            </p>
            <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">
              {final.refereeNotes}
            </p>
          </div>

          <ol className="mt-5 space-y-3">
            {[...final.entries]
              .sort((a, b) => b.overall - a.overall)
              .map((entry, index) => {
                const competitor = competitorById(entry.modelId);
                return (
                  <li
                    key={entry.modelId}
                    className="panel-elevated rounded-xl border border-arena-panel-edge p-4"
                    style={
                      competitor
                        ? ({
                            "--accent": `var(${competitor.accentVar})`,
                            borderColor: "color-mix(in oklab, var(--accent) 45%, transparent)",
                          } as React.CSSProperties)
                        : undefined
                    }
                  >
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="display-type text-xs tracking-wide">
                        <span className="numeral-type mr-2 text-muted-foreground">#{index + 1}</span>
                        {nameOf(entry.modelId)}
                      </p>
                      <span className="numeral-type text-base text-gold">{entry.overall.toFixed(1)}</span>
                    </div>
                    <div className="mt-3 grid grid-cols-4 gap-2">
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
                    <div className="numeral-type mt-3 grid grid-cols-3 gap-1 text-[10px] text-muted-foreground">
                      <span>{(entry.latencyMs / 1000).toFixed(1)}s</span>
                      <span>{entry.promptTokens + entry.completionTokens} tok</span>
                      <span>${entry.costUsd.toFixed(5)}</span>
                    </div>
                    <p className={cn("mt-2 text-[11px] leading-relaxed", entry.errorText ? "text-destructive" : "text-muted-foreground")}>
                      {entry.errorText ? `DQ — ${entry.errorText}` : entry.refereeComment}
                    </p>
                  </li>
                );
              })}
          </ol>

          <div className="mt-5 flex items-center justify-between gap-2">
            <Link
              to="/match/$matchId"
              params={{ matchId: final.matchId }}
              className="spice rounded-full border border-gold/50 px-3 py-1.5 text-[11px] text-gold hover:bg-gold/10"
            >
              View this match on the leaderboard →
            </Link>
          </div>


          <p className="mt-4 text-[10px] text-muted-foreground">
            Roster: {ROSTER.map((c) => c.ringName).join(" · ")}
          </p>
        </>
      )}
    </section>
  );
}
