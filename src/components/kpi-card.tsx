import { Info } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import type { MetricResult } from "@/data/metrics";

export function KpiCard({
  metric,
  hint,
  accent = "primary",
  className,
}: {
  metric: MetricResult;
  hint?: string;
  accent?: "primary" | "completed" | "gate" | "blocked" | "muted";
  className?: string;
}) {
  const ring = {
    primary: "border-primary/30",
    completed: "border-status-completed/40",
    gate: "border-status-gate/40",
    blocked: "border-status-blocked/40",
    muted: "border-border",
  }[accent];

  return (
    <div
      className={cn(
        "relative rounded-lg border bg-card p-4 transition-colors hover:bg-surface-2",
        ring,
        className,
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
          {metric.label}
        </span>
        <Popover>
          <PopoverTrigger className="text-muted-foreground/70 hover:text-foreground transition-colors">
            <Info className="h-3.5 w-3.5" />
          </PopoverTrigger>
          <PopoverContent className="w-72 text-xs" align="end">
            <div className="space-y-1.5">
              <div className="font-semibold text-sm">{metric.label}</div>
              <div className="text-muted-foreground">{metric.formula}</div>
              <div className="pt-1 border-t text-[11px] text-muted-foreground">
                Scope: {metric.scope}
              </div>
              <div className="text-[11px] text-muted-foreground font-mono">
                Observed: {new Date(metric.observedAt).toLocaleString()}
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>
      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-3xl font-semibold tabular-nums tracking-tight">{metric.value}</span>
        {metric.numerator !== undefined && metric.denominator !== undefined && (
          <span className="text-xs text-muted-foreground font-mono">
            {metric.numerator} / {metric.denominator}
          </span>
        )}
      </div>
      {hint && <div className="mt-1 text-xs text-muted-foreground">{hint}</div>}
    </div>
  );
}
