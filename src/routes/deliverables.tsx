import { createFileRoute } from "@tanstack/react-router";
import { AlertTriangle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader } from "@/components/page-chrome";
import { FreshnessPill, ConfidenceChip } from "@/components/status-badges";
import { dataSource } from "@/data/adapter";

export const Route = createFileRoute("/deliverables")({
  head: () => ({
    meta: [
      { title: "Deliverables & Ownership · SDD-Core Command Center" },
      { name: "description", content: "Living deliverables register with owners, exceptions and version-drift alerts." },
      { property: "og:title", content: "Deliverables & Ownership · SDD-Core Command Center" },
      { property: "og:description", content: "Register hygiene — flags drift, exceptions and missing ownership." },
    ],
  }),
  component: DeliverablesPage,
});

function DeliverablesPage() {
  const dels = dataSource.deliverables();
  const drift = dels.filter((d) => d.observedVersion !== d.registerVersion);

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
              <div className="font-semibold">{drift.length} rows show version drift vs. head commit</div>
              <div className="text-muted-foreground mt-1">
                Both values are preserved. Choose an authoritative source in Governance → Decision queue.
              </div>
            </div>
          </CardContent>
        </Card>
      )}

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
              {dels.map((d) => {
                const isDrift = d.observedVersion !== d.registerVersion;
                return (
                  <TableRow key={d.id} className={isDrift ? "bg-status-gate/5" : ""}>
                    <TableCell className="font-mono text-xs text-primary">{d.id}</TableCell>
                    <TableCell className="text-xs uppercase font-mono">{d.layer}</TableCell>
                    <TableCell className="text-sm">{d.artifactSet}</TableCell>
                    <TableCell className="text-xs">{d.owner}</TableCell>
                    <TableCell className="font-mono text-xs">{d.registerVersion}</TableCell>
                    <TableCell className="font-mono text-xs">
                      {d.observedVersion}
                      {isDrift && <span className="ml-1 text-status-gate">⚠</span>}
                    </TableCell>
                    <TableCell><FreshnessPill freshness={d.staleness} /></TableCell>
                    <TableCell className="text-xs text-muted-foreground max-w-[220px] truncate">
                      {d.exception ?? "—"}
                    </TableCell>
                    <TableCell><ConfidenceChip confidence={d.provenance.confidence} /></TableCell>
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
