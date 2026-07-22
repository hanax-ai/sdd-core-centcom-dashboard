/**
 * CP-6 — Global command palette (⌘K / Ctrl-K).
 *
 * Indexes every entity in the current DataView (work packages, defects,
 * decisions, gates, deliverables, evidence, verification runs, sources)
 * and navigates to the owning route with `?highlight=<id>` set so the
 * destination page can scroll to and outline the row.
 *
 * The scenario param is preserved automatically because we use the
 * router's `search` function form.
 */
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  Boxes,
  FileCheck2,
  FlaskConical,
  GitBranch,
  Layers,
  ScrollText,
  ShieldCheck,
  Bug,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { useDataView } from "@/data/scenario-context";

interface Entry {
  id: string;
  label: string;
  hint: string;
  keywords: string;
  route: string;
  group: string;
  icon: React.ComponentType<{ className?: string }>;
}

export function CommandPalette() {
  const view = useDataView();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.key === "k" || e.key === "K") && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const entries = useMemo<Entry[]>(() => {
    const out: Entry[] = [];
    for (const w of view.workPackages) {
      out.push({
        id: w.id,
        label: `${w.id} — ${w.title}`,
        hint: `${w.status} · ${w.owner} · ACC ${w.acceptancePassed}/${w.acceptanceTotal}`,
        keywords: `${w.id} ${w.title} ${w.owner} ${w.status} ${w.priority}`,
        route: "/work-packages",
        group: "Work Packages",
        icon: Boxes,
      });
    }
    for (const d of view.defects) {
      out.push({
        id: d.id,
        label: `${d.id} — ${d.title}`,
        hint: `${d.severity} · ${d.state} · ${d.source}`,
        keywords: `${d.id} ${d.title} ${d.severity} ${d.state} ${d.source}`,
        route: "/issues",
        group: "Defects",
        icon: Bug,
      });
    }
    for (const dec of view.decisions) {
      out.push({
        id: dec.id,
        label: `${dec.id} — ${dec.title}`,
        hint: `${dec.authority} · age ${dec.ageDays}d`,
        keywords: `${dec.id} ${dec.title} ${dec.authority} ${dec.blockingScope}`,
        route: "/governance",
        group: "Decisions",
        icon: ScrollText,
      });
    }
    for (const g of view.gates) {
      out.push({
        id: g.id,
        label: `${g.id} — ${g.workPackageId} · ${g.gate}`,
        hint: `${g.status} · ${g.approvingAuthority}`,
        keywords: `${g.id} ${g.workPackageId} ${g.gate} ${g.status}`,
        route: "/governance",
        group: "Gates",
        icon: ShieldCheck,
      });
    }
    for (const d of view.deliverables) {
      out.push({
        id: d.id,
        label: `${d.id} — ${d.artifactSet}`,
        hint: `${d.layer} · ${d.owner}`,
        keywords: `${d.id} ${d.artifactSet} ${d.layer} ${d.owner}`,
        route: "/deliverables",
        group: "Deliverables",
        icon: Layers,
      });
    }
    for (const v of view.verificationRuns) {
      out.push({
        id: v.id,
        label: `${v.id} — ${v.name}`,
        hint: `${v.status}${v.passedChecks != null && v.totalChecks != null ? ` · ${v.passedChecks}/${v.totalChecks}` : ""}`,
        keywords: `${v.id} ${v.name} ${v.status}`,
        route: "/quality",
        group: "Verification",
        icon: FlaskConical,
      });
    }
    for (const e of view.evidenceLinks) {
      out.push({
        id: e.id,
        label: `${e.id} — ${e.label}`,
        hint: `${e.kind}`,
        keywords: `${e.id} ${e.label} ${e.kind}`,
        route: "/quality",
        group: "Evidence",
        icon: FileCheck2,
      });
    }

    for (const s of view.sources) {
      out.push({
        id: s.id,
        label: `${s.name}`,
        hint: `${s.type} · ${s.authority}`,
        keywords: `${s.id} ${s.name} ${s.type} ${s.authority}`,
        route: "/sources",
        group: "Sources",
        icon: GitBranch,
      });
    }
    return out;
  }, [view]);

  const grouped = useMemo(() => {
    const map = new Map<string, Entry[]>();
    for (const e of entries) {
      const list = map.get(e.group) ?? [];
      list.push(e);
      map.set(e.group, list);
    }
    return Array.from(map.entries());
  }, [entries]);

  const jump = (entry: Entry) => {
    setOpen(false);
    void navigate({
      to: entry.route,
      search: (prev: Record<string, unknown>) => ({ ...prev, highlight: entry.id }),
    });
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        aria-label="Open global search"
        className="h-8 gap-2 pl-2 pr-2 font-mono text-xs text-muted-foreground hover:text-foreground"
      >
        <Search className="h-3.5 w-3.5" />
        <span className="hidden md:inline">Search work, defects, evidence…</span>
        <kbd className="hidden md:inline-flex items-center rounded border bg-muted px-1 text-[10px] font-medium">
          ⌘K
        </kbd>
      </Button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Type an id, title, owner, severity… (⌘K to toggle)" />
        <CommandList>
          <CommandEmpty>No matches in the current scenario.</CommandEmpty>
          {grouped.map(([group, items], idx) => (
            <div key={group}>
              {idx > 0 && <CommandSeparator />}
              <CommandGroup heading={`${group} (${items.length})`}>
                {items.slice(0, 50).map((entry) => {
                  const Icon = entry.icon;
                  return (
                    <CommandItem
                      key={entry.id}
                      value={`${entry.group} ${entry.keywords}`}
                      onSelect={() => jump(entry)}
                    >
                      <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                      <div className="flex flex-col">
                        <span className="text-xs">{entry.label}</span>
                        <span className="text-[10px] text-muted-foreground font-mono">
                          {entry.hint}
                        </span>
                      </div>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </div>
          ))}
        </CommandList>
      </CommandDialog>
    </>
  );
}
