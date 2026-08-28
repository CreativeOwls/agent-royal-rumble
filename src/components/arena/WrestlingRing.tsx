import ringAsset from "@/assets/ring.png.asset.json";
import FighterFigure from "./FighterFigure";

import WorkStream from "./WorkStream";
import { ROSTER } from "@/lib/roster";
import { cn } from "@/lib/utils";
import type { FighterLive } from "@/hooks/useMatchStream";

interface Props {
  fighters: Record<string, FighterLive>;
  judging: boolean;
  winnerModel: string | null;
}

function formatLatency(ms: number) {
  return ms > 0 ? `${(ms / 1000).toFixed(1)}s` : "—";
}

export default function WrestlingRing({ fighters, judging, winnerModel }: Props) {
  return (
    <section aria-labelledby="ring-heading" className="relative">
      <div className="flex items-baseline justify-between">
        <div>
          <h2 id="ring-heading" className="display-type text-lg text-foreground">
            The Ring
          </h2>
          <span aria-hidden="true" className="header-rule mt-1.5 w-28" />
        </div>
        {judging ? (
          <span className="numeral-type text-[11px] text-gold">referee scoring…</span>
        ) : null}
      </div>

      <div
        className="speed-lines panel-elevated relative mt-4 overflow-hidden rounded-2xl border border-arena-panel-edge p-4 sm:p-6"
        style={{
          backgroundColor: "var(--arena-floor)",
          boxShadow: "var(--shadow-ring)",
        }}
      >
        <img
          src={ringAsset.url}
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-35"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              "var(--circuit-trace), radial-gradient(ellipse at 50% 35%, var(--gold-soft), transparent 65%), linear-gradient(180deg, oklch(0.09 0.01 265 / 55%), oklch(0.09 0.01 265 / 80%))",
          }}
        />


        <div className="relative grid grid-cols-1 gap-5 sm:grid-cols-2">
          {ROSTER.map((competitor) => {
            const live = fighters[competitor.modelId];
            const state = live?.state ?? "waiting";
            const isWinner = winnerModel === competitor.modelId;
            const hot = state === "entrance" || state === "fighting";
            return (
              <article
                key={competitor.modelId}
                className="fighter-panel panel-elevated relative p-3"
                style={
                  {
                    "--accent": `var(${competitor.accentVar})`,
                    "--accent-soft": `var(${competitor.accentSoftVar})`,
                  } as React.CSSProperties
                }
              >
                <header
                  className={cn(
                    "fighter-headbar -mx-3 -mt-3 mb-3 flex items-center justify-between px-3 py-1.5",
                    state === "fighting" && "racing-header",
                  )}
                >
                  <div>
                    <p className="display-type text-xs tracking-wide">{competitor.ringName}</p>
                    <p className="text-[10px] text-muted-foreground">{competitor.nickname}</p>
                  </div>
                  <span className="numeral-type text-[10px] uppercase tracking-widest">
                    {state}
                  </span>
                </header>

                <div className="flex gap-3">
                  <div className="relative h-32 w-20 shrink-0">
                    <span
                      aria-hidden="true"
                      className={cn(
                        "fighter-portal",
                        hot && "fighter-portal-hot",
                        isWinner && "fighter-portal-champion",
                      )}
                    />
                    <FighterFigure
                      competitor={competitor}
                      state={state}
                      isWinner={isWinner}
                      className="relative h-full w-full"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <WorkStream
                      text={live?.output ?? ""}
                      active={state === "fighting"}
                      error={live?.error ?? null}
                    />
                    <dl className="mt-2 grid grid-cols-3 gap-1 text-[10px] text-muted-foreground">

                      <div>
                        <dt>latency</dt>
                        <dd className="numeral-type text-foreground">
                          {formatLatency(live?.metrics?.latencyMs ?? 0)}
                        </dd>
                      </div>
                      <div>
                        <dt>tokens</dt>
                        <dd className="numeral-type text-foreground">
                          {live?.metrics
                            ? live.metrics.promptTokens + live.metrics.completionTokens
                            : "—"}
                        </dd>
                      </div>
                      <div>
                        <dt>cost</dt>
                        <dd className="numeral-type text-foreground">
                          {live?.metrics ? `$${live.metrics.costUsd.toFixed(5)}` : "—"}
                        </dd>
                      </div>
                    </dl>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
