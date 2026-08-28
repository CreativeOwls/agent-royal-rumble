export type MatchMode = "single" | "tournament";

export type FighterState =
  | "waiting"
  | "entrance"
  | "fighting"
  | "finished"
  | "disqualified";

export interface Weights {
  quality: number;
  result: number;
  efficiency: number;
  cost: number;
}

export const DEFAULT_WEIGHTS: Weights = {
  quality: 35,
  result: 35,
  efficiency: 15,
  cost: 15,
};

export interface EntryMetrics {
  modelId: string;
  latencyMs: number;
  promptTokens: number;
  completionTokens: number;
  costUsd: number;
}

export interface ScoredEntry extends EntryMetrics {
  outputText: string;
  quality: number;
  result: number;
  efficiency: number;
  cost: number;
  overall: number;
  refereeComment: string;
  errorText: string | null;
}

export interface BracketRound {
  label: string;
  a: string;
  b: string;
  winner: string | null;
}

export interface MatchFinal {
  matchId: string;
  task: string;
  mode: MatchMode;
  weights: Weights;
  winnerModel: string | null;
  refereeNotes: string;
  exhibition: boolean;
  entries: ScoredEntry[];
  bracket: BracketRound[] | null;
}

export type MatchEvent =
  | { type: "start"; matchId: string; task: string; mode: MatchMode }
  | { type: "state"; modelId: string; state: FighterState }
  | { type: "token"; modelId: string; text: string }
  | { type: "metrics"; modelId: string; metrics: EntryMetrics }
  | { type: "disqualified"; modelId: string; message: string }
  | { type: "judging" }
  | { type: "final"; payload: MatchFinal }
  | { type: "fatal"; message: string };
