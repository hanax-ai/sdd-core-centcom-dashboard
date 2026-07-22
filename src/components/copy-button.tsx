import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export function CopyButton({
  value,
  className,
  label,
}: {
  value: string;
  className?: string;
  label?: string;
}) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        navigator.clipboard.writeText(value);
        setCopied(true);
        setTimeout(() => setCopied(false), 1200);
      }}
      className={cn(
        "inline-flex items-center gap-1 rounded px-1 py-0.5 text-muted-foreground hover:text-foreground hover:bg-surface-2 transition-colors",
        className,
      )}
      aria-label={label ?? `Copy ${value}`}
    >
      {copied ? <Check className="h-3 w-3 text-status-completed" /> : <Copy className="h-3 w-3" />}
    </button>
  );
}
