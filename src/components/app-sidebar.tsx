import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  GitBranch,
  Package,
  Bug,
  ShieldCheck,
  CheckCheck,
  FileStack,
  Activity,
  Database,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

const items = [
  { title: "Overview", url: "/", icon: LayoutDashboard },
  { title: "Plan & Roadmap", url: "/plan", icon: GitBranch },
  { title: "Work Packages", url: "/work-packages", icon: Package },
  { title: "Issues & Defects", url: "/issues", icon: Bug },
  { title: "Governance & Gates", url: "/governance", icon: ShieldCheck },
  { title: "Quality & Verification", url: "/quality", icon: CheckCheck },
  { title: "Deliverables & Ownership", url: "/deliverables", icon: FileStack },
  { title: "Activity & Evidence", url: "/activity", icon: Activity },
  { title: "Data Sources", url: "/sources", icon: Database },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <Sidebar collapsible="icon" className="border-r">
      <SidebarHeader className="border-b">
        <div className="flex items-center gap-2.5 px-2 py-2">
          <div className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/15 border border-primary/30">
            <div className="h-2 w-2 rounded-sm bg-primary" />
            <div className="absolute inset-0 rounded-md ring-1 ring-primary/20 animate-pulse" />
          </div>
          {!collapsed && (
            <div className="flex flex-col leading-tight">
              <span className="text-[13px] font-semibold tracking-tight">SITREP</span>
              <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">
                Powered by SDD-Core
              </span>
            </div>
          )}
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          {!collapsed && <SidebarGroupLabel>Navigation</SidebarGroupLabel>}
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => {
                const active = item.url === "/" ? pathname === "/" : pathname.startsWith(item.url);
                return (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton asChild isActive={active} tooltip={item.title}>
                      <Link to={item.url} aria-current={active ? "page" : undefined}>
                        <item.icon className="h-4 w-4" aria-hidden="true" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
