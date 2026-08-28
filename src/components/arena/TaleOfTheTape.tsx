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

export default function TaleOfTheTape({ final, fatal }: Props) {
  return (
    <section
      aria-labelledby="tape-heading"
      className="rounded-xl border border-arena-panel-edge bg-arena-panel/70 p-5 backdrop-blur"
    >
      <h2 id="tape-heading" className="display-type text-lg text-foreground">
        Tale of the Tape
      </h2>

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

          <div className="anim-belt mt-4 rounded-lg border border-gold/50 bg-gold/10 p-4 text-center">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Champion</p>
            <p className="display-type mt-1 text-2xl text-gold">{nameOf(final.winnerModel)}</p>
            <p className="mt-2 text-[11px] text-muted-foreground">{final.refereeNotes}</p>
          </div>

          <ol className="mt-4 space-y-2">
            {[...final.entries]
              .sort((a, b) => b.overall - a.overall)
              .map((entry, index) => {
                const competitor = competitorById(entry.modelId);
                return (
                  <li
                    key={entry.modelId}
                    className="rounded-lg border border-arena-panel-edge p-3"
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
                      <p className="display-type text-xs">
                        <span className="numeral-type mr-2 text-muted-foreground">#{index + 1}</span>
                        {nameOf(entry.modelId)}
                      </p>
                      <span className="numeral-type text-sm text-gold">{entry.overall.toFixed(1)}</span>
                    </div>
                    <div className="numeral-type mt-2 grid grid-cols-4 gap-1 text-[10px] text-muted-foreground">
                      <span>Q {entry.quality}</span>
                      <span>R {entry.result}</span>
                      <span>E {entry.efficiency}</span>
                      <span>C {entry.cost}</span>
                    </div>
                    <div className="numeral-type mt-1 grid grid-cols-3 gap-1 text-[10px] text-muted-foreground">
                      <span>{(entry.latencyMs / 1000).toFixed(1)}s</span>
                      <span>{entry.promptTokens + entry.completionTokens} tok</span>
                      <span>${entry.costUsd.toFixed(5)}</span>
                    </div>
                    <p className={cn("mt-2 text-[11px]", entry.errorText ? "text-destructive" : "text-muted-foreground")}>
                      {entry.errorText ? `DQ — ${entry.errorText}` : entry.refereeComment}
                    </p>
                  </li>
                );
              })}
          </ol>

          {final.bracket ? (
            <div className="mt-5">
              <h3 className="display-type text-[11px] tracking-widest text-muted-foreground">Bracket</h3>
              <div className="mt-2 space-y-1.5">
                {final.bracket.map((round) => (
                  <div
                    key={round.label}
                    className="flex items-center justify-between rounded-md border border-arena-panel-edge px-3 py-2 text-[11px]"
                  >
                    <span className="text-muted-foreground">{round.label}</span>
                    <span className="text-foreground">
                      {nameOf(round.a)} vs {nameOf(round.b)}
                    </span>
                    <span className="text-gold">{nameOf(round.winner)}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          <p className="mt-4 text-[10px] text-muted-foreground">
            Roster: {ROSTER.map((c) => c.ringName).join(" · ")}
          </p>
        </>
      )}
    </section>
  );
}
