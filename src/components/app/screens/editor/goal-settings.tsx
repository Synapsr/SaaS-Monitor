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
import { parseGoal } from "./parse-goal";

export function GoalSettings({
  goal,
  currency,
  onChange,
}: {
  goal: number | null;
  currency: string;
  onChange: (goal: number | null) => void;
}) {
  const id = useId();
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
            Celebrates each round number your MRR crosses on the way up.
          </p>
        </div>
      </div>
      <div className="flex gap-3">
        <RadioGroupItem value="target" id={`${id}-target`} className="mt-0.5" />
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <div className="flex flex-col gap-0.5">
            <Label htmlFor={`${id}-target`}>Custom MRR target</Label>
            <p className="text-sm text-pretty text-muted-foreground">
              Shows how close you are to a goal you pick.
            </p>
          </div>
          {mode === "target" && (
            <>
              <InputGroup className="h-9 max-w-64">
                <InputGroupInput
                  name="goal"
                  aria-label="MRR target"
                  inputMode="numeric"
                  autoComplete="off"
                  placeholder="10k"
                  value={input}
                  autoFocus={goal === null}
                  onChange={(event) => changeInput(event.target.value)}
                  aria-invalid={invalid}
                  aria-describedby={invalid ? `${id}-error` : undefined}
                  className="tabular-nums"
                />
                <InputGroupAddon align="inline-end">
                  <InputGroupText className="uppercase">{currency}</InputGroupText>
                  <InputGroupText>/ month</InputGroupText>
                </InputGroupAddon>
              </InputGroup>
              {invalid && (
                <FieldError id={`${id}-error`}>Enter an amount, like 10000 or 10k.</FieldError>
              )}
            </>
          )}
        </div>
      </div>
    </RadioGroup>
  );
}
