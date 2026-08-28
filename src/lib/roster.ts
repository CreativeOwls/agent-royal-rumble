// Single source of truth for the Agent Royal Rumble roster.
// Client-safe: no pricing, no keys. Cost rates live in src/lib/match/rates.server.ts.

export type Vendor = "openai" | "google";

export type Corner = "top-left" | "top-right" | "bottom-left" | "bottom-right";

export interface Competitor {
  /** Gateway model id. */
  readonly modelId: string;
  readonly ringName: string;
  readonly nickname: string;
  /** Public path of the rendered wrestler PNG. */
  readonly image: string;
  /** CSS custom property holding this fighter's dominant colour. */
  readonly accentVar: string;
  /** CSS custom property for the fighter's secondary / glow colour. */
  readonly accentSoftVar: string;
  readonly vendor: Vendor;
  readonly corner: Corner;
}

export const ROSTER: readonly Competitor[] = [
  {
    modelId: "openai/gpt-5.5",
    ringName: "GPT-5.5",
    nickname: "The Frontier",
    image: "/assets/ChatCPT_5_5_Wrestler_.png",
    accentVar: "--fighter-frontier",
    accentSoftVar: "--fighter-frontier-soft",
    vendor: "openai",
    corner: "top-left",
  },
  {
    modelId: "openai/gpt-5.6-sol",
    ringName: "GPT-5.6 Sol",
    nickname: "The Sunbringer",
    image: "/assets/ChatGPT_Sol_Wrestler_.png",
    accentVar: "--fighter-sunbringer",
    accentSoftVar: "--fighter-sunbringer-soft",
    vendor: "openai",
    corner: "top-right",
  },
  {
    modelId: "google/gemini-3.7-flash",
    ringName: "Gemini 3.7 Flash",
    nickname: "The Thunderclap",
    image: "/assets/Geimini_Flash_3_7_Wrestler.png",
    accentVar: "--fighter-thunderclap",
    accentSoftVar: "--fighter-thunderclap-soft",
    vendor: "google",
    corner: "bottom-left",
  },
  {
    modelId: "google/gemini-3.6-flash",
    ringName: "Gemini 3.6 Flash",
    nickname: "The Veteran Blur",
    image: "/assets/Gamini_Flash_3_6_Wrestler.png",
    accentVar: "--fighter-veteran",
    accentSoftVar: "--fighter-veteran-soft",
    vendor: "google",
    corner: "bottom-right",
  },
];

export function competitorById(modelId: string): Competitor | undefined {
  return ROSTER.find((c) => c.modelId === modelId);
}
