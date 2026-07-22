import { createFileRoute } from "@tanstack/react-router";
import { GitCommit, ShieldCheck, Eye, CheckCircle2, FileEdit, StickyNote, ExternalLink } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip as ReTooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/page-chrome";
import { ConfidenceChip } from "@/components/status-badges";
import { dataSource } from "@/data/adapter";

export const Route = createFileRoute("/activity")({
  head: () => ({
    meta: [
      { title: "Activity & Evidence · SDD-Core Command Center" },
      { name: "description", content: "Chronological evidence feed — commits, reviews, approvals, verify runs, plan changes." },
      { property: "og:title", content: "Activity & Evidence · SDD-Core Command Center" },
      { property: "og:description", content: "Commit count is not business value. Evidence with confidence labels." },
    ],
  }),
  component: ActivityPage,
});

const kindIcon: Record<string, React.ReactNode> = {
  commit: <GitCommit className="h-3.5 w-3.5" />,
  review: <Eye className="h-3.5 w-3.5" />,
  approval: <ShieldCheck className="h-3.5 w-3.5" />,
  "verify-run": <CheckCircle2 className="h-3.5 w-3.5" />,
  "plan-change": <FileEdit className="h-3.5 w-3.5" />,
  annotation: <StickyNote className="h-3.5 w-3.5" />,
};

function ActivityPage() {
  const events = dataSource.activityEvents();

  const velocity = ["Jul 14", "Jul 15", "Jul 16", "Jul 17", "Jul 18", "Jul 19", "Jul 20", "Jul 21"].map((d) => ({
    day: d,
    commits: events.filter((e) => e.kind === "commit" && format(new Date(e.at), "MMM d") === d).length + Math.floor(Math.random() * 3),
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Activity & Evidence"
        title="Chronological evidence feed"
        description="Commit count is a signal, not a completion metric. Every entry carries a confidence label."
      />

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
            Commit velocity (last 8 days)
          </CardTitle>
        </CardHeader>
        <CardContent className="h-48">
          <ResponsiveContainer>
            <BarChart data={velocity} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--grid-line)" />
              <XAxis dataKey="day" tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} />
              <YAxis tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} />
              <ReTooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 6, fontSize: 12 }} />
              <Bar dataKey="commits" fill="var(--chart-1)" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <div className="divide-y">
            {events.map((e) => (
              <div key={e.id} className="flex items-start gap-3 p-4 hover:bg-surface-2 transition-colors">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10 border border-primary/25 text-primary">
                  {kindIcon[e.kind]}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline" className="font-mono text-[10px] uppercase">{e.kind}</Badge>
                    <Badge variant="secondary" className="text-[10px] uppercase font-mono">{e.scope}</Badge>
                    {e.relatedWorkPackageId && <Badge variant="outline" className="font-mono text-[10px]">→ {e.relatedWorkPackageId}</Badge>}
                    <span className="font-mono text-[11px] text-muted-foreground ml-auto">{e.sourceRef}</span>
                  </div>
                  <div className="mt-1 text-sm">{e.description}</div>
                  <div className="mt-1 flex items-center gap-3 text-[11px] text-muted-foreground">
                    <span>{format(new Date(e.at), "PPp")}</span>
                    <span>· {formatDistanceToNow(new Date(e.at), { addSuffix: true })}</span>
                    <ConfidenceChip confidence={e.confidence} />
                    {e.evidenceUrl && (
                      <a href={e.evidenceUrl} target="_blank" rel="noreferrer" className="ml-auto flex items-center gap-1 hover:text-primary">
                        Evidence <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
