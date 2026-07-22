import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertTriangle, ArrowRight, ExternalLink, Sparkles, TrendingUp } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip as ReTooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { PageHeader, EvidenceLegend } from "@/components/page-chrome";
import { KpiCard } from "@/components/kpi-card";
import { StatusBadge, ConfidenceChip } from "@/components/status-badges";
import {
  acceptanceCoverage,
  commitVelocity,
  decisionDebt,
  defectLoad,
  evidenceCoverage,
  gateSplit,
  planCompletion,
  staleSources,
  statusBuckets,
  verificationHealth,
} from "@/data/metrics";
import { useDataView } from "@/data/scenario-context";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Overview · SDD-Core SITREP — Situation Report" },
      {
        name: "description",
        content:
          "Current position, KPIs, next best actions and evidence-backed status for the SDD-Core implementation.",
      },
      { property: "og:title", content: "SDD-Core SITREP — Situation Report — Overview" },
      {
        property: "og:description",
        content: "Answer-first executive view of plan progress, gates, defects, and verification.",
      },
    ],
  }),
  component: OverviewPage,
});

function OverviewPage() {
  const {
    snapshot: snap,
    workPackages: pkgs,
    defects,
    gates,
    verificationRuns: runs,
    deliverables: dels,
    sources,
    phases,
    decisions,
    activityEvents: events,
  } = useDataView();

  const completion = planCompletion(pkgs, false, snap.lastSyncedAt);
  const acc = acceptanceCoverage(pkgs, snap.lastSyncedAt);
  const ev = evidenceCoverage(pkgs, snap.lastSyncedAt);
  const debt = decisionDebt(pkgs, gates, snap.lastSyncedAt);
  const dl = defectLoad(defects, snap.lastSyncedAt);
  const vh = verificationHealth(runs, snap.lastSyncedAt);
  const stale = staleSources(sources, snap.lastSyncedAt);

  const buckets = statusBuckets(pkgs);
  const gateInfo = gateSplit(gates);
  const total = pkgs.length;

  const attention = [
    {
      id: "DEC-01",
      title: "Approve Gate 2 implementation for skill lifecycle pilot",
      severity: "high" as const,
      age: "6 days awaiting Agent Zero",
      link: "/governance",
    },
    {
      id: "DEF-DR1",
      title: "Deliverables register version drift vs. head commit",
      severity: "high" as const,
      age: "Discovered at snapshot",
      link: "/issues",
    },
    {
      id: "WP-O1",
      title: "Deliverables register reconciliation is blocked",
      severity: "medium" as const,
      age: "Blocked on DEC-03",
      link: "/work-packages",
    },
    {
      id: "VR-3",
      title: "No current CI status evidence observed at HEAD",
      severity: "medium" as const,
      age: "Not 'Passing' — Unknown",
      link: "/quality",
    },
    {
      id: "WP-M3",
      title: "Maturity item 3: lifecycle authoring awaits authorization",
      severity: "low" as const,
      age: "21 days awaiting decision",
      link: "/governance",
    },
  ];

  const activityChart = commitVelocity(events);

  const nextActions = [
    {
      rank: 1,
      title: "Agent Zero: approve Gate 2 for skill lifecycle pilot (WP-L1)",
      why: "Unblocks WP-L1, WP-L2 and WP-M3. Decision has aged 6 days. Gate 1 promotion evidence is verified; only implementation authorization is pending.",
    },
    {
      rank: 2,
      title: "Resolve deliverables register version drift (DEF-DR1)",
      why: "Observed register cites older constitution versions than the head commit advanced by WP-R1. Preserve both values and choose an authoritative source.",
    },
    {
      rank: 3,
      title: "Re-run verify-layout and capture current status evidence",
      why: "Current commit-status is 'no evidence observed' — not 'passing'. Freshness must be re-established before claiming quality health.",
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Executive View · Answer-First"
        title="Where SDD-Core is right now"
        description="Every material status below identifies its source and last-observed time. Phase 1 renders typed fixture data — Sync now runs a local simulation."
        actions={<EvidenceLegend />}
      />

      {/* Current Position — the headline */}
      <Card className="relative overflow-hidden border-primary/25 elev-2">
        <div className="pointer-events-none absolute inset-0 grid-lines" />
        <CardHeader className="relative">
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-widest text-primary/80 font-mono">
            <Sparkles className="h-3.5 w-3.5" />
            Current Position
          </div>
        </CardHeader>
        <CardContent className="relative grid gap-6 lg:grid-cols-4">
          <div className="lg:col-span-2 space-y-1.5">
            <div className="text-xs uppercase tracking-widest text-muted-foreground">Phase</div>
            <div className="text-lg font-semibold">Framework — active</div>
            <div className="text-sm text-muted-foreground">
              Framework maturity backlog 7 of 8 completed; skill lifecycle Gate 1 promoted; Gate 2
              implementation approval pending.
            </div>
          </div>
          <div className="space-y-1.5">
            <div className="text-xs uppercase tracking-widest text-muted-foreground">
              Verified milestone
            </div>
            <div className="text-lg font-semibold">WP-R1 shipped</div>
            <div className="text-sm text-muted-foreground font-mono">
              {snap.headSha.slice(0, 7)} ·{" "}
              {formatDistanceToNow(new Date(snap.lastSyncedAt), { addSuffix: true })}
            </div>
          </div>
          <div className="space-y-1.5">
            <div className="text-xs uppercase tracking-widest text-status-gate">
              Primary blocker
            </div>
            <div className="text-lg font-semibold">Agent Zero Gate 2</div>
            <div className="text-sm text-muted-foreground">
              Lifecycle pilot cannot advance without implementation approval.
            </div>
          </div>
          <div className="lg:col-span-4 flex flex-wrap items-center gap-2 pt-2 border-t">
            <span className="text-xs text-muted-foreground uppercase tracking-widest">
              Recommended next
            </span>
            <span className="text-sm font-medium">
              Route DEC-01 to Agent Zero with lifecycle proposal evidence pack.
            </span>
            <Button asChild size="sm" variant="ghost" className="ml-auto gap-1">
              <Link to="/governance">
                Open governance <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* KPI Grid */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard metric={completion} accent="completed" hint="Excludes deferred & invalidated" />
        <KpiCard metric={acc} accent="primary" />
        <KpiCard metric={ev} accent="primary" />
        <KpiCard metric={debt} accent="gate" hint={`${gateInfo.pending.length} pending gates`} />
        <KpiCard metric={dl} accent="blocked" hint="GitHub issues ≠ all defects" />
        <KpiCard metric={vh} accent="gate" hint="Unknown ≠ Pass" />
        <KpiCard
          metric={{
            ...{
              label: "Blocked items",
              value: buckets.blocked,
              numerator: buckets.blocked,
              denominator: total,
              formula: "work packages in 'blocked' state",
              scope: `${total} work packages`,
              observedAt: snap.lastSyncedAt,
            },
          }}
          accent="blocked"
        />
        <KpiCard metric={stale} accent="gate" hint="Sources over freshness threshold" />
      </div>

      {/* Progress segmented bar */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
              Plan distribution · {total} work packages
            </CardTitle>
            <span className="text-xs text-muted-foreground font-mono">
              observed {new Date(snap.lastSyncedAt).toLocaleDateString()}
            </span>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex h-3 w-full overflow-hidden rounded-full border">
            {[
              { key: "completed", n: buckets.completed, cls: "bg-status-completed" },
              { key: "progress", n: buckets.progress, cls: "bg-status-progress" },
              { key: "awaiting", n: buckets.awaiting, cls: "bg-status-gate" },
              { key: "blocked", n: buckets.blocked, cls: "bg-status-blocked" },
              { key: "deferred", n: buckets.deferred, cls: "bg-status-deferred" },
              { key: "notStarted", n: buckets.notStarted, cls: "bg-muted" },
            ].map((b) => (
              <div
                key={b.key}
                className={`${b.cls} h-full`}
                style={{ width: `${(b.n / total) * 100}%` }}
                title={`${b.key}: ${b.n}`}
              />
            ))}
          </div>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-3 text-xs">
            <SegLegend swatch="bg-status-completed" label="Completed" n={buckets.completed} />
            <SegLegend swatch="bg-status-progress" label="In progress" n={buckets.progress} />
            <SegLegend swatch="bg-status-gate" label="Awaiting" n={buckets.awaiting} />
            <SegLegend swatch="bg-status-blocked" label="Blocked" n={buckets.blocked} />
            <SegLegend swatch="bg-status-deferred" label="Deferred" n={buckets.deferred} />
            <SegLegend swatch="bg-muted" label="Not started" n={buckets.notStarted} />
          </div>
        </CardContent>
      </Card>

      {/* Phase Roadmap */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
            Phase roadmap
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative grid grid-cols-2 gap-3 md:grid-cols-4">
            {phases.map((ph, i) => {
              const tone =
                ph.status === "completed"
                  ? "border-status-completed/40 bg-status-completed/8"
                  : ph.status === "current"
                    ? "border-primary/50 bg-primary/8 elev-2"
                    : ph.status === "next"
                      ? "border-status-gate/40 bg-status-gate/6"
                      : "border-border bg-muted/30";
              return (
                <div key={ph.id} className={`relative rounded-lg border p-4 ${tone}`}>
                  <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                    Phase {i + 1}
                  </div>
                  <div className="mt-1 text-base font-semibold">{ph.name}</div>
                  <div className="mt-2 text-xs capitalize text-muted-foreground">{ph.status}</div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Attention + Next actions */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div>
              <CardTitle className="text-sm font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-status-gate" /> Needs attention
              </CardTitle>
              <div className="mt-1 text-[11px] font-mono text-muted-foreground">
                Phase 1 static content
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {attention.map((a) => (
              <Link
                key={a.id}
                to={a.link}
                className="flex items-center gap-3 rounded-md border bg-surface-1 p-3 hover:bg-surface-2 transition-colors"
              >
                <span
                  className={`h-2 w-2 shrink-0 rounded-full ${a.severity === "high" ? "bg-status-blocked" : a.severity === "medium" ? "bg-status-gate" : "bg-status-deferred"}`}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[11px] text-muted-foreground">{a.id}</span>
                    <span className="text-sm truncate">{a.title}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">{a.age}</div>
                </div>
                <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
              </Link>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" /> Next best actions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {nextActions.map((a) => (
              <div key={a.rank} className="rounded-md border bg-surface-1 p-3">
                <div className="flex items-start gap-3">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-primary/15 border border-primary/30 font-mono text-xs text-primary">
                    {a.rank}
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-medium">{a.title}</div>
                    <div className="mt-1 text-xs text-muted-foreground">{a.why}</div>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Activity chart */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
              7-day activity
            </CardTitle>
            <span className="text-[11px] font-mono text-muted-foreground">
              commits ≠ business value
            </span>
          </div>
        </CardHeader>
        <CardContent className="h-56">
          <ResponsiveContainer>
            <BarChart data={activityChart} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--grid-line)" />
              <XAxis dataKey="day" tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} />
              <YAxis tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} />
              <ReTooltip
                contentStyle={{
                  background: "var(--popover)",
                  border: "1px solid var(--border)",
                  borderRadius: 6,
                  fontSize: 12,
                }}
              />
              <Bar dataKey="commits" fill="var(--chart-1)" radius={[3, 3, 0, 0]} />
              <Bar dataKey="approvals" fill="var(--chart-2)" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Decision queue teaser */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
            Agent Zero decision queue
          </CardTitle>
        </CardHeader>
        <CardContent className="divide-y">
          {decisions.map((d) => (
            <div key={d.id} className="flex items-start gap-3 py-3">
              <Badge variant="outline" className="font-mono">
                {d.id}
              </Badge>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium">{d.title}</div>
                <div className="mt-0.5 text-xs text-muted-foreground">
                  {d.impact} · blocking {d.blockingScope} · aged {d.ageDays}d
                </div>
              </div>
              <ConfidenceChip confidence={d.provenance.confidence} />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function SegLegend({ swatch, label, n }: { swatch: string; label: string; n: number }) {
  return (
    <div className="flex items-center gap-2">
      <span className={`h-2 w-3 rounded-sm ${swatch}`} />
      <span className="text-muted-foreground">{label}</span>
      <span className="ml-auto font-mono">{n}</span>
    </div>
  );
}
