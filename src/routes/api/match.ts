import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

import { runMatch } from "@/lib/match/engine.server";
import type { MatchEvent } from "@/lib/match/types";

const bodySchema = z.object({
  task: z.string().trim().min(3).max(4000),
  weights: z.object({
    quality: z.number().min(0).max(100),
    result: z.number().min(0).max(100),
    efficiency: z.number().min(0).max(100),
    cost: z.number().min(0).max(100),
  }),
});

export const Route = createFileRoute("/api/match")({
  server: {
    handlers: {
      POST: async ({ request }) => {
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
