import { cn } from "@/lib/utils";

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  className,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 pb-6 border-b sm:flex-row sm:items-end sm:justify-between",
        className,
      )}
    >
      <div className="min-w-0">
        {eyebrow && (
          <div className="text-[11px] font-medium uppercase tracking-widest text-primary/80 font-mono">
            {eyebrow}
          </div>
        )}
        <h1 className="mt-1 text-2xl sm:text-3xl font-semibold tracking-tight">{title}</h1>
        {description && (
          <p className="mt-1.5 text-sm text-muted-foreground max-w-2xl">{description}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

export function EvidenceLegend() {
  const items = [
    { label: "Verified", tone: "bg-status-completed" },
    { label: "Derived", tone: "bg-status-progress" },
    { label: "Declared", tone: "bg-status-gate" },
    { label: "Unknown", tone: "bg-status-unknown" },
  ];
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-lg border bg-card px-3 py-2 text-xs">
      <span className="text-muted-foreground uppercase tracking-widest text-[10px]">Evidence</span>
      {items.map((i) => (
        <span key={i.label} className="flex items-center gap-1.5">
          <span className={`h-2 w-2 rounded-full ${i.tone}`} />
          {i.label}
        </span>
      ))}
    </div>
  );
}
