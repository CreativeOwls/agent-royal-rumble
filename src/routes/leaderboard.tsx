import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";

import FighterFigure from "@/components/arena/FighterFigure";
import { useAuthSession } from "@/hooks/useAuthSession";
import { supabase } from "@/integrations/supabase/client";
import { ROSTER, competitorById } from "@/lib/roster";

export const Route = createFileRoute("/leaderboard")({
  head: () => ({
    meta: [
      { title: "Career Leaderboard — Agent Royal Rumble" },
      {
        name: "description",
        content:
          "Career records for every model in the Agent Royal Rumble: wins, win rate, average scores and total cost across every prompt ever fought over.",
      },
      { property: "og:title", content: "Career Leaderboard — Agent Royal Rumble" },
      {
        property: "og:description",
        content: "Who took the belt for which prompt? Career wins, scores and spend for all four fighters.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LeaderboardPage,
});

interface MatchRow {
  id: string;
  task: string;
  winner_model: string | null;
  created_at: string;
}

interface EntryRow {
  match_id: string;
  model_id: string;
  cost_usd: number | null;
  quality_score: number | null;
  result_score: number | null;
  efficiency_score: number | null;
  cost_score: number | null;
  overall_score: number | null;
}

interface CareerRow {
  modelId: string;
  wins: number;
  matches: number;
  winRate: number;
  avgOverall: number;
  avgQuality: number;
  avgResult: number;
  avgEfficiency: number;
  avgCost: number;
  totalCostUsd: number;
}

function mean(values: number[]) {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function buildCareer(matches: MatchRow[], entries: EntryRow[]): CareerRow[] {
  const winsByModel = new Map<string, number>();
  for (const match of matches) {
    if (!match.winner_model) continue;
    winsByModel.set(match.winner_model, (winsByModel.get(match.winner_model) ?? 0) + 1);
  }

  return ROSTER.map((competitor) => {
    const own = entries.filter((entry) => entry.model_id === competitor.modelId);
    const wins = winsByModel.get(competitor.modelId) ?? 0;
    return {
      modelId: competitor.modelId,
      wins,
      matches: own.length,
      winRate: own.length ? (wins / own.length) * 100 : 0,
      avgOverall: mean(own.map((e) => e.overall_score ?? 0)),
      avgQuality: mean(own.map((e) => e.quality_score ?? 0)),
      avgResult: mean(own.map((e) => e.result_score ?? 0)),
      avgEfficiency: mean(own.map((e) => e.efficiency_score ?? 0)),
      avgCost: mean(own.map((e) => e.cost_score ?? 0)),
      totalCostUsd: own.reduce((sum, e) => sum + (e.cost_usd ?? 0), 0),
    };
  }).sort((a, b) => b.wins - a.wins || b.avgOverall - a.avgOverall);
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { dateStyle: "medium" });
}

function LeaderboardPage() {
  const { session, loading } = useAuthSession();
  const navigate = useNavigate();
  const [matches, setMatches] = useState<MatchRow[] | null>(null);
  const [entries, setEntries] = useState<EntryRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !session) void navigate({ to: "/" });
  }, [loading, session, navigate]);

  useEffect(() => {
    if (!session) return;
    let active = true;

    void (async () => {
      const [matchRes, entryRes] = await Promise.all([
        supabase
          .from("matches")
          .select("id, task, winner_model, created_at")
          .order("created_at", { ascending: false }),
        supabase
          .from("match_entries")
          .select(
            "match_id, model_id, cost_usd, quality_score, result_score, efficiency_score, cost_score, overall_score",
          ),
      ]);
      if (!active) return;
      if (matchRes.error || entryRes.error) {
        setError(matchRes.error?.message ?? entryRes.error?.message ?? "Could not load the record books.");
        return;
      }
      setMatches(matchRes.data ?? []);
      setEntries(entryRes.data ?? []);
    })();

    return () => {
      active = false;
    };
  }, [session]);

  const career = useMemo(
    () => (matches && entries ? buildCareer(matches, entries) : []),
    [matches, entries],
  );
  const recent = useMemo(() => (matches ?? []).slice(0, 12), [matches]);

  if (loading || !session) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-arena-floor">
        <p className="numeral-type text-xs text-muted-foreground">Checking your ringside pass…</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-arena-floor px-4 py-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-8">
        <header className="flex flex-wrap items-baseline justify-between gap-3">
          <div>
            <h1 className="display-type text-xl tracking-tight text-foreground sm:text-2xl">
              Career Leaderboard
            </h1>
            <span aria-hidden="true" className="header-rule mt-2 w-40" />
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Every prompt ever fought over, and the model that took the belt for it.
            </p>
          </div>
          <nav className="flex gap-2 text-xs text-muted-foreground">
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

        {error ? (
          <p className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-xs text-destructive">
            {error}
          </p>
        ) : null}

        <section aria-labelledby="career-heading" className="space-y-4">
          <h2 id="career-heading" className="display-type text-sm tracking-widest text-foreground">
            Career Records
          </h2>


          {!matches ? (
            <p className="numeral-type text-xs text-muted-foreground">Pulling the record books…</p>
          ) : (
            career.map((row, index) => {
              const competitor = competitorById(row.modelId);
              const isChampion = index === 0 && row.wins > 0;
              return (
                <article
                  key={row.modelId}
                  className={
                    isChampion
                      ? "panel-elevated gold-elevated rounded-2xl border bg-gradient-to-r from-gold/10 to-transparent p-4 sm:p-5"
                      : "panel-elevated rounded-2xl border bg-arena-panel/60 p-4 sm:p-5"
                  }
                  style={
                    competitor
                      ? ({
                          "--accent": `var(${competitor.accentVar})`,
                          "--accent-soft": `var(${competitor.accentSoftVar})`,
                          borderColor: isChampion
                            ? "var(--gold)"
                            : "color-mix(in oklab, var(--accent) 45%, transparent)",
                        } as React.CSSProperties)
                      : undefined
                  }
                >
                  <div className="flex flex-wrap items-center gap-4">
                    {competitor ? (
                      <div className="relative h-20 w-16 shrink-0">
                        <span
                          aria-hidden="true"
                          className={
                            isChampion ? "fighter-portal fighter-portal-champion" : "fighter-portal"
                          }
                        />
                        <FighterFigure
                          competitor={competitor}
                          state="finished"
                          isWinner={isChampion}
                          className="relative h-full w-full"
                        />
                      </div>
                    ) : null}


                    <div className="min-w-[9rem] flex-1">
                      <p className="display-type text-sm" style={{ color: "var(--accent)" }}>
                        {competitor?.ringName ?? row.modelId}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {competitor ? `“${competitor.nickname}”` : null}
                      </p>
                      {isChampion ? (
                        <p className="display-type mt-1 text-[10px] tracking-widest text-gold">
                          Reigning belt holder
                        </p>
                      ) : null}
                    </div>

                    <dl className="numeral-type grid flex-1 grid-cols-3 gap-3 text-[11px] text-muted-foreground sm:grid-cols-6">
                      <div>
                        <dt className="text-[9px] uppercase tracking-widest">Wins</dt>
                        <dd className="text-base text-gold">{row.wins}</dd>
                      </div>
                      <div>
                        <dt className="text-[9px] uppercase tracking-widest">Matches</dt>
                        <dd className="text-base text-foreground">{row.matches}</dd>
                      </div>
                      <div>
                        <dt className="text-[9px] uppercase tracking-widest">Win rate</dt>
                        <dd className="text-base text-foreground">{row.winRate.toFixed(0)}%</dd>
                      </div>
                      <div>
                        <dt className="text-[9px] uppercase tracking-widest">Avg overall</dt>
                        <dd className="text-base text-foreground">{row.avgOverall.toFixed(1)}</dd>
                      </div>
                      <div>
                        <dt className="text-[9px] uppercase tracking-widest">Q / R / E / C</dt>
                        <dd className="text-foreground">
                          {row.avgQuality.toFixed(0)} / {row.avgResult.toFixed(0)} /{" "}
                          {row.avgEfficiency.toFixed(0)} / {row.avgCost.toFixed(0)}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-[9px] uppercase tracking-widest">Total spend</dt>
                        <dd className="text-foreground">${row.totalCostUsd.toFixed(5)}</dd>
                      </div>
                    </dl>
                  </div>
                </article>
              );
            })
          )}
        </section>

        <section aria-labelledby="recent-heading" className="space-y-3">
          <h2 id="recent-heading" className="display-type text-sm text-foreground">
            Recent Prompts &amp; Their Champions
          </h2>

          {matches && recent.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              No matches on the card yet.{" "}
              <Link to="/arena" className="text-gold underline-offset-4 hover:underline">
                Ring the bell in the Arena.
              </Link>
            </p>
          ) : null}

          <ul className="grid gap-3 md:grid-cols-2">
            {recent.map((match) => {
              const champion = match.winner_model ? competitorById(match.winner_model) : undefined;
              return (
                <li key={match.id}>
                  <Link
                    to="/match/$matchId"
                    params={{ matchId: match.id }}
                    className="flex h-full gap-4 rounded-xl border border-arena-panel-edge bg-arena-panel/60 p-4 transition-colors hover:border-gold"
                    style={
                      champion
                        ? ({
                            "--accent": `var(${champion.accentVar})`,
                            "--accent-soft": `var(${champion.accentSoftVar})`,
                          } as React.CSSProperties)
                        : undefined
                    }
                  >
                    {champion ? (
                      <FighterFigure
                        competitor={champion}
                        state="finished"
                        className="h-20 w-14 shrink-0"
                      />
                    ) : null}
                    <div className="min-w-0">
                      <p className="display-type text-[10px] tracking-widest text-muted-foreground">
                        The Prompt
                      </p>
                      <p className="mt-1 line-clamp-3 text-sm text-foreground">{match.task}</p>
                      <p className="mt-2 text-[11px] text-muted-foreground">
                        Belt:{" "}
                        <span className="display-type text-gold">
                          {champion?.ringName ?? match.winner_model ?? "No decision"}
                        </span>
                      </p>
                      <p className="numeral-type mt-1 text-[10px] text-muted-foreground">
                        {formatDate(match.created_at)}
                      </p>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      </div>
    </main>
  );
}
