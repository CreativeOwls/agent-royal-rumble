import { judgeJson } from "./gateway.server";

export interface RefereeVerdict {
  quality: number;
  result: number;
  comment: string;
}

interface BlindEntry {
  modelId: string;
  outputText: string;
}

function clamp(value: unknown): number {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(100, Math.round(n)));
}

function extractJson(raw: string): unknown {
  const fenced = raw.replace(/```json/gi, "```").split("```");
  const candidate = fenced.length > 1 ? (fenced[1] ?? raw) : raw;
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start === -1 || end === -1) return null;
  try {
    return JSON.parse(candidate.slice(start, end + 1)) as unknown;
  } catch {
    return null;
  }
}

/**
 * Scores every answer blind: labels are shuffled A-D and model names are never shown.
 * Returns a verdict per modelId plus the referee's overall notes.
 */
export async function judgeAnswers(
  task: string,
  entries: BlindEntry[],
  signal?: AbortSignal,
): Promise<{ verdicts: Record<string, RefereeVerdict>; notes: string }> {
  const labels = ["A", "B", "C", "D", "E", "F"];
  const shuffled = [...entries].sort(() => Math.random() - 0.5);
  const labelled = shuffled.map((entry, index) => ({ label: labels[index] ?? `X${index}`, entry }));

  const prompt = [
    "Judge these anonymous answers to a task. You do not know which system wrote which answer.",
    "",
    `TASK:\n${task}`,
    "",
    ...labelled.map(({ label, entry }) => `ANSWER ${label}:\n${entry.outputText.slice(0, 6000)}\n`),
    "",
    "Score each answer 0-100 on two axes:",
    "- quality: correctness, depth, clarity, and craft of the answer.",
    "- result: how well the answer actually delivers the final outcome the task asked for.",
    "Give one short line of commentary per answer, plus one line summarising the field.",
    "",
    "Reply with json in exactly this shape:",
    '{"scores":[{"label":"A","quality":0,"result":0,"comment":""}],"notes":""}',
  ].join("\n");

  const raw = await judgeJson(prompt, signal);
  const parsed = extractJson(raw) as
    | { scores?: Array<{ label?: string; quality?: number; result?: number; comment?: string }>; notes?: string }
    | null;

  const byLabel = new Map<string, { quality: number; result: number; comment: string }>();
  for (const score of parsed?.scores ?? []) {
    if (!score?.label) continue;
    byLabel.set(String(score.label).trim().toUpperCase(), {
      quality: clamp(score.quality),
      result: clamp(score.result),
      comment: String(score.comment ?? "").slice(0, 300),
    });
  }

  const verdicts: Record<string, RefereeVerdict> = {};
  for (const { label, entry } of labelled) {
    const found = byLabel.get(label);
    verdicts[entry.modelId] = found ?? {
      quality: 50,
      result: 50,
      comment: "Referee could not score this answer; neutral score awarded.",
    };
  }

  return { verdicts, notes: String(parsed?.notes ?? "").slice(0, 600) || "The referee turned in a scorecard." };
}
