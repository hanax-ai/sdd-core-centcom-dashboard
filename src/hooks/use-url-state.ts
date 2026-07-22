/**
 * CP-6 — URL-synced state.
 *
 * A lightweight hook that binds a component-local string value to a
 * search-param on the current route. Writes use `replace: true` so
 * filter changes don't spam the history stack, and other search params
 * (notably `?scenario=`) are preserved.
 *
 * The hook intentionally does NOT depend on per-route `validateSearch`
 * — filters are opt-in, route-agnostic, and safe to add on any page.
 */
import { useCallback } from "react";
import { useLocation, useNavigate, useRouterState } from "@tanstack/react-router";

export function useUrlSearchParam<T extends string>(
  key: string,
  defaultValue: T,
  isValid?: (raw: string) => raw is T,
): [T, (next: T) => void] {
  const search = useRouterState({ select: (s) => s.location.search }) as unknown as Record<
    string,
    unknown
  >;
  const location = useLocation();
  const navigate = useNavigate();

  const raw = search[key];
  const value: T =
    typeof raw === "string" && (!isValid || isValid(raw)) ? (raw as T) : defaultValue;

  const set = useCallback(
    (next: T) => {
      void navigate({
        to: location.pathname,
        search: (prev: Record<string, unknown>) => {
          const rest: Record<string, unknown> = { ...prev };
          if (next === defaultValue || next === "") {
            delete rest[key];
          } else {
            rest[key] = next;
          }
          return rest;
        },
        replace: true,
      });
    },
    [navigate, location.pathname, key, defaultValue],
  );

  return [value, set];
}
