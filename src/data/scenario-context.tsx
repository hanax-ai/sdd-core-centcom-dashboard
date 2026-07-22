/**
 * CP-5 — Scenario context + `useDataView()` hook.
 *
 * The scenario id is a URL search param (`?scenario=`), so any view of
 * the dashboard is deep-linkable and reproducible. The context reads
 * the URL, validates the id, applies the deterministic transform, and
 * memoizes the resulting DataView for the render.
 */
import { createContext, useCallback, useContext, useMemo, type ReactNode } from "react";
import { useRouterState, useNavigate, useLocation } from "@tanstack/react-router";
import {
  DEFAULT_SCENARIO,
  SCENARIOS,
  applyScenario,
  getScenarioMeta,
  isScenarioId,
  type ScenarioId,
  type ScenarioMeta,
} from "./scenarios";
import { baseDataView, type DataView } from "./view";

interface ScenarioContextValue {
  id: ScenarioId;
  meta: ScenarioMeta;
  all: ScenarioMeta[];
  view: DataView;
  setScenario: (id: ScenarioId) => void;
}

const ScenarioContext = createContext<ScenarioContextValue | null>(null);

function readScenarioFromSearch(search: unknown): ScenarioId {
  if (search && typeof search === "object" && "scenario" in search) {
    const raw = (search as Record<string, unknown>).scenario;
    if (isScenarioId(raw)) return raw;
  }
  return DEFAULT_SCENARIO;
}

export function ScenarioProvider({ children }: { children: ReactNode }) {
  const search = useRouterState({ select: (s) => s.location.search });
  const navigate = useNavigate();
  const location = useLocation();

  const id = readScenarioFromSearch(search);

  const view = useMemo(() => applyScenario(baseDataView(), id), [id]);

  const setScenario = useCallback(
    (next: ScenarioId) => {
      void navigate({
        to: location.pathname,
        search: (prev: Record<string, unknown>) => {
          const rest = { ...prev };
          if (next === DEFAULT_SCENARIO) {
            delete rest.scenario;
            return rest;
          }
          return { ...rest, scenario: next };
        },
        replace: true,
      });
    },
    [navigate, location.pathname],
  );

  const value = useMemo<ScenarioContextValue>(
    () => ({
      id,
      meta: getScenarioMeta(id),
      all: SCENARIOS,
      view,
      setScenario,
    }),
    [id, view, setScenario],
  );

  return <ScenarioContext.Provider value={value}>{children}</ScenarioContext.Provider>;
}

export function useDataView(): DataView {
  const ctx = useContext(ScenarioContext);
  if (!ctx) {
    // Fallback for pre-provider render paths (SSR shell, tests without
    // provider). Returns baseline projection deterministically.
    return applyScenario(baseDataView(), DEFAULT_SCENARIO);
  }
  return ctx.view;
}

export function useScenario() {
  const ctx = useContext(ScenarioContext);
  if (!ctx) {
    throw new Error("useScenario must be used inside <ScenarioProvider>");
  }
  return ctx;
}
