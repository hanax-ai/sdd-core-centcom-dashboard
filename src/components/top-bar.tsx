import { useEffect, useState } from "react";
import { ExternalLink, RefreshCw, Search, Sun, Moon } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { FreshnessPill } from "@/components/status-badges";
import { CopyButton } from "@/components/copy-button";
import { dataSource } from "@/data/adapter";

export function TopBar() {
  const snap = dataSource.snapshot();
  const [dark, setDark] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [lastSynced, setLastSynced] = useState(snap.lastSyncedAt);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  const runSync = () => {
    setSyncing(true);
    toast.loading("Fixture refresh in progress…", { id: "sync" });
    setTimeout(() => {
      setSyncing(false);
      setLastSynced(new Date().toISOString());
      toast.success("Fixture refresh complete", {
        id: "sync",
        description: "Phase 1 demo data — not a live GitHub read.",
      });
    }, 1200);
  };

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b bg-background/85 px-3 backdrop-blur-md">
      <SidebarTrigger />
      <Separator orientation="vertical" className="h-6" />

      <div className="flex min-w-0 items-center gap-3">
        <div className="hidden sm:flex flex-col leading-tight">
          <span className="text-[11px] uppercase tracking-widest text-muted-foreground">Repository</span>
          <a
            href={`https://github.com/${snap.repo}`}
            target="_blank" rel="noreferrer"
            className="font-mono text-xs hover:text-primary flex items-center gap-1"
          >
            {snap.repo}
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
        <Separator orientation="vertical" className="hidden sm:block h-6" />
        <div className="hidden md:flex flex-col leading-tight">
          <span className="text-[11px] uppercase tracking-widest text-muted-foreground">HEAD · {snap.branch}</span>
          <div className="flex items-center gap-1 font-mono text-xs">
            <span>{snap.headSha.slice(0, 7)}</span>
            <CopyButton value={snap.headSha} />
            <a
              href={`https://github.com/${snap.repo}/commit/${snap.headSha}`}
              target="_blank" rel="noreferrer"
              className="text-muted-foreground hover:text-primary"
            >
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
        <Separator orientation="vertical" className="hidden md:block h-6" />
        <div className="hidden lg:flex flex-col leading-tight">
          <span className="text-[11px] uppercase tracking-widest text-muted-foreground">Last sync</span>
          <div className="flex items-center gap-2 text-xs">
            <span className="font-mono">{formatDistanceToNow(new Date(lastSynced), { addSuffix: true })}</span>
            <FreshnessPill freshness={snap.freshness} />
          </div>
        </div>
      </div>

      <div className="ml-auto flex items-center gap-2">
        <div className="relative hidden md:block">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search work, defects, evidence…  ⌘K"
            className="h-8 w-64 pl-8 font-mono text-xs"
          />
        </div>
        <Button
          variant="outline" size="sm"
          onClick={runSync} disabled={syncing}
          className="h-8 gap-1.5"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${syncing ? "animate-spin" : ""}`} />
          <span className="hidden sm:inline">Sync now</span>
        </Button>
        <Button variant="ghost" size="icon" onClick={() => setDark((d) => !d)} className="h-8 w-8" aria-label="Toggle theme">
          {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>
      </div>
    </header>
  );
}
