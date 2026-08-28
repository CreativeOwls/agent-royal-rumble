// Server-only cost table. USD per 1M tokens. Never shipped to the client.
interface Rate {
  input: number;
  output: number;
}

const RATES: Record<string, Rate> = {
  "openai/gpt-5.5": { input: 1.25, output: 10 },
  "openai/gpt-5.6-sol": { input: 1.75, output: 14 },
  "google/gemini-3.7-flash": { input: 0.3, output: 2.5 },
  "google/gemini-3.6-flash": { input: 0.3, output: 2.5 },
};

const FALLBACK: Rate = { input: 1, output: 5 };

export function costUsd(modelId: string, promptTokens: number, completionTokens: number): number {
  const rate = RATES[modelId] ?? FALLBACK;
  const value = (promptTokens / 1_000_000) * rate.input + (completionTokens / 1_000_000) * rate.output;
  return Math.round(value * 1_000_000) / 1_000_000;
}
