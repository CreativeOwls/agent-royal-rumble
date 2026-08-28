import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";

import PromoDesk from "@/components/arena/PromoDesk";
import TaleOfTheTape from "@/components/arena/TaleOfTheTape";
import WrestlingRing from "@/components/arena/WrestlingRing";
import GoogleIcon from "@/components/GoogleIcon";
import { useAuthSession } from "@/hooks/useAuthSession";
import { useMatchStream } from "@/hooks/useMatchStream";
import { lovable } from "@/integrations/lovable/index";
import { DEFAULT_WEIGHTS, type Weights } from "@/lib/match/types";

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
  const { session, loading } = useAuthSession();
  const { state, start, reset } = useMatchStream();
  const [task, setTask] = useState("");
  const [weights, setWeights] = useState<Weights>(DEFAULT_WEIGHTS);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-arena-floor">
        <p className="numeral-type text-xs text-muted-foreground">Checking your ringside pass…</p>
      </main>
    );
  }

  if (!session) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-arena-floor px-4 text-center">
        <h1 className="display-type text-3xl text-foreground">Ringside pass required</h1>
        <p className="max-w-md text-sm text-muted-foreground">
          Sign in to start a match. Results are saved to your account and shareable afterwards.
        </p>
        <button
          type="button"
          onClick={() =>
            lovable.auth.signInWithOAuth("google", { redirect_uri: `${window.location.origin}/arena` })
          }
          className="inline-flex items-center gap-3 rounded-full bg-white px-6 py-3 text-sm font-medium text-black transition-transform hover:scale-105"
        >
          <GoogleIcon className="h-5 w-5" />
          Sign in with Google
        </button>
        <Link to="/" className="text-xs text-muted-foreground underline-offset-4 hover:underline">
          Back to the marquee
        </Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-arena-floor px-4 py-8">
      <header className="mx-auto mb-6 flex max-w-7xl items-baseline justify-between">
        <h1 className="display-type text-xl text-foreground sm:text-2xl">Agent Royal Rumble — Arena</h1>
        <Link to="/" className="text-xs text-muted-foreground underline-offset-4 hover:underline">
          Home
        </Link>
      </header>

      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <section aria-label="Promo desk">
          <PromoDesk
            task={task}
            onTaskChange={setTask}
            weights={weights}
            onWeightsChange={setWeights}
            running={state.running}
            onStart={() => void start(task, weights)}
            onReset={() => {
              reset();
              setTask("");
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
