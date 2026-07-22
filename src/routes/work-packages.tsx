import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Download, LayoutGrid, Table as TableIcon } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import {
  Card, CardContent, CardHeader, CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader } from "@/components/page-chrome";
import { StatusBadge, ConfidenceChip } from "@/components/status-badges";
import { dataSource } from "@/data/adapter";
import type { WorkPackage, WorkStatus } from "@/data/types";

export const Route = createFileRoute("/work-packages")({
  head: () => ({
    meta: [
      { title: "Work Packages · SDD-Core Command Center" },
      { name: "description", content: "Normalized work packages with gates, dependencies, defects and evidence — table and kanban views." },
      { property: "og:title", content: "Work Packages · SDD-Core Command Center" },
      { property: "og:description", content: "Filter, sort and inspect work packages with full provenance." },
    ],
  }),
  component: WorkPackagesPage,
});

const kanbanCols: { key: WorkStatus; label: string }[] = [
  { key: "not-started", label: "Not started" },
  { key: "in-progress", label: "In progress" },
  { key: "awaiting-decision", label: "Awaiting decision" },
  { key: "awaiting-gate-2", label: "Awaiting Gate 2" },
  { key: "blocked", label: "Blocked" },
  { key: "completed", label: "Completed" },
  { key: "deferred", label: "Deferred" },
];

function WorkPackagesPage() {
  const pkgs = dataSource.workPackages();
  const [view, setView] = useState<"table" | "kanban">("table");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<string>("all");
  const [selected, setSelected] = useState<WorkPackage | null>(null);

  const filtered = useMemo(() => {
    return pkgs.filter((w) => {
      if (status !== "all" && w.status !== status) return false;
      if (query && !`${w.id} ${w.title} ${w.owner}`.toLowerCase().includes(query.toLowerCase())) return false;
      return true;
    });
  }, [pkgs, status, query]);

  const exportCsv = () => {
    const rows = [
      ["ID", "Title", "Status", "Priority", "Owner", "Gate", "ACC", "Evidence", "Last activity"],
      ...filtered.map((w) => [
        w.id, w.title, w.status, w.priority, w.owner, w.gateRequirement,
        `${w.acceptancePassed}/${w.acceptanceTotal}`, w.evidenceCount, w.lastActivityAt,
      ]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url; a.download = "work-packages.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Work Packages"
        title="Normalized delivery units"
        description="Statuses are normalized across sources. Completion requires acceptance criteria passed and evidence linked — commits alone don't count."
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={exportCsv} className="gap-1.5">
              <Download className="h-3.5 w-3.5" /> Export CSV
            </Button>
            <div className="flex rounded-md border p-0.5">
              <Button variant={view === "table" ? "secondary" : "ghost"} size="sm" onClick={() => setView("table")} className="h-7 gap-1">
                <TableIcon className="h-3.5 w-3.5" /> Table
              </Button>
              <Button variant={view === "kanban" ? "secondary" : "ghost"} size="sm" onClick={() => setView("kanban")} className="h-7 gap-1">
                <LayoutGrid className="h-3.5 w-3.5" /> Kanban
              </Button>
            </div>
          </div>
        }
      />

      <div className="flex flex-wrap gap-2 items-center">
        <Input
          placeholder="Search by ID, title, owner…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="h-8 w-64 font-mono text-xs"
        />
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="h-8 w-56 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {kanbanCols.map((c) => (
              <SelectItem key={c.key} value={c.key}>{c.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-xs text-muted-foreground font-mono ml-auto">{filtered.length} of {pkgs.length}</span>
      </div>

      {view === "table" ? (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-24">ID</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>Gate</TableHead>
                  <TableHead className="text-right">ACC</TableHead>
                  <TableHead className="text-right">EV</TableHead>
                  <TableHead>Last activity</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((w) => (
                  <TableRow key={w.id} onClick={() => setSelected(w)} className="cursor-pointer">
                    <TableCell className="font-mono text-xs text-primary">{w.id}</TableCell>
                    <TableCell className="max-w-md truncate">{w.title}</TableCell>
                    <TableCell><StatusBadge status={w.status} /></TableCell>
                    <TableCell className="text-xs">{w.owner}</TableCell>
                    <TableCell className="text-xs uppercase font-mono">{w.gateRequirement}</TableCell>
                    <TableCell className="text-right font-mono text-xs">
                      {w.acceptancePassed}/{w.acceptanceTotal}
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs">{w.evidenceCount}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(w.lastActivityAt), { addSuffix: true })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {kanbanCols.map((c) => {
            const col = filtered.filter((w) => w.status === c.key);
            return (
              <Card key={c.key} className="bg-surface-1">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-[11px] uppercase tracking-widest text-muted-foreground">
                      {c.label}
                    </CardTitle>
                    <Badge variant="outline" className="font-mono">{col.length}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  {col.map((w) => (
                    <button
                      key={w.id}
                      onClick={() => setSelected(w)}
                      className="w-full text-left rounded-md border bg-card p-3 hover:elev-2 transition-shadow"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[11px] text-primary">{w.id}</span>
                        <span className="ml-auto text-[10px] uppercase font-mono text-muted-foreground">{w.priority}</span>
                      </div>
                      <div className="mt-1 text-sm">{w.title}</div>
                      <div className="mt-2 flex items-center gap-2 text-[11px] font-mono text-muted-foreground">
                        <span>ACC {w.acceptancePassed}/{w.acceptanceTotal}</span>
                        <span>EV {w.evidenceCount}</span>
                      </div>
                    </button>
                  ))}
                  {col.length === 0 && (
                    <div className="text-xs text-muted-foreground italic py-4 text-center">Empty</div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Sheet open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
          {selected && (
            <>
              <SheetHeader>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="font-mono">{selected.id}</Badge>
                  <StatusBadge status={selected.status} />
                </div>
                <SheetTitle className="text-xl leading-snug">{selected.title}</SheetTitle>
              </SheetHeader>
              <div className="mt-6 space-y-6 text-sm">
                <p className="text-muted-foreground">{selected.description}</p>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Owner" value={selected.owner} />
                  <Field label="Operating agent" value={selected.operatingAgent} />
                  <Field label="Priority" value={selected.priority.toUpperCase()} />
                  <Field label="Gate" value={selected.gateRequirement} />
                  <Field label="Acceptance" value={`${selected.acceptancePassed}/${selected.acceptanceTotal}`} />
                  <Field label="Evidence" value={String(selected.evidenceCount)} />
                </div>
                <div>
                  <div className="text-[11px] uppercase tracking-widest text-muted-foreground mb-1">Next action</div>
                  <div className="rounded-md border bg-surface-2 p-3">{selected.nextAction}</div>
                </div>
                <div>
                  <div className="text-[11px] uppercase tracking-widest text-muted-foreground mb-1">Provenance</div>
                  <div className="rounded-md border bg-surface-2 p-3 space-y-1 text-xs font-mono">
                    <div>source: {selected.provenance.sourceType}</div>
                    <div>revision: {selected.provenance.sourceRevision?.slice(0, 12)}</div>
                    <div>observed: {new Date(selected.provenance.observedAt).toLocaleString()}</div>
                    <div className="flex items-center gap-2">
                      confidence: <ConfidenceChip confidence={selected.provenance.confidence} />
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border bg-surface-2 p-2.5">
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="mt-0.5 font-medium">{value}</div>
    </div>
  );
}
