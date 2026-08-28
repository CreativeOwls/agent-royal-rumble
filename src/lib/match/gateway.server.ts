// Server-only Lovable AI Gateway access. Keys never leave this module.
const GATEWAY = "https://ai.gateway.lovable.dev/v1";

export class GatewayError extends Error {
  readonly status: number;
  /** Terminal = no retry, and the whole match must stop (credits / policy / config). */
  readonly terminal: boolean;

  constructor(status: number, message: string) {
    super(message);
    this.name = "GatewayError";
    this.status = status;
    this.terminal = status === 401 || status === 402 || status === 403;
  }
}

function apiKey(): string {
  const key = process.env["LOVABLE_API_KEY"];
  if (!key) throw new GatewayError(401, "LOVABLE_API_KEY is not configured for this project.");
  return key;
}

async function readErrorMessage(res: Response): Promise<string> {
  const body = await res.text().catch(() => "");
  try {
    const parsed = JSON.parse(body) as { error?: { message?: string }; message?: string };
    return parsed.error?.message ?? parsed.message ?? body.slice(0, 300) ?? res.statusText;
  } catch {
    return body.slice(0, 300) || res.statusText;
  }
}

/** Iterate `data:` payloads of an SSE response body. */
async function* sseLines(res: Response): AsyncGenerator<string> {
  const reader = res.body?.getReader();
  if (!reader) return;
  const decoder = new TextDecoder();
  let buffer = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const parts = buffer.split("\n");
    buffer = parts.pop() ?? "";
    for (const line of parts) {
      const trimmed = line.trim();
      if (!trimmed.startsWith("data:")) continue;
      const payload = trimmed.slice(5).trim();
      if (payload && payload !== "[DONE]") yield payload;
    }
  }
}

export interface RunResult {
  text: string;
  latencyMs: number;
  promptTokens: number;
  completionTokens: number;
}

export interface RunOptions {
  modelId: string;
  vendor: "openai" | "google";
  systemPrompt: string;
  task: string;
  onToken: (text: string) => void;
  signal?: AbortSignal | undefined;
}

/** Runs one competitor for real, streaming its output tokens through `onToken`. */
export async function runCompetitor(options: RunOptions): Promise<RunResult> {
  const started = Date.now();
  const headers = {
    "Content-Type": "application/json",
    "Lovable-API-Key": apiKey(),
    "X-Lovable-AIG-SDK": "fetch",
  };

  const isOpenAI = options.vendor === "openai";
  const url = isOpenAI ? `${GATEWAY}/responses` : `${GATEWAY}/chat/completions`;
  const body = isOpenAI
    ? {
        model: options.modelId,
        stream: true,
        instructions: options.systemPrompt,
        input: options.task,
      }
    : {
        model: options.modelId,
        stream: true,
        stream_options: { include_usage: true },
        messages: [
          { role: "system", content: options.systemPrompt },
          { role: "user", content: options.task },
        ],
      };

  const res = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
    signal: options.signal ?? null,
  });

  if (!res.ok) throw new GatewayError(res.status, await readErrorMessage(res));

  let text = "";
  let promptTokens = 0;
  let completionTokens = 0;

  for await (const payload of sseLines(res)) {
    let event: Record<string, unknown>;
    try {
      event = JSON.parse(payload) as Record<string, unknown>;
    } catch {
      continue;
    }

    if (isOpenAI) {
      const type = event["type"];
      if (type === "response.output_text.delta") {
        const delta = String(event["delta"] ?? "");
        if (delta) {
          text += delta;
          options.onToken(delta);
        }
      } else if (type === "response.completed" || type === "response.incomplete") {
        const response = event["response"] as { usage?: Record<string, number> } | undefined;
        promptTokens = response?.usage?.["input_tokens"] ?? promptTokens;
        completionTokens = response?.usage?.["output_tokens"] ?? completionTokens;
      } else if (type === "error") {
        throw new GatewayError(502, String(event["message"] ?? "Gateway stream error"));
      }
    } else {
      const choices = event["choices"] as Array<{ delta?: { content?: string } }> | undefined;
      const delta = choices?.[0]?.delta?.content;
      if (delta) {
        text += delta;
        options.onToken(delta);
      }
      const usage = event["usage"] as Record<string, number> | undefined;
      if (usage) {
        promptTokens = usage["prompt_tokens"] ?? promptTokens;
        completionTokens = usage["completion_tokens"] ?? completionTokens;
      }
    }
  }

  if (!text.trim()) throw new GatewayError(502, "Competitor returned an empty answer.");

  // Fall back to a character estimate only if the provider omitted usage.
  if (completionTokens === 0) completionTokens = Math.max(1, Math.round(text.length / 4));
  if (promptTokens === 0) promptTokens = Math.max(1, Math.round((options.task.length + options.systemPrompt.length) / 4));

  return { text, latencyMs: Date.now() - started, promptTokens, completionTokens };
}

/** Non-streaming JSON call used by the referee (short, bounded output). */
export async function judgeJson(prompt: string, signal?: AbortSignal): Promise<string> {
  const res = await fetch(`${GATEWAY}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Lovable-API-Key": apiKey(),
      "X-Lovable-AIG-SDK": "fetch",
    },
    body: JSON.stringify({
      model: "google/gemini-3.7-flash",
      messages: [
        {
          role: "system",
          content:
            "You are a strict, neutral benchmark referee. You reply with json only, no prose, no markdown fences.",
        },
        { role: "user", content: prompt },
      ],
    }),
    signal: signal ?? null,
  });

  if (!res.ok) throw new GatewayError(res.status, await readErrorMessage(res));
  const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
  return data.choices?.[0]?.message?.content ?? "";
}
