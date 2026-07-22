/**
 * CP-5 — Scenario picker.
 *
 * Deterministic view switcher wired to the URL search param
 * `?scenario=`. Every option is a pure transform of the fixture
 * baseline (see src/data/scenarios.ts). Never labelled as live data.
 */
import { FlaskConical } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useScenario } from "@/data/scenario-context";
import type { ScenarioId } from "@/data/scenarios";

export function ScenarioPicker() {
  const { id, all, meta, setScenario } = useScenario();
  const nonBaseline = id !== "baseline";

  return (
    <div className="hidden md:flex items-center gap-1.5">
      <label
        htmlFor="scenario-select"
        className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground"
      >
        Scenario
      </label>
      <Select value={id} onValueChange={(v) => setScenario(v as ScenarioId)}>
        <SelectTrigger
          id="scenario-select"
          aria-label={`Active demo scenario: ${meta.label}. ${meta.description}`}
          className={
            "h-8 w-[180px] gap-1.5 font-mono text-xs " +
            (nonBaseline ? "border-primary/50 bg-primary/10 text-primary" : "")
          }
        >
          <FlaskConical className="h-3.5 w-3.5" aria-hidden />
          <SelectValue />
        </SelectTrigger>
        <SelectContent align="end" className="w-[280px]">
          {all.map((s) => (
            <SelectItem key={s.id} value={s.id} className="flex-col items-start py-2">
              <span className="text-xs font-medium">{s.label}</span>
              <span className="text-[11px] text-muted-foreground">{s.short}</span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
