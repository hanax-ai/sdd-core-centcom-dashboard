import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle2, HelpCircle, XCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/page-chrome";
import { ConfidenceChip } from "@/components/status-badges";
import { dataSource } from "@/data/adapter";

export const Route = createFileRoute("/quality")({
  head: () => ({
    meta: [
      { title: "Quality & Verification · SDD-Core Command Center" },
      { name: "description", content: "verify-layout, CI evidence, path/content invariants. 'Unknown' is not 'Passing'." },
      { property: "og:title", content: "Quality & Verification · SDD-Core Command Center" },
      { property: "og:description", content: "Evidence-graded verification health with explicit unknown states." },
    ],
  }),
  component: QualityPage,
});

function QualityPage() {
  const runs = dataSource.verificationRuns();
  const pkgs = dataSource.workPackages();
  const snap = dataSource.snapshot();

  const icon = (s: string) =>
    s === "passed" ? <CheckCircle2 className="h-5 w-5 text-status-completed" />
    : s === "failed" ? <XCircle className="h-5 w-5 text-status-blocked" />
    : <HelpCircle className="h-5 w-5 text-status-gate" />;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Quality & Verification"
        title="Observed verification — unknown never counted as pass"
        description="verify-layout, CI status, path checks and content-invariant checks. Historical runs are labeled distinctly from current evidence."
      />

      <Card className="border-status-gate/30 bg-status-gate/5">
        <CardContent className="p-4 text-sm">
          <div className="font-semibold">CI policy: {snap.ciPolicy} feedback only, not a required merge gate.</div>
          <div className="text-muted-foreground mt-1">
            Current commit-status at HEAD: <span className="font-mono">no current status evidence observed</span>. The dashboard displays this literally — it does not claim "passing".
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-3 md:grid-cols-3">
        {runs.map((r) => (
          <Card key={r.id}>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-start gap-3">
                {icon(r.status)}
                <div className="min-w-0 flex-1">
                  <div className="font-medium">{r.name}</div>
                  <div className="text-xs text-muted-foreground mt-0.5 font-mono">
                    observed {formatDistanceToNow(new Date(r.observedAt), { addSuffix: true })}
                  </div>
                </div>
                <ConfidenceChip confidence={r.provenance.confidence} />
              </div>
              <div className="flex items-center gap-3 text-xs">
                <Badge variant="outline" className="uppercase font-mono text-[10px]">{r.status}</Badge>
                {r.passedChecks !== undefined && r.totalChecks !== undefined && (
                  <span className="font-mono">{r.passedChecks}/{r.totalChecks} checks</span>
                )}
              </div>
              {r.provenance.parsingWarnings?.map((w) => (
                <div key={w} className="text-[11px] text-status-gate">⚠ {w}</div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
            Coverage by work package
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {pkgs.filter((w) => w.acceptanceTotal > 0).map((w) => {
            const pct = Math.round((w.acceptancePassed / w.acceptanceTotal) * 100);
            return (
              <div key={w.id} className="flex items-center gap-3">
                <Badge variant="outline" className="font-mono w-16 justify-center">{w.id}</Badge>
                <div className="flex-1 min-w-0">
                  <div className="text-sm truncate">{w.title}</div>
                  <div className="mt-1 h-1.5 rounded-full bg-muted overflow-hidden">
                    <div className={`h-full ${pct === 100 ? "bg-status-completed" : pct > 0 ? "bg-status-progress" : "bg-status-deferred"}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
                <span className="font-mono text-xs text-muted-foreground w-20 text-right">
                  {w.acceptancePassed}/{w.acceptanceTotal} · {pct}%
                </span>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
