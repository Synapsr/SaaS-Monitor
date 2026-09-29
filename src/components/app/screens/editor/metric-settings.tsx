"use client";

import { RadioGroup as RadioGroupPrimitive } from "radix-ui";
import { useId } from "react";
import { recurringMetric } from "@/lib/display/metric";
import { METRICS, type Metric } from "@/lib/screens/settings";
import { ChoiceCard } from "./choice-card";

const METRIC_NAMES: Record<Metric, string> = {
  mrr: "Monthly recurring revenue",
  arr: "Annual recurring revenue",
};

export function MetricSettings({
  metric,
  onChange,
}: {
  metric: Metric;
  onChange: (metric: Metric) => void;
}) {
  const id = useId();
  return (
    <div className="flex flex-col gap-2.5">
      <RadioGroupPrimitive.Root
        value={metric}
        onValueChange={(value) => onChange(value as Metric)}
        aria-label="Main metric"
        aria-describedby={`${id}-description`}
        className="grid gap-2 sm:grid-cols-2"
      >
        {METRICS.map((option) => {
          const { label } = recurringMetric(option);
          return (
            <ChoiceCard key={option} value={option} title={label} hint={METRIC_NAMES[option]} />
          );
        })}
      </RadioGroupPrimitive.Root>
      <p id={`${id}-description`} className="text-sm text-pretty text-muted-foreground">
        ARR is twelve times MRR. The headline, chart, goal and subscription changes follow the
        metric; payments and revenue stay as they are.
      </p>
    </div>
  );
}
