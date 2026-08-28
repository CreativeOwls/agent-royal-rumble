import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";

import PromoDesk from "@/components/arena/PromoDesk";
import TaleOfTheTape from "@/components/arena/TaleOfTheTape";
import WrestlingRing from "@/components/arena/WrestlingRing";
import { useMatchStream } from "@/hooks/useMatchStream";
import { DEFAULT_WEIGHTS, type Weights } from "@/lib/match/types";
import ringHeroAsset from "@/assets/ring-hero.png.asset.json";

export const Route = createFileRoute("/arena")({
  head: () => ({
    meta: [
      { title: "Arena — Agent Royal Rumble" },
      {
        name: "description",
        content:
          "Put four frontier models in one ring over the same task and watch real latency, tokens, cost and a blind referee decide the champion.",
      },
      { property: "og:title", content: "Arena — Agent Royal Rumble" },
      {
        property: "og:description",
        content:
          "Four models, one task, live streamed. Real latency, tokens and cost, scored by a blind referee.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ArenaPage,
});

function ArenaPage() {
  const { state, start, reset } = useMatchStream();
  const [task, setTask] = useState("");
  const [weights, setWeights] = useState<Weights>(DEFAULT_WEIGHTS);

  return (
    <main className="min-h-screen bg-arena-floor px-3 py-6 sm:px-4 sm:py-8">
      <header className="mx-auto mb-8 grid max-w-7xl grid-cols-[minmax(0,1fr)_auto] items-center gap-3 sm:flex sm:flex-wrap sm:items-baseline sm:justify-between sm:gap-4">
        <div className="min-w-0">
          <h1 className="display-type truncate text-base tracking-tight text-foreground sm:text-2xl">
            Agent Royal Rumble — Arena
          </h1>
          <span aria-hidden="true" className="header-rule mt-2 w-32" />
        </div>
        <nav className="flex shrink-0 gap-2 text-[11px] text-muted-foreground sm:text-xs">
          <Link
            to="/arena"
            className="spice rounded-full border border-arena-panel-edge px-3 py-1.5 hover:border-gold hover:text-gold"
          >
            Arena
          </Link>
          <Link
            to="/leaderboard"
            className="spice rounded-full border border-arena-panel-edge px-3 py-1.5 hover:border-gold hover:text-gold"
          >
            Leaderboard
          </Link>
        </nav>
      </header>


      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <section
          aria-label="Arena hero"
          className="panel-elevated speed-lines relative overflow-hidden rounded-3xl border border-border bg-background"
        >
          <img
            src={ringHeroAsset.url}
            alt="DevFest DC 26 wrestling ring rendered in Google brand colors"
            className="anim-hero h-[160px] w-full object-cover object-center sm:h-[300px] lg:h-[420px]"
          />
          <div className="anim-hero-glow pointer-events-none absolute inset-0 bg-gold/10" />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-8">
            <p className="numeral-type text-[0.65rem] uppercase tracking-[0.35em] text-gold">
              DevFest DC 26
            </p>
            <h2 className="display-type mt-2 text-xl leading-[1.05] text-foreground sm:text-3xl lg:text-4xl">
              Four models. One task. One belt.
            </h2>
            <span aria-hidden="true" className="header-rule mt-3 w-48" />
          </div>
        </section>


        <section aria-label="Promo desk">
          <PromoDesk
            task={task}
            onTaskChange={setTask}
            weights={weights}
            onWeightsChange={setWeights}
            running={state.running}
            finished={state.final !== null || state.fatal !== null}
            onStart={() => void start(task, weights)}
            onReset={() => {
              reset();
              setTask("");
              requestAnimationFrame(() => document.getElementById("task")?.focus());
            }}
          />
        </section>

        <section aria-label="The ring">
          <WrestlingRing
            fighters={state.fighters}
            judging={state.judging}
            winnerModel={state.final?.winnerModel ?? null}
          />
        </section>

        <section aria-label="Tale of the tape">
          <TaleOfTheTape final={state.final} fatal={state.fatal} />
        </section>
      </div>
    </main>
  );
}
