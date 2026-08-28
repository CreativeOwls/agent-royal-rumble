import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

import type { Database } from "@/integrations/supabase/types";

export interface PublicMatchEntry {
  modelId: string;
  outputText: string;
  latencyMs: number;
  promptTokens: number;
  completionTokens: number;
  costUsd: number;
  quality: number;
  result: number;
  efficiency: number;
  cost: number;
  overall: number;
  refereeComment: string;
  errorText: string | null;
}

export interface PublicMatch {
  matchId: string;
  task: string;
  status: string;
  exhibition: boolean;
  winnerModel: string | null;
  refereeNotes: string;
  createdAt: string;
  entries: PublicMatchEntry[];
}

function publicClient() {
  const url = process.env["SUPABASE_URL"];
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"];
  if (!url || !key) throw new Error("The match archive is unavailable right now.");
  return createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { apikey: key } },
  });
}

export const getPublicMatch = createServerFn({ method: "GET" })
  .inputValidator((data) => z.object({ matchId: z.string().uuid() }).parse(data))
  .handler(async ({ data }): Promise<PublicMatch | null> => {
    const client = publicClient();

    const match = await client
      .from("matches")
      .select("id, task, status, exhibition, winner_model, referee_notes, created_at")
      .eq("id", data.matchId)
      .maybeSingle();

    if (match.error) throw new Error(match.error.message);
    if (!match.data) return null;

    const entries = await client
      .from("match_entries")
      .select("*")
      .eq("match_id", data.matchId);

    if (entries.error) throw new Error(entries.error.message);

    return {
      matchId: match.data.id,
      task: match.data.task,
      status: match.data.status,
      exhibition: match.data.exhibition,
      winnerModel: match.data.winner_model,
      refereeNotes: match.data.referee_notes ?? "",
      createdAt: match.data.created_at,
      entries: (entries.data ?? []).map((row) => ({
        modelId: row.model_id,
        outputText: row.output_text ?? "",
        latencyMs: row.latency_ms ?? 0,
        promptTokens: row.prompt_tokens ?? 0,
        completionTokens: row.completion_tokens ?? 0,
        costUsd: row.cost_usd ?? 0,
        quality: row.quality_score ?? 0,
        result: row.result_score ?? 0,
        efficiency: row.efficiency_score ?? 0,
        cost: row.cost_score ?? 0,
        overall: row.overall_score ?? 0,
        refereeComment: row.referee_comment ?? "",
        errorText: row.error_text,
      })),
    };
  });
