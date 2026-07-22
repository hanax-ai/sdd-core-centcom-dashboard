import { createFileRoute } from "@tanstack/react-router";
import { AlertTriangle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PageHeader } from "@/components/page-chrome";
import { FreshnessPill, ConfidenceChip } from "@/components/status-badges";
import { useDataView } from "@/data/scenario-context";
import { deliverableDrift, deliverableExceptions } from "@/data/metrics";
import { useUrlSearchParam } from "@/hooks/use-url-state";
import { useHighlight } from "@/hooks/use-highlight";

export const Route = createFileRoute("/deliverables")({
  head: () => ({
    meta: [
      { title: "Deliverables & Ownership · SDD-Core SITREP — Situation Report" },
      {
        name: "description",
        content: "Living deliverables register with owners, exceptions and version-drift alerts.",
      },
      {
        property: "og:title",
        content: "Deliverables & Ownership · SDD-Core SITREP — Situation Report",
      },
      {
        property: "og:description",
        content: "Register hygiene — flags drift, exceptions and missing ownership.",
      },
    ],
  }),
  component: DeliverablesPage,
});

function DeliverablesPage() {
  const dels = useDataView().deliverables;
  const drift = deliverableDrift(dels);
  const exceptions = deliverableExceptions(dels);
  const [filter, setFilter] = useUrlSearchParam<string>("filter", "all");
  const { isHighlighted, highlightRef } = useHighlight();

  const visible = filter === "drift" ? drift : filter === "exception" ? exceptions : dels;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Deliverables & Ownership"
        title="Living register with drift detection"
        description="Version drift, exceptions, and missing owners are flagged in-place — never silently normalized."
      />

      {drift.length > 0 && (
        <Card className="border-status-gate/30 bg-status-gate/5">
          <CardContent className="p-4 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-status-gate mt-0.5 shrink-0" />
            <div className="text-sm">
              <div className="font-semibold">
                {drift.length} rows show version drift vs. head commit
              </div>
              <div className="text-muted-foreground mt-1">
                Both values are preserved. Choose an authoritative source in Governance → Decision
                queue.
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex items-center gap-2 text-xs">
        <span className="text-muted-foreground uppercase tracking-widest font-mono text-[10px]">
          Filter
        </span>
        <div className="flex rounded-md border p-0.5" role="group" aria-label="Deliverable filter">
          {(["all", "drift", "exception"] as const).map((k) => (
            <Button
              key={k}
              variant={filter === k ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setFilter(k)}
              aria-pressed={filter === k}
              className="h-7 text-xs capitalize"
            >
              {k}{" "}
              {k === "drift"
                ? `(${drift.length})`
                : k === "exception"
                  ? `(${exceptions.length})`
                  : `(${dels.length})`}
            </Button>
          ))}
        </div>

        <span className="ml-auto font-mono text-muted-foreground">
          {visible.length} of {dels.length}
        </span>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-24">ID</TableHead>
                <TableHead>Layer</TableHead>
                <TableHead>Artifact set</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Registered</TableHead>
                <TableHead>Observed</TableHead>
                <TableHead>Freshness</TableHead>
                <TableHead>Exception</TableHead>
                <TableHead>Confidence</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visible.map((d) => {
                const isDrift = d.observedVersion !== d.registerVersion;
                return (
                  <TableRow
                    key={d.id}
                    ref={highlightRef(d.id) as unknown as React.Ref<HTMLTableRowElement>}
                    className={`${isDrift ? "bg-status-gate/5" : ""} ${isHighlighted(d.id) ? "ring-2 ring-primary ring-offset-2 ring-offset-background" : ""}`}
                  >
                    <TableCell className="font-mono text-xs text-primary">{d.id}</TableCell>
                    <TableCell className="text-xs uppercase font-mono">{d.layer}</TableCell>
                    <TableCell className="text-sm">{d.artifactSet}</TableCell>
                    <TableCell className="text-xs">{d.owner}</TableCell>
                    <TableCell className="font-mono text-xs">{d.registerVersion}</TableCell>
                    <TableCell className="font-mono text-xs">
                      {d.observedVersion}
                      {isDrift && <span className="ml-1 text-status-gate">⚠</span>}
                    </TableCell>
                    <TableCell>
                      <FreshnessPill freshness={d.staleness} />
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground max-w-[220px] truncate">
                      {d.exception ?? "—"}
                    </TableCell>
                    <TableCell>
                      <ConfidenceChip confidence={d.provenance.confidence} />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
