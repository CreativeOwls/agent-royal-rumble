import { ROSTER, type Competitor } from "@/lib/roster";
import { GatewayError, runCompetitor } from "./gateway.server";
import { judgeAnswers } from "./referee.server";
import { costUsd } from "./rates.server";
import { efficiencyRaw, normalize, overallScore } from "./scoring";
import type { MatchEvent, MatchFinal, ScoredEntry, Weights } from "./types";

const SYSTEM_PROMPT =
  "You are competing in a live benchmark against other AI models. Answer the user's task directly, " +
  "completely and usefully. No preamble, no meta commentary about being benchmarked. Be concise but complete.";

interface RawRun {
  competitor: Competitor;
  text: string;
  latencyMs: number;
  promptTokens: number;
  completionTokens: number;
  error: string | null;
}

export interface RunMatchOptions {
  task: string;
  weights: Weights;
  userId: string;
  emit: (event: MatchEvent) => void;
  signal?: AbortSignal | undefined;
}

function exhibitionRuns(): RawRun[] {
  return ROSTER.map((competitor, index) => ({
    competitor,
    text:
      `[EXHIBITION MATCH] The gateway was unreachable, so ${competitor.ringName} is shadow-boxing. ` +
      "These numbers are mock data for demo continuity only.",
    latencyMs: 1800 + index * 450,
    promptTokens: 120,
    completionTokens: 260 + index * 40,
    error: null,
  }));
}

