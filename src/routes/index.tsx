import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

import ConstellationBackdrop from "@/components/ConstellationBackdrop";
import GoogleIcon from "@/components/GoogleIcon";
import Wordmark from "@/components/Wordmark";
import { lovable } from "@/integrations/lovable/index";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Agent Royal Rumble — DevFest Hackathon" },
      {
        name: "description",
        content:
          "Agent Royal Rumble: a DevFest hackathon scaffold. Sign in with Google to get started.",
      },
      { property: "og:title", content: "Agent Royal Rumble — DevFest Hackathon" },
      {
        property: "og:description",
        content:
          "Agent Royal Rumble: a DevFest hackathon scaffold. Sign in with Google to get started.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  const [loading, setLoading] = useState(false);

  const signIn = async () => {
    setLoading(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: `${window.location.origin}/arena`,
    });
    if (result.error) {
      setLoading(false);
      return;
    }
    if (result.redirected) return;
    setLoading(false);
  };

  return (
    <main className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-background px-4">
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

      <div className="relative z-10 flex w-full max-w-[95vw] flex-col items-center gap-10">
        <Wordmark text="AGENT ROYAL RUMBLE" />

        <button
          type="button"
          onClick={signIn}
          disabled={loading}
          className="inline-flex items-center gap-3 rounded-full bg-white px-6 py-3 text-sm font-medium text-black shadow-lg transition-transform duration-200 hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-70 sm:text-base"
        >
          <GoogleIcon className="h-5 w-5" />
          {loading ? "Signing in…" : "Sign in with Google"}
        </button>
      </div>
    </main>
  );
}
