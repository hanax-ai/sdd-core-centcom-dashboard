import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AlertCircle, Ban, ExternalLink } from "lucide-react";
import { formatDistanceToNow, differenceInDays } from "date-fns";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip as ReTooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { PageHeader } from "@/components/page-chrome";
import { SeverityBadge, ConfidenceChip } from "@/components/status-badges";
import { dataSource } from "@/data/adapter";

export const Route = createFileRoute("/issues")({
  head: () => ({
    meta: [
      { title: "Issues & Defects · SDD-Core Command Center" },
      { name: "description", content: "GitHub issues, plan-defined defects, review findings, data-integrity alerts and risks — kept explicitly separate." },
      { property: "og:title", content: "Issues & Defects · SDD-Core Command Center" },
      { property: "og:description", content: "Zero open GitHub issues ≠ zero defects. All defect sources tracked distinctly." },
    ],
  }),
  component: IssuesPage,
});

const sourceLabels: Record<string, string> = {
  "github-issue": "GitHub issue",
  "plan-defined": "Plan-defined",
  "review-finding": "Review finding",
  "data-integrity": "Data-integrity alert",
  "risk": "Risk",
  "unknown": "Unknown / evidence gap",
};

function IssuesPage() {
  const defects = dataSource.defects();
  const snap = dataSource.snapshot();
  const [tab, setTab] = useState("all");

  const grouped = useMemo(() => {
    return Object.fromEntries(
      Object.keys(sourceLabels).map((k) => [k, defects.filter((d) => d.source === k)]),
    );
  }, [defects]);

  const severityData = ["critical", "high", "medium", "low"].map((s) => ({
    name: s, value: defects.filter((d) => d.severity === s).length,
  }));

  const agingData = defects.map((d) => ({
    id: d.id,
    age: Math.max(1, differenceInDays(new Date(snap.lastSyncedAt), new Date(d.discoveredAt))),
  }));

  const sevColors = ["var(--status-blocked)", "var(--status-blocked)", "var(--status-gate)", "var(--status-deferred)"];

  const list = tab === "all" ? defects : grouped[tab] ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Issues & Defects"
        title="All defect sources, kept distinct"
        description="Zero open GitHub issues does not mean zero defects. The dashboard tracks plan-defined defects, review findings, data-integrity alerts, risks and evidence gaps separately."
      />

      <Card className="border-status-gate/30 bg-status-gate/5">
        <CardContent className="p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 shrink-0 text-status-gate mt-0.5" />
          <div className="text-sm">
            <div className="font-semibold">GitHub issues observed: {snap.openIssues}. Plan/review defects observed: {defects.filter((d) => d.source !== "github-issue").length}.</div>
            <div className="text-muted-foreground mt-1">
              A "no open issues" state on GitHub is not equivalent to a healthy defect profile. Review the distinct sources below.
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
              Severity distribution
            </CardTitle>
          </CardHeader>
          <CardContent className="h-56">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={severityData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80}>
                  {severityData.map((_, i) => <Cell key={i} fill={sevColors[i]} />)}
                </Pie>
                <ReTooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 6, fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
              Defect aging (days since discovered)
            </CardTitle>
          </CardHeader>
          <CardContent className="h-56">
            <ResponsiveContainer>
              <BarChart data={agingData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--grid-line)" />
                <XAxis dataKey="id" tick={{ fill: "var(--muted-foreground)", fontSize: 10 }} />
                <YAxis tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} />
                <ReTooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 6, fontSize: 12 }} />
                <Bar dataKey="age" fill="var(--chart-3)" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="w-full justify-start flex-wrap h-auto">
          <TabsTrigger value="all">All ({defects.length})</TabsTrigger>
          {Object.entries(sourceLabels).map(([k, label]) => (
            <TabsTrigger key={k} value={k}>{label} ({grouped[k]?.length ?? 0})</TabsTrigger>
          ))}
        </TabsList>
        <TabsContent value={tab} className="mt-4">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-24">ID</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Severity</TableHead>
                    <TableHead>State</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Age</TableHead>
                    <TableHead>GH Issue?</TableHead>
                    <TableHead>Confidence</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {list.map((d) => (
                    <TableRow key={d.id}>
                      <TableCell className="font-mono text-xs text-primary">{d.id}</TableCell>
                      <TableCell className="max-w-md">
                        <div className="truncate">{d.title}</div>
                        {d.workPackageId && (
                          <div className="text-[11px] text-muted-foreground font-mono">→ {d.workPackageId}</div>
                        )}
                      </TableCell>
                      <TableCell><SeverityBadge severity={d.severity} /></TableCell>
                      <TableCell className="text-xs">{d.state}</TableCell>
                      <TableCell className="text-xs">{sourceLabels[d.source]}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(d.discoveredAt), { addSuffix: true })}
                      </TableCell>
                      <TableCell>
                        {d.hasGithubIssue ? (
                          <Badge variant="outline" className="gap-1"><ExternalLink className="h-3 w-3" />Yes</Badge>
                        ) : (
                          <Badge variant="outline" className="gap-1 text-muted-foreground"><Ban className="h-3 w-3" />No GH issue</Badge>
                        )}
                      </TableCell>
                      <TableCell><ConfidenceChip confidence={d.provenance.confidence} /></TableCell>
                    </TableRow>
                  ))}
                  {list.length === 0 && (
                    <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground italic">No entries in this source</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
