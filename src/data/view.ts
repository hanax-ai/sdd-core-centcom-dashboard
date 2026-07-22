/**
 * CP-5 — Assembled data view.
 *
 * The adapter validates raw fixtures at the boundary. `DataView` is
 * the assembled, scenario-ready projection that the UI consumes. All
 * routes/components should depend on this shape (via `useDataView()`)
 * rather than pulling from the adapter directly, so scenario
 * transforms and, later, GitHub ingestion swap in without UI edits.
 */
import { dataSource } from "./adapter";
import type {
  ActivityEvent,
  Decision,
  Defect,
  Deliverable,
  EvidenceLink,
  GateEvent,
  Goal,
  PlanPhase,
  Snapshot,
  SourceRecord,
  SyncRun,
  VerificationRun,
  WorkPackage,
} from "./types";

export interface DataView {
  snapshot: Snapshot;
  phases: PlanPhase[];
  goals: Goal[];
  workPackages: WorkPackage[];
  decisions: Decision[];
  gates: GateEvent[];
  defects: Defect[];
  evidenceLinks: EvidenceLink[];
  verificationRuns: VerificationRun[];
  deliverables: Deliverable[];
  activityEvents: ActivityEvent[];
  sources: SourceRecord[];
  syncRuns: SyncRun[];
}

export function baseDataView(): DataView {
  return {
    snapshot: dataSource.snapshot(),
    phases: dataSource.phases(),
    goals: dataSource.goals(),
    workPackages: dataSource.workPackages(),
    decisions: dataSource.decisions(),
    gates: dataSource.gates(),
    defects: dataSource.defects(),
    evidenceLinks: dataSource.evidenceLinks(),
    verificationRuns: dataSource.verificationRuns(),
    deliverables: dataSource.deliverables(),
    activityEvents: dataSource.activityEvents(),
    sources: dataSource.sources(),
    syncRuns: dataSource.syncRuns(),
  };
}
