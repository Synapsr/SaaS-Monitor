"use client";

import { useId, useState } from "react";
import { FieldError } from "@/components/ui/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from "@/components/ui/input-group";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { recurringMetric } from "@/lib/display/metric";
import type { Metric } from "@/lib/screens/settings";
import { parseGoal } from "./parse-goal";

/** A goal is typed in the screen's metric: an amount per month, or per year. */
const GOAL_INPUTS: Record<Metric, { period: string; placeholder: string; examples: string }> = {
  mrr: { period: "/ month", placeholder: "10k", examples: "10000 or 10k" },
  arr: { period: "/ year", placeholder: "100k", examples: "100000 or 100k" },
};

export function GoalSettings({
  goal,
  metric,
  currency,
  onChange,
}: {
  goal: number | null;
  metric: Metric;
  currency: string;
  onChange: (goal: number | null) => void;
}) {
  const id = useId();
  const { label } = recurringMetric(metric);
  const { period, placeholder, examples } = GOAL_INPUTS[metric];
  // The mode and the text live apart from the saved goal: text that isn't an amount yet is
  // never saved, the screen keeps its last valid goal meanwhile.
  const [mode, setMode] = useState<"milestones" | "target">(
    goal === null ? "milestones" : "target",
  );
  const [input, setInput] = useState(goal === null ? "" : String(goal));
  const invalid = mode === "target" && input.trim() !== "" && parseGoal(input) === null;

  function selectMode(next: string) {
    const target = next === "target";
    setMode(target ? "target" : "milestones");
    onChange(target ? parseGoal(input) : null);
  }

  function changeInput(value: string) {
    setInput(value);
    const parsed = parseGoal(value);
    if (parsed !== null) onChange(parsed);
  }

  return (
    <RadioGroup value={mode} onValueChange={selectMode} className="gap-3" aria-label="Goal">
      <div className="flex gap-3">
        <RadioGroupItem value="milestones" id={`${id}-milestones`} className="mt-0.5" />
        <div className="flex flex-col gap-0.5">
          <Label htmlFor={`${id}-milestones`}>Automatic milestones</Label>
          <p className="text-sm text-pretty text-muted-foreground">
            Celebrates each round number your {label} crosses on the way up.
          </p>
        </div>
      </div>
      <div className="flex gap-3">
        <RadioGroupItem value="target" id={`${id}-target`} className="mt-0.5" />
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <div className="flex flex-col gap-0.5">
            <Label htmlFor={`${id}-target`}>Custom {label} target</Label>
            <p className="text-sm text-pretty text-muted-foreground">
              Shows how close you are to a goal you pick.
            </p>
          </div>
          {mode === "target" && (
            <>
              <InputGroup className="h-9 max-w-64">
                <InputGroupInput
                  name="goal"
                  aria-label={`${label} target`}
                  inputMode="numeric"
                  autoComplete="off"
                  placeholder={placeholder}
                  value={input}
                  autoFocus={goal === null}
                  onChange={(event) => changeInput(event.target.value)}
                  aria-invalid={invalid}
                  aria-describedby={invalid ? `${id}-error` : undefined}
                  className="tabular-nums"
                />
                <InputGroupAddon align="inline-end">
                  <InputGroupText className="uppercase">{currency}</InputGroupText>
                  <InputGroupText>{period}</InputGroupText>
                </InputGroupAddon>
              </InputGroup>
              {invalid && (
                <FieldError id={`${id}-error`}>Enter an amount, like {examples}.</FieldError>
              )}
            </>
          )}
        </div>
      </div>
    </RadioGroup>
  );
}
