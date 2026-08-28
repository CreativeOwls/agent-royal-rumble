import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { DEFAULT_WEIGHTS, type MatchMode, type Weights } from "@/lib/match/types";
import { cn } from "@/lib/utils";

const SAMPLE_TASKS = [
  "Write a 120-word cold email that books a demo with a Series A CTO.",
  "Explain vector databases to a product manager in under 150 words.",
  "Draft a SQL query plan for finding weekly active users from an events table.",
];

const WEIGHT_FIELDS: Array<{ key: keyof Weights; label: string; hint: string }> = [
  { key: "quality", label: "Quality", hint: "Craft, depth, correctness" },
  { key: "result", label: "Result", hint: "Did it deliver the outcome" },
  { key: "efficiency", label: "Efficiency", hint: "Speed and tokens spent" },
  { key: "cost", label: "Cost", hint: "Real USD burned" },
];

interface Props {
  task: string;
  onTaskChange: (value: string) => void;
  weights: Weights;
  onWeightsChange: (value: Weights) => void;
  mode: MatchMode;
  onModeChange: (value: MatchMode) => void;
  running: boolean;
  onStart: () => void;
  onReset: () => void;
}

export default function PromoDesk({
  task,
  onTaskChange,
  weights,
  onWeightsChange,
  mode,
  onModeChange,
  running,
  onStart,
  onReset,
}: Props) {
  const canStart = task.trim().length >= 3 && !running;

  return (
    <section
      aria-labelledby="promo-desk-heading"
      className="rounded-xl border border-arena-panel-edge bg-arena-panel/70 p-5 backdrop-blur"
    >
      <h2 id="promo-desk-heading" className="display-type text-lg text-foreground">
        Promo Desk
      </h2>
      <p className="mt-1 text-xs text-muted-foreground">
        Cut your promo. Four models take the same task; the referee never sees their names.
      </p>

      <div className="mt-4 space-y-2">
        <Label htmlFor="task" className="display-type text-[11px] tracking-widest text-muted-foreground">
          The Challenge
        </Label>
        <Textarea
          id="task"
          value={task}
          onChange={(event) => onTaskChange(event.target.value)}
          placeholder="Describe the task the models must fight over…"
          rows={4}
          maxLength={4000}
          className="resize-none border-arena-panel-edge bg-arena-floor text-foreground placeholder:text-muted-foreground/60"
        />
        <div className="flex flex-wrap gap-1.5">
          {SAMPLE_TASKS.map((sample) => (
            <button
              key={sample}
              type="button"
              onClick={() => onTaskChange(sample)}
              className="rounded-full border border-arena-panel-edge px-2.5 py-1 text-[10px] text-muted-foreground transition-colors hover:border-gold hover:text-gold"
            >
              {sample.slice(0, 38)}…
            </button>
          ))}
        </div>
      </div>

      <fieldset className="mt-5">
        <legend className="display-type text-[11px] tracking-widest text-muted-foreground">
          Judging Weights
        </legend>
        <div className="mt-3 space-y-4">
          {WEIGHT_FIELDS.map((field) => (
            <div key={field.key}>
              <div className="flex items-baseline justify-between">
                <Label htmlFor={`w-${field.key}`} className="text-xs text-foreground">
                  {field.label}
                  <span className="ml-2 text-[10px] text-muted-foreground">{field.hint}</span>
                </Label>
                <span className="numeral-type text-xs text-gold">{weights[field.key]}</span>
              </div>
              <Slider
                id={`w-${field.key}`}
                value={[weights[field.key]]}
                min={0}
                max={100}
                step={5}
                disabled={running}
                onValueChange={([next]) =>
                  onWeightsChange({ ...weights, [field.key]: next ?? 0 })
                }
                className="mt-2"
              />
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() => onWeightsChange(DEFAULT_WEIGHTS)}
          className="mt-3 text-[10px] text-muted-foreground underline-offset-4 hover:underline"
        >
          Reset weights
        </button>
      </fieldset>

      <div className="mt-5">
        <span className="display-type text-[11px] tracking-widest text-muted-foreground">Match Type</span>
        <div className="mt-2 grid grid-cols-2 gap-2" role="radiogroup" aria-label="Match type">
          {(["single", "tournament"] as const).map((option) => (
            <button
              key={option}
              type="button"
              role="radio"
              aria-checked={mode === option}
              disabled={running}
              onClick={() => onModeChange(option)}
              className={cn(
                "rounded-md border px-3 py-2 text-xs transition-colors",
                mode === option
                  ? "border-gold bg-gold/10 text-gold"
                  : "border-arena-panel-edge text-muted-foreground hover:text-foreground",
              )}
            >
              {option === "single" ? "Royal Rumble" : "Bracket Tournament"}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-5 flex gap-2">
        <Button onClick={onStart} disabled={!canStart} className="flex-1 bg-gold text-black hover:bg-gold/90">
          {running ? "Match in progress…" : "Ring the bell"}
        </Button>
        <Button variant="outline" onClick={onReset} disabled={running} className="border-arena-panel-edge">
          Clear
        </Button>
      </div>
    </section>
  );
}
