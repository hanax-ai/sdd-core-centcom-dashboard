import { createFileRoute } from "@tanstack/react-router";
import { AlertTriangle, Database, ExternalLink } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/page-chrome";
import { FreshnessPill } from "@/components/status-badges";
import { useDataView } from "@/data/scenario-context";

export const Route = createFileRoute("/sources")({
  head: () => ({
    meta: [
      { title: "Data Sources · SDD-Core SITREP — Situation Report" },
      {
        name: "description",
        content:
          "Transparent source catalog with authority level, freshness policy and parse status.",
      },
      { property: "og:title", content: "Data Sources · SDD-Core SITREP — Situation Report" },
      {
        property: "og:description",
        content: "Every material status identifies its source and last-observed time.",
      },
    ],
  }),
  component: SourcesPage,
});

const authorityStyles: Record<string, string> = {
  constitutional: "border-primary/40 text-primary",
  ratified: "border-status-completed/40 text-status-completed",
  planning: "border-status-progress/40 text-status-progress",
  tracker: "border-muted-foreground/40 text-muted-foreground",
  manual: "border-status-gate/40 text-status-gate",
  observational: "border-status-deferred/40 text-status-deferred",
};

function SourcesPage() {
  const sources = useDataView().sources;
  const syncs = useDataView().syncRuns;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Data Sources"
        title="Transparent source catalog"
        description="Adapter boundary. Phase 1 uses typed fixtures; Phase 2 will swap this in with read-only GitHub ingestion."
      />

      <Card className="border-primary/25 bg-primary/5">
        <CardContent className="p-4 flex items-start gap-3 text-sm">
          <Database className="h-5 w-5 shrink-0 text-primary mt-0.5" />
          <div>
            <div className="font-semibold">Current mode: fixture (Phase 1)</div>
            <div className="text-muted-foreground mt-1">
              All entities implement <code className="font-mono text-xs">Provenance</code>. Swapping
              this adapter to read-only GitHub ingestion (Phase 2) will not require UI changes.
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-3">
        {sources.map((s) => (
          <Card key={s.id}>
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold">{s.name}</span>
                    <Badge variant="outline" className={authorityStyles[s.authority]}>
                      {s.authority}
                    </Badge>
                    <Badge variant="outline" className="font-mono text-[10px]">
                      {s.type}
                    </Badge>
                    <FreshnessPill freshness={s.freshness} />
                  </div>
                  <div className="mt-1 font-mono text-xs text-muted-foreground flex items-center gap-1">
                    {s.location}
                    <ExternalLink className="h-3 w-3" />
                  </div>
                  {s.parseErrors && s.parseErrors.length > 0 && (
                    <div className="mt-2 flex items-start gap-2 text-xs text-status-gate">
                      <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                      <div>{s.parseErrors.join(" · ")}</div>
                    </div>
                  )}
                </div>
                <div className="text-right text-xs text-muted-foreground space-y-0.5 font-mono">
                  <div>
                    Fetched{" "}
                    {s.lastFetched
                      ? formatDistanceToNow(new Date(s.lastFetched), { addSuffix: true })
                      : "—"}
                  </div>
                  <div>Policy: ≤ {s.freshnessPolicyHours}h</div>
                  <div>Items: {s.itemsContributed}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
            Sync run history
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {syncs.map((r) => (
            <div key={r.id} className="rounded-md border bg-surface-1 p-3">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="font-mono">
                  {r.id}
                </Badge>
                <Badge
                  className={
                    r.status === "ok"
                      ? "bg-status-completed/15 text-status-completed border-status-completed/30"
                      : r.status === "partial"
                        ? "bg-status-gate/15 text-status-gate border-status-gate/30"
                        : "bg-status-blocked/15 text-status-blocked border-status-blocked/30"
                  }
                  variant="outline"
                >
                  {r.status}
                </Badge>
                <span className="font-mono text-xs text-muted-foreground">
                  {r.sourceRevision?.slice(0, 7)} ·{" "}
                  {formatDistanceToNow(new Date(r.startedAt), { addSuffix: true })}
                </span>
              </div>
              <div className="mt-2 flex flex-wrap gap-3 text-[11px] font-mono text-muted-foreground">
                {Object.entries(r.itemCounts).map(([k, v]) => (
                  <span key={k}>
                    {k}: {v}
                  </span>
                ))}
              </div>
              {r.warnings.map((w) => (
                <div key={w} className="mt-1 text-[11px] text-status-gate">
                  ⚠ {w}
                </div>
              ))}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