export async function runMatch(options: RunMatchOptions): Promise<MatchFinal> {
  const { task, weights, userId, emit, signal } = options;
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const inserted = await supabaseAdmin
    .from("matches")
    .insert({ task, weights: weights as unknown as Record<string, number>, mode: "single", status: "running", created_by: userId })
    .select("id")
    .single();

  if (inserted.error || !inserted.data) {
    throw new Error(inserted.error?.message ?? "Could not open a match record.");
  }
  const matchId = inserted.data.id;
  emit({ type: "start", matchId, task });

  for (const competitor of ROSTER) emit({ type: "state", modelId: competitor.modelId, state: "entrance" });

  let terminal: GatewayError | null = null;

  const runs: RawRun[] = await Promise.all(
    ROSTER.map(async (competitor): Promise<RawRun> => {
      emit({ type: "state", modelId: competitor.modelId, state: "fighting" });
      try {
        const result = await runCompetitor({
          modelId: competitor.modelId,
          vendor: competitor.vendor,
          systemPrompt: SYSTEM_PROMPT,
          task,
          onToken: (text) => emit({ type: "token", modelId: competitor.modelId, text }),
          signal,
        });
        emit({
          type: "metrics",
          modelId: competitor.modelId,
          metrics: {
            modelId: competitor.modelId,
            latencyMs: result.latencyMs,
            promptTokens: result.promptTokens,
            completionTokens: result.completionTokens,
            costUsd: costUsd(competitor.modelId, result.promptTokens, result.completionTokens),
          },
        });
        emit({ type: "state", modelId: competitor.modelId, state: "finished" });
        return { competitor, ...result, error: null };
      } catch (error) {
        const message =
          error instanceof GatewayError
            ? `${error.status}: ${error.message}`
            : error instanceof Error
              ? error.message
              : "Unknown gateway failure";
        if (error instanceof GatewayError && error.terminal) terminal = error;
        emit({ type: "disqualified", modelId: competitor.modelId, message });
        emit({ type: "state", modelId: competitor.modelId, state: "disqualified" });
        return {
          competitor,
          text: "",
          latencyMs: 0,
          promptTokens: 0,
          completionTokens: 0,
          error: message,
        };
      }
    }),
  );

  const terminalError = terminal as GatewayError | null;
  if (terminalError) {
    await supabaseAdmin.from("matches").update({ status: "blocked" }).eq("id", matchId);
    emit({
      type: "fatal",
      message: `Match stopped — the AI gateway returned ${terminalError.status}: ${terminalError.message}`,
    });
    throw terminalError;
  }

  const allFailed = runs.every((r) => r.error !== null);
  const exhibition = allFailed;
  const effectiveRuns = exhibition ? exhibitionRuns() : runs;

  if (exhibition) {
    for (const run of effectiveRuns) {
      emit({ type: "token", modelId: run.competitor.modelId, text: run.text });
      emit({
        type: "metrics",
        modelId: run.competitor.modelId,
        metrics: {
          modelId: run.competitor.modelId,
          latencyMs: run.latencyMs,
          promptTokens: run.promptTokens,
          completionTokens: run.completionTokens,
          costUsd: costUsd(run.competitor.modelId, run.promptTokens, run.completionTokens),
        },
      });
      emit({ type: "state", modelId: run.competitor.modelId, state: "finished" });
    }
  }

  emit({ type: "judging" });

  const finishers = effectiveRuns.filter((r) => r.error === null);
  let verdicts: Record<string, { quality: number; result: number; comment: string }> = {};
  let notes = "";

  if (exhibition) {
    notes = "Exhibition match — scorecard is mock data.";
    finishers.forEach((run, index) => {
      verdicts[run.competitor.modelId] = {
        quality: 90 - index * 7,
        result: 88 - index * 6,
        comment: "Exhibition scoring — not a real judgement.",
      };
    });
  } else {
    try {
      const judged = await judgeAnswers(
        task,
        finishers.map((r) => ({ modelId: r.competitor.modelId, outputText: r.text })),
        signal,
      );
      verdicts = judged.verdicts;
      notes = judged.notes;
    } catch (error) {
      notes =
        "The referee was unavailable, so qualitative scores were neutralised: " +
        (error instanceof Error ? error.message : "unknown error");
      for (const run of finishers) {
        verdicts[run.competitor.modelId] = { quality: 50, result: 50, comment: "Referee unavailable." };
      }
    }
  }

  const effValues = effectiveRuns.map((r) =>
    r.error ? Number.NaN : efficiencyRaw(r.latencyMs, r.completionTokens),
  );
  const costValues = effectiveRuns.map((r) =>
    r.error ? Number.NaN : costUsd(r.competitor.modelId, r.promptTokens, r.completionTokens),
  );
  const efficiencyScores = normalize(effValues, false);
  const costScores = normalize(costValues, false);

  const entries: ScoredEntry[] = effectiveRuns.map((run, index) => {
    const verdict = verdicts[run.competitor.modelId] ?? { quality: 0, result: 0, comment: "" };
    const quality = run.error ? 0 : verdict.quality;
    const result = run.error ? 0 : verdict.result;
    const efficiency = efficiencyScores[index] ?? 0;
    const cost = costScores[index] ?? 0;
    return {
      modelId: run.competitor.modelId,
      outputText: run.text,
      latencyMs: run.latencyMs,
      promptTokens: run.promptTokens,
      completionTokens: run.completionTokens,
      costUsd: costUsd(run.competitor.modelId, run.promptTokens, run.completionTokens),
      quality,
      result,
      efficiency,
      cost,
      overall: run.error ? 0 : overallScore({ quality, result, efficiency, cost }, weights),
      refereeComment: run.error ? "Disqualified before the bell." : verdict.comment,
      errorText: run.error,
    };
  });

  const topEntry = [...entries].sort((a, b) => b.overall - a.overall)[0];
  const winnerModel = topEntry && topEntry.overall > 0 ? topEntry.modelId : null;

  await supabaseAdmin
    .from("matches")
    .update({
      status: "complete",
      winner_model: winnerModel,
      referee_notes: notes,
      exhibition,
    })
    .eq("id", matchId);

  await supabaseAdmin.from("match_entries").insert(
    entries.map((entry) => ({
      match_id: matchId,
      model_id: entry.modelId,
      output_text: entry.outputText,
      latency_ms: entry.latencyMs,
      prompt_tokens: entry.promptTokens,
      completion_tokens: entry.completionTokens,
      cost_usd: entry.costUsd,
      quality_score: entry.quality,
      result_score: entry.result,
      efficiency_score: entry.efficiency,
      cost_score: entry.cost,
      overall_score: entry.overall,
      referee_comment: entry.refereeComment,
      error_text: entry.errorText,
    })),
  );

  const payload: MatchFinal = {
    matchId,
    task,
    weights,
    winnerModel,
    refereeNotes: notes,
    exhibition,
    entries,
  };
  emit({ type: "final", payload });
  return payload;
}
