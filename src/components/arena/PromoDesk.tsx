import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { DEFAULT_WEIGHTS, type Weights } from "@/lib/match/types";
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
  running: boolean;
  onStart: () => void;
  onReset: () => void;
}

export default function PromoDesk({
  task,
  onTaskChange,
  weights,
  onWeightsChange,
  running,
  onStart,
  onReset,
}: Props) {
  const canStart = task.trim().length >= 3 && !running;

  return (
    <section
      aria-labelledby="promo-desk-heading"
      className="rounded-xl border border-arena-panel-edge bg-arena-panel/70 p-5 backdrop-blur sm:p-8"
    >
      <h2 id="promo-desk-heading" className="display-type text-2xl text-foreground sm:text-3xl">
        Promo Desk
      </h2>
      <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
        Cut your promo. Four models take the same task; the referee never sees their names. Set the
        challenge, tune the judging weights, then ring the bell.
      </p>

      <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <div>
      <div className="space-y-2">
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

      <div className="mt-5 flex gap-2">
        <Button onClick={onStart} disabled={!canStart} className="flex-1 bg-gold text-black hover:bg-gold/90">
          {running ? "Match in progress…" : "Ring the bell"}
        </Button>
        <Button variant="outline" onClick={onReset} disabled={running} className="border-arena-panel-edge">
          Clear
        </Button>
      </div>
        </div>

        <fieldset className="rounded-lg border border-arena-panel-edge/60 p-4">
        <legend className="display-type px-1 text-[11px] tracking-widest text-muted-foreground">
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
      </div>
    </section>
  );
}
