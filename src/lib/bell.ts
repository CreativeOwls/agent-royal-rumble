import bellAsset from "@/assets/bell.mp3.asset.json";

/** Plays the ringside bell. Safe to call anywhere: failures (autoplay policy,
 * SSR, no audio device) are swallowed so the match flow is never interrupted. */
export function playBell(): void {
  if (typeof window === "undefined") return;
  try {
    const audio = new Audio(bellAsset.url);
    audio.volume = 0.6;
    void audio.play().catch(() => undefined);
  } catch {
    // audio is decorative only
  }
}
