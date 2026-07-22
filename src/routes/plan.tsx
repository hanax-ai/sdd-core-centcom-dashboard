import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ChevronDown, ChevronRight, ExternalLink } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { PageHeader, EvidenceLegend } from "@/components/page-chrome";
import { StatusBadge, ConfidenceChip } from "@/components/status-badges";
import { dataSource } from "@/data/adapter";

export const Route = createFileRoute("/plan")({
  head: () => ({
    meta: [
      { title: "Plan & Roadmap · SDD-Core Command Center" },
      { name: "description", content: "Plan → Phase → Goal → Work Package hierarchy with completion, gates and evidence coverage." },
      { property: "og:title", content: "Plan & Roadmap · SDD-Core Command Center" },
      { property: "og:description", content: "Hierarchical roadmap with evidence coverage and gate status." },
    ],
  }),
  component: PlanPage,
});

function PlanPage() {
  const phases = dataSource.phases();
  const goals = dataSource.goals();
  const pkgs = dataSource.workPackages();
  const [expanded, setExpanded] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(phases.map((p) => [p.id, p.status === "current"])),
  );

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Plan & Roadmap"
        title="Implementation plan hierarchy"
        description="Plan → Phase → Goal → Work Package. Completion inferred from acceptance criteria + verified evidence, never from commit titles alone."
        actions={<EvidenceLegend />}
      />

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
            Phase timeline
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {phases.map((phase) => {
            const phaseGoals = goals.filter((g) => g.phaseId === phase.id);
            const phasePkgs = pkgs.filter((w) => w.phaseId === phase.id);
            const done = phasePkgs.filter((w) => w.status === "completed").length;
            const total = phasePkgs.filter((w) => w.status !== "deferred" && w.status !== "invalidated").length;
            const pct = total ? Math.round((done / total) * 100) : 0;
            const open = expanded[phase.id];
            return (
              <div key={phase.id} className="rounded-lg border bg-surface-1">
                <button
                  className="w-full flex items-center gap-3 p-4 text-left hover:bg-surface-2 transition-colors"
                  onClick={() => setExpanded((e) => ({ ...e, [phase.id]: !open }))}
                >
                  {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{phase.name}</span>
                      <Badge variant="outline" className="text-[10px] font-mono uppercase">
                        {phase.status}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {phaseGoals.length} goals · {phasePkgs.length} work packages
                    </div>
                  </div>
                  <div className="hidden sm:flex items-center gap-3 min-w-[200px]">
                    <Progress value={pct} className="w-32" />
                    <span className="font-mono text-xs text-muted-foreground w-16 text-right">
                      {done}/{total} · {pct}%
                    </span>
                  </div>
                </button>

                {open && (
                  <div className="border-t divide-y">
                    {phaseGoals.map((g) => {
                      const gPkgs = pkgs.filter((w) => w.goalId === g.id);
                      return (
                        <div key={g.id} className="p-4 space-y-3">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="font-mono">{g.id}</Badge>
                            <span className="font-medium">{g.title}</span>
                            <ConfidenceChip confidence={g.provenance.confidence} />
                          </div>
                          <div className="grid gap-2 md:grid-cols-2">
                            {gPkgs.map((w) => (
                              <div key={w.id} className="rounded-md border bg-card p-3 hover:elev-2 transition-shadow">
                                <div className="flex items-start justify-between gap-2">
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-2">
                                      <span className="font-mono text-[11px] text-primary">{w.id}</span>
                                      <StatusBadge status={w.status} />
                                    </div>
                                    <div className="mt-1 text-sm font-medium truncate">{w.title}</div>
                                  </div>
                                </div>
                                <div className="mt-3 flex items-center gap-3 text-[11px] text-muted-foreground font-mono">
                                  <span>ACC {w.acceptancePassed}/{w.acceptanceTotal}</span>
                                  <span>EV {w.evidenceCount}</span>
                                  <span className="ml-auto">
                                    {formatDistanceToNow(new Date(w.lastActivityAt), { addSuffix: true })}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
