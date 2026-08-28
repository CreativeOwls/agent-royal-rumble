import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

import { runMatch } from "@/lib/match/engine.server";
import type { MatchEvent } from "@/lib/match/types";

const bodySchema = z.object({
  task: z.string().trim().min(3).max(4000),
  mode: z.enum(["single", "tournament"]),
  weights: z.object({
    quality: z.number().min(0).max(100),
    result: z.number().min(0).max(100),
    efficiency: z.number().min(0).max(100),
    cost: z.number().min(0).max(100),
  }),
});

async function authenticate(request: Request): Promise<string | null> {
  const header = request.headers.get("Authorization");
  const token = header?.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return null;

  const url = process.env["SUPABASE_URL"];
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"];
  if (!url || !key) return null;

  const client = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { apikey: key } },
  });
  const { data, error } = await client.auth.getUser(token);
  if (error || !data.user) return null;
  return data.user.id;
}

export const Route = createFileRoute("/api/match")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const userId = await authenticate(request);
        if (!userId) return new Response("Unauthorized", { status: 401 });

        const parsed = bodySchema.safeParse(await request.json().catch(() => null));
        if (!parsed.success) {
          return new Response(JSON.stringify({ error: "Invalid match request." }), {
            status: 400,
            headers: { "content-type": "application/json" },
          });
        }

        const encoder = new TextEncoder();
        const stream = new ReadableStream<Uint8Array>({
          async start(controller) {
            let closed = false;
            const send = (event: MatchEvent) => {
              if (closed) return;
              controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
            };

            try {
              await runMatch({
                task: parsed.data.task,
                weights: parsed.data.weights,
                mode: parsed.data.mode,
                userId,
                emit: send,
              });
            } catch (error) {
              send({
                type: "fatal",
                message: error instanceof Error ? error.message : "The match could not be completed.",
              });
            } finally {
              closed = true;
              controller.close();
            }
          },
        });

        return new Response(stream, {
          headers: {
            "content-type": "text/event-stream",
            "cache-control": "no-cache, no-transform",
            connection: "keep-alive",
          },
        });
      },
    },
  },
});
