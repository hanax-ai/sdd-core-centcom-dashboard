import { createFileRoute } from "@tanstack/react-router";
import { ChevronRight, ShieldCheck, ShieldQuestion, Vote } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-chrome";
import { StatusBadge, ConfidenceChip } from "@/components/status-badges";
import { useDataView } from "@/data/scenario-context";
import { gateSplit } from "@/data/metrics";

export const Route = createFileRoute("/governance")({
  head: () => ({
    meta: [
      { title: "Governance & Gates · SDD-Core SITREP — Situation Report" },
      {
        name: "description",
        content:
          "Gate 1 promotion vs Gate 2 implementation authorization made visually explicit. Agent Zero decision queue.",
      },
      { property: "og:title", content: "Governance & Gates · SDD-Core SITREP — Situation Report" },
      {
        property: "og:description",
        content: "Authority model: Gate 1 promotion never authorizes implementation.",
      },
    ],
  }),
  component: GovernancePage,
});

const flow = [
  { key: "wip", label: "WIP" },
  { key: "g1", label: "Gate 1 · Promotion", authority: "Framework maintainer" },
  { key: "spec", label: "Specification" },
  { key: "plan", label: "Plan" },
  { key: "tasks", label: "Tasks" },
  { key: "g2", label: "Gate 2 · Implementation", authority: "Agent Zero" },
  { key: "exec", label: "Execution" },
  { key: "verify", label: "Verification" },
];

function GovernancePage() {
  const gates = useDataView().gates;
  const pkgs = useDataView().workPackages;
  const decisions = useDataView().decisions;

  const { gate1: g1, gate2: g2, maintenanceChanges: mc } = gateSplit(gates);

  const readyNotAuthorized = pkgs.filter(
    (w) => w.status === "awaiting-gate-2" || w.status === "awaiting-decision",
  );

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Governance & Gates"
        title="Authority model — Gate 1 promotion ≠ Gate 2 implementation"
        description="Promotion authorizes specification. Implementation requires a separate Gate 2 approval. Never conflate the two."
      />

      {/* Flow */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
            Governance flow
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-1.5">
            {flow.map((f, i) => (
              <div key={f.key} className="flex items-center gap-1.5">
                <div
                  className={`rounded-md border px-3 py-2 min-w-[100px] ${f.key === "g1" ? "border-status-gate/40 bg-status-gate/8" : f.key === "g2" ? "border-status-blocked/40 bg-status-blocked/8" : "bg-surface-1"}`}
                >
                  <div className="text-xs font-medium">{f.label}</div>
                  {f.authority && (
                    <div className="text-[10px] text-muted-foreground font-mono mt-0.5">
                      {f.authority}
                    </div>
                  )}
                </div>
                {i < flow.length - 1 && (
                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-3">
        <GateCard
          title="Gate 1 · Promotion"
          icon={<ShieldCheck className="h-4 w-4 text-status-completed" />}
          events={g1}
        />
        <GateCard
          title="Gate 2 · Implementation"
          icon={<ShieldQuestion className="h-4 w-4 text-status-gate" />}
          events={g2}
        />
        <GateCard
          title="Maintenance Changes route"
          icon={<ShieldCheck className="h-4 w-4 text-primary" />}
          events={mc}
        />
      </div>

      {/* Ready but not authorized */}
      <Card className="border-status-gate/30">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
            Technically ready · not authorized
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {readyNotAuthorized.map((w) => (
            <div key={w.id} className="flex items-center gap-3 rounded-md border bg-surface-1 p-3">
              <Badge variant="outline" className="font-mono">
                {w.id}
              </Badge>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium truncate">{w.title}</div>
                <div className="text-xs text-muted-foreground">{w.nextAction}</div>
              </div>
              <StatusBadge status={w.status} />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Decision queue */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
            <Vote className="h-4 w-4 text-primary" /> Agent Zero decision queue
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {decisions.map((d) => (
            <div key={d.id} className="rounded-md border bg-surface-1 p-4">
              <div className="flex items-start gap-3">
                <Badge variant="outline" className="font-mono">
                  {d.id}
                </Badge>
                <div className="min-w-0 flex-1">
                  <div className="font-medium">{d.title}</div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    Authority: {d.authority} · aged {d.ageDays}d · blocking {d.blockingScope}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {d.options.map((o) => (
                      <Badge key={o} variant="secondary" className="font-normal">
                        {o}
                      </Badge>
                    ))}
                  </div>
                  <div className="mt-2 text-xs text-muted-foreground">Impact: {d.impact}</div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <ConfidenceChip confidence={d.provenance.confidence} />
                  <Button size="sm" variant="outline" disabled className="h-7 text-xs">
                    Prototype only
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function GateCard({
  title,
  icon,
  events,
}: {
  title: string;
  icon: React.ReactNode;
  events: import("@/data/types").GateEvent[];
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          {icon} {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {events.map((g) => (
          <div key={g.id} className="rounded-md border bg-surface-1 p-3">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="font-mono text-[10px]">
                {g.workPackageId}
              </Badge>
              <Badge
                className={
                  g.status === "approved"
                    ? "bg-status-completed/15 text-status-completed border-status-completed/30"
                    : g.status === "pending"
                      ? "bg-status-gate/15 text-status-gate border-status-gate/30"
                      : "bg-status-blocked/15 text-status-blocked border-status-blocked/30"
                }
                variant="outline"
              >
                {g.status}
              </Badge>
            </div>
            <div className="mt-1.5 text-xs">{g.requiredDirective}</div>
            <div className="mt-1 text-[11px] text-muted-foreground font-mono">
              authority: {g.approvingAuthority}
              {g.approvedArtifactRevision && ` · ${g.approvedArtifactRevision}`}
            </div>
          </div>
        ))}
        {events.length === 0 && (
          <div className="text-xs text-muted-foreground italic py-4 text-center">No events</div>
        )}
      </CardContent>
    </Card>
  );
}
