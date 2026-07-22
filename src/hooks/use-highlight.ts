/**
 * CP-6 — Highlight helper.
 *
 * Reads `?highlight=<id>` from the current URL and returns:
 *   - `highlightId`   the id (or null)
 *   - `highlightRef`  a ref-callback that scrolls into view + focuses
 *   - `isHighlighted` predicate for row/card classes
 *
 * When the user follows a command-palette result, the destination page
 * outlines and scrolls to the matching row.
 */
import { useCallback, useEffect, useRef } from "react";
import { useRouterState } from "@tanstack/react-router";

export function useHighlight() {
  const search = useRouterState({ select: (s) => s.location.search }) as unknown as Record<
    string,
    unknown
  >;
  const raw = search.highlight;
  const highlightId = typeof raw === "string" && raw.length > 0 ? raw : null;
  const targetRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (highlightId && targetRef.current) {
      targetRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [highlightId]);

  const highlightRef = useCallback(
    (id: string) => (node: HTMLElement | null) => {
      if (id !== highlightId) return;

      if (node) {
        targetRef.current = node;
      } else if (targetRef.current) {
        targetRef.current = null;
      }
    },
    [highlightId],
  );

  const isHighlighted = (id: string) => id === highlightId;

  return { highlightId, highlightRef, isHighlighted };
}
