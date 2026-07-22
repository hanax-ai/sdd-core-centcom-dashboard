import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import type { WorkStatus } from "@/data/types";

const badge = cva(
  "inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium border tabular-nums",
  {
    variants: {
      tone: {
        completed: "bg-status-completed/12 text-status-completed border-status-completed/30",
        progress: "bg-status-progress/12 text-status-progress border-status-progress/30",
        gate: "bg-status-gate/15 text-status-gate border-status-gate/30",
        blocked: "bg-status-blocked/15 text-status-blocked border-status-blocked/30",
        deferred: "bg-status-deferred/12 text-status-deferred border-status-deferred/25",
        unknown: "bg-muted text-muted-foreground border-border",
      },
    },
    defaultVariants: { tone: "unknown" },
  },
);

const map: Record<WorkStatus, { label: string; tone: VariantProps<typeof badge>["tone"] }> = {
  "not-started": { label: "Not started", tone: "deferred" },
  "in-progress": { label: "In progress", tone: "progress" },
  "awaiting-decision": { label: "Awaiting decision", tone: "gate" },
  "awaiting-gate-1": { label: "Awaiting Gate 1", tone: "gate" },
  "awaiting-gate-2": { label: "Awaiting Gate 2", tone: "gate" },
  blocked: { label: "Blocked", tone: "blocked" },
  completed: { label: "Completed", tone: "completed" },
  deferred: { label: "Deferred", tone: "deferred" },
  invalidated: { label: "Invalidated", tone: "blocked" },
};

export function StatusBadge({ status, className }: { status: WorkStatus; className?: string }) {
  const m = map[status];
  return (
    <span className={cn(badge({ tone: m.tone }), className)}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {m.label}
    </span>
  );
}

export function SeverityBadge({ severity }: { severity: "critical" | "high" | "medium" | "low" }) {
  const tone =
    severity === "critical" || severity === "high"
      ? "blocked"
      : severity === "medium"
        ? "gate"
        : "deferred";
  return (
    <span className={badge({ tone })}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {severity.toUpperCase()}
    </span>
  );
}

export function ConfidenceChip({
  confidence,
}: {
  confidence: "verified" | "derived" | "declared" | "unknown";
}) {
  const tone =
    confidence === "verified"
      ? "completed"
      : confidence === "derived"
        ? "progress"
        : confidence === "declared"
          ? "gate"
          : "unknown";
  return <span className={badge({ tone })}>{confidence}</span>;
}

export function FreshnessPill({
  freshness,
}: {
  freshness: "fresh" | "aging" | "stale" | "partial";
}) {
  const tone =
    freshness === "fresh"
      ? "completed"
      : freshness === "aging"
        ? "gate"
        : freshness === "partial"
          ? "progress"
          : "blocked";
  return (
    <span className={cn(badge({ tone }), "uppercase tracking-wider text-[10px]")}>
      <span className="h-1.5 w-1.5 rounded-full bg-current animate-pulse" />
      {freshness}
    </span>
  );
}
