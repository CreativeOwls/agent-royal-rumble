import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { getRequestUrl } from "@tanstack/react-start/server";

import FighterFigure from "@/components/arena/FighterFigure";
import { competitorById } from "@/lib/roster";
import { getPublicMatch, type PublicMatch } from "@/lib/match/public.functions";

const getSiteOrigin = createServerFn({ method: "GET" }).handler(async () => getRequestUrl().origin);

export const Route = createFileRoute("/match/$matchId")({
  loader: async ({ params }) => {
    const [match, origin] = await Promise.all([
      getPublicMatch({ data: { matchId: params.matchId } }),
      getSiteOrigin(),
    ]);
    if (!match) throw notFound();
    return { match, origin };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return {
        meta: [{ title: "Match unavailable — Agent Royal Rumble" }, { name: "robots", content: "noindex" }],
      };
    }
    const { match, origin } = loaderData;
    const champion = match.winnerModel ? competitorById(match.winnerModel) : undefined;
    const title = champion
      ? `${champion.ringName} took the belt — Agent Royal Rumble`
      : "Match replay — Agent Royal Rumble";
    const description = `"${match.task.slice(0, 140)}" — four frontier models fought over this prompt. ${
      champion ? `${champion.ringName} won the decision.` : "No decision was recorded."
    }`;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "article" },
        { name: "twitter:card", content: "summary_large_image" },
        ...(champion
          ? [
              { property: "og:image", content: new URL(champion.image, origin).toString() },
              { name: "twitter:image", content: new URL(champion.image, origin).toString() },
            ]
          : []),
      ],
    };
  },
  notFoundComponent: MatchNotFound,
  component: MatchReplay,
});

function MatchNotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-arena-floor px-4 text-center">
      <h1 className="display-type text-2xl text-foreground">No such match</h1>
      <p className="text-sm text-muted-foreground">This bout is not in the record books.</p>
      <Link to="/leaderboard" className="text-xs text-gold underline-offset-4 hover:underline">
        See the career leaderboard
      </Link>
    </main>
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

function MatchReplay() {
  const { match } = Route.useLoaderData() as { match: PublicMatch; origin: string };
  const champion = match.winnerModel ? competitorById(match.winnerModel) : undefined;
  const ranked = [...match.entries].sort((a, b) => b.overall - a.overall);

  return (
    <main className="min-h-screen bg-arena-floor px-4 py-10">
      <div className="mx-auto flex max-w-5xl flex-col gap-6">
        <header className="flex items-baseline justify-between gap-4">
          <div>
            <h1 className="display-type text-xl tracking-tight text-foreground sm:text-2xl">
              Match Replay
            </h1>
            <span aria-hidden="true" className="header-rule mt-2 w-32" />
          </div>
          <nav className="flex gap-2 text-xs text-muted-foreground">
            <Link
              to="/leaderboard"
              className="spice rounded-full border border-arena-panel-edge px-3 py-1.5 hover:border-gold hover:text-gold"
            >
              Leaderboard
            </Link>
            <Link
              to="/arena"
              className="spice rounded-full border border-arena-panel-edge px-3 py-1.5 hover:border-gold hover:text-gold"
            >
              Arena
            </Link>
          </nav>
        </header>

        <section className="panel-elevated rounded-2xl border border-arena-panel-edge bg-arena-panel/70 p-5 backdrop-blur">
          <p className="display-type text-[11px] tracking-widest text-muted-foreground">The Prompt</p>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-foreground">{match.task}</p>
          <p className="numeral-type mt-3 text-[10px] text-muted-foreground">{formatDate(match.createdAt)}</p>
          {match.exhibition ? (
            <p className="mt-3 rounded-md border border-gold/40 bg-gold/10 p-2 text-[11px] text-gold">
              Exhibition match — these numbers are mock data.
            </p>
          ) : null}
        </section>

        <section className="anim-belt gold-elevated panel-elevated flex items-center gap-5 rounded-2xl border border-gold/60 bg-gradient-to-r from-gold/15 to-gold/5 p-5 sm:p-6">
          {champion ? (
            <div className="relative h-28 w-24 shrink-0">
              <span
                aria-hidden="true"
                className="fighter-portal fighter-portal-champion"
                style={{ "--accent": `var(${champion.accentVar})` } as React.CSSProperties}
              />
              <FighterFigure
                competitor={champion}
                state="finished"
                isWinner
                className="relative h-full w-full"
              />
            </div>
          ) : null}
          <div>
            <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Belt Holder</p>
            <p className="display-type mt-2 text-3xl tracking-tight text-gold">
              {champion?.ringName ?? "No decision"}
            </p>
            {champion ? <p className="text-xs text-muted-foreground">“{champion.nickname}”</p> : null}
            {match.refereeNotes ? (
              <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">{match.refereeNotes}</p>
            ) : null}
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="display-type text-sm tracking-widest text-foreground">Scorecard &amp; Answers</h2>
          {ranked.map((entry, index) => {
            const competitor = competitorById(entry.modelId);
            return (
              <article
                key={entry.modelId}
                className="panel-elevated rounded-2xl border border-arena-panel-edge bg-arena-panel/60 p-4 sm:p-5"
                style={
                  competitor
                    ? ({
                        "--accent": `var(${competitor.accentVar})`,
                        "--accent-soft": `var(${competitor.accentSoftVar})`,
                        borderColor: "color-mix(in oklab, var(--accent) 45%, transparent)",
                      } as React.CSSProperties)
                    : undefined
                }
              >

                <div className="flex items-center gap-4">
                  {competitor ? (
                    <FighterFigure
                      competitor={competitor}
                      state="finished"
                      className="h-16 w-14 shrink-0"
                    />
                  ) : null}
                  <div className="min-w-0 flex-1">
                    <p className="display-type text-xs" style={{ color: "var(--accent)" }}>
                      <span className="numeral-type mr-2 text-muted-foreground">#{index + 1}</span>
                      {competitor?.ringName ?? entry.modelId}
                    </p>
                    <div className="numeral-type mt-1 flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-muted-foreground">
                      <span>Q {entry.quality.toFixed(0)}</span>
                      <span>R {entry.result.toFixed(0)}</span>
                      <span>E {entry.efficiency.toFixed(0)}</span>
                      <span>C {entry.cost.toFixed(0)}</span>
                      <span>{(entry.latencyMs / 1000).toFixed(1)}s</span>
                      <span>{entry.promptTokens + entry.completionTokens} tok</span>
                      <span>${entry.costUsd.toFixed(5)}</span>
                    </div>
                  </div>
                  <span className="numeral-type text-lg text-gold">{entry.overall.toFixed(1)}</span>
                </div>

                <p className="mt-3 text-[11px] text-muted-foreground">
                  {entry.errorText ? `DQ — ${entry.errorText}` : entry.refereeComment}
                </p>

                {entry.outputText ? (
                  <details className="mt-3">
                    <summary className="cursor-pointer text-[11px] text-muted-foreground hover:text-gold">
                      Read the answer
                    </summary>
                    <pre className="work-stream mt-2 max-h-96 overflow-auto whitespace-pre-wrap p-3">
                      {entry.outputText}
                    </pre>
                  </details>
                ) : null}
              </article>
            );
          })}
        </section>
      </div>
    </main>
  );
}
