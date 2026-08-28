import { useCallback, useRef, useState } from "react";

import { supabase } from "@/integrations/supabase/client";
import { ROSTER } from "@/lib/roster";
import type {
  EntryMetrics,
  FighterState,
  MatchEvent,
  MatchFinal,
  Weights,
} from "@/lib/match/types";

export interface FighterLive {
  state: FighterState;
  output: string;
  metrics: EntryMetrics | null;
  error: string | null;
  startedAt: number | null;
  finishedAt: number | null;
}

export interface MatchLive {
  running: boolean;
  judging: boolean;
  matchId: string | null;
  fatal: string | null;
  final: MatchFinal | null;
  fighters: Record<string, FighterLive>;
}

function blankFighters(): Record<string, FighterLive> {
  return Object.fromEntries(
    ROSTER.map((competitor) => [
      competitor.modelId,
      {
        state: "waiting" as FighterState,
        output: "",
        metrics: null,
        error: null,
        startedAt: null,
        finishedAt: null,
      },
    ]),
  );
}

const initialState: MatchLive = {
  running: false,
  judging: false,
  matchId: null,
  fatal: null,
  final: null,
  fighters: blankFighters(),
};

export function useMatchStream() {
  const [state, setState] = useState<MatchLive>(initialState);
  const abortRef = useRef<AbortController | null>(null);

  const apply = useCallback((event: MatchEvent) => {
    setState((prev) => {
      const fighters = { ...prev.fighters };
      const patch = (modelId: string, next: Partial<FighterLive>) => {
        const current = fighters[modelId];
        if (!current) return;
        fighters[modelId] = { ...current, ...next };
      };

      switch (event.type) {
        case "start":
          return { ...prev, matchId: event.matchId, fighters };
        case "state":
          patch(event.modelId, {
            state: event.state,
            ...(event.state === "fighting" ? { startedAt: Date.now() } : {}),
            ...(event.state === "finished" || event.state === "disqualified"
              ? { finishedAt: Date.now() }
              : {}),
          });
          return { ...prev, fighters };
        case "token":
          patch(event.modelId, { output: (fighters[event.modelId]?.output ?? "") + event.text });
          return { ...prev, fighters };
        case "metrics":
          patch(event.modelId, { metrics: event.metrics });
          return { ...prev, fighters };
        case "disqualified":
          patch(event.modelId, { error: event.message });
          return { ...prev, fighters };
        case "judging":
          return { ...prev, judging: true };
        case "final":
          return { ...prev, judging: false, running: false, final: event.payload };
        case "fatal":
          return { ...prev, judging: false, running: false, fatal: event.message };
        default:
          return prev;
      }
    });
  }, []);

  const start = useCallback(
    async (task: string, weights: Weights) => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setState({ ...initialState, fighters: blankFighters(), running: true });

      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (!token) {
        setState((prev) => ({ ...prev, running: false, fatal: "Your session expired. Sign in again." }));
        return;
      }

      let response: Response;
      try {
        response = await fetch("/api/match", {
          method: "POST",
          headers: { "content-type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ task, weights }),
          signal: controller.signal,
        });
      } catch (error) {
        setState((prev) => ({
          ...prev,
          running: false,
          fatal: error instanceof Error ? error.message : "The arena could not be reached.",
        }));
        return;
      }

      if (!response.ok || !response.body) {
        setState((prev) => ({
          ...prev,
          running: false,
          fatal: `The arena rejected the match (${response.status}).`,
        }));
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const chunks = buffer.split("\n\n");
          buffer = chunks.pop() ?? "";
          for (const chunk of chunks) {
            const line = chunk.trim();
            if (!line.startsWith("data:")) continue;
            try {
              apply(JSON.parse(line.slice(5).trim()) as MatchEvent);
            } catch {
              // ignore malformed frames rather than killing the live match
            }
          }
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          setState((prev) => ({
            ...prev,
            running: false,
            fatal: error instanceof Error ? error.message : "The match stream dropped.",
          }));
        }
      }

      setState((prev) => (prev.running ? { ...prev, running: false } : prev));
    },
    [apply],
  );

  const reset = useCallback(() => {
    abortRef.current?.abort();
    setState({ ...initialState, fighters: blankFighters() });
  }, []);

  return { state, start, reset };
}
