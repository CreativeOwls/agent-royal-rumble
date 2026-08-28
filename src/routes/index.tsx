import { createFileRoute, Link } from "@tanstack/react-router";

import ConstellationBackdrop from "@/components/ConstellationBackdrop";
import Wordmark from "@/components/Wordmark";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Agent Royal Rumble — DevFest Hackathon" },
      {
        name: "description",
        content:
          "Agent Royal Rumble: a DevFest hackathon scaffold. Step into the arena and watch four frontier models fight over your task.",
      },
      { property: "og:title", content: "Agent Royal Rumble — DevFest Hackathon" },
      {
        property: "og:description",
        content:
          "Agent Royal Rumble: a DevFest hackathon scaffold. Step into the arena and watch four frontier models fight over your task.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <main className="relative flex min-h-[100svh] w-full items-center justify-center overflow-hidden bg-background px-4 py-10 sm:px-6">
      <ConstellationBackdrop />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{ backgroundImage: "var(--glow-center)" }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{ backgroundImage: "var(--vignette)" }}
      />

      <div className="relative z-10 flex w-full max-w-[1400px] flex-col items-center gap-8 sm:gap-10">
        <Wordmark text="AGENT ROYAL RUMBLE" />

        <Link
          to="/arena"
          className="spice inline-flex items-center gap-3 rounded-full bg-white px-6 py-3 text-sm font-medium text-black shadow-lg transition-transform duration-200 hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:text-base"
        >
          Enter the Arena
        </Link>
      </div>
    </main>
  );
}
