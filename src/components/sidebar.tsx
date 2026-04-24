import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  PackagePlus,
  Package,
  Rocket,
  GitBranch,
  Server,
  Users,
  ScrollText,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/logo";

const navGroups: { label: string; items: { to: string; label: string; icon: React.ElementType }[] }[] = [
  {
    label: "Workspace",
    items: [
      { to: "/", label: "Dashboard", icon: LayoutDashboard },
      { to: "/create", label: "Create Package", icon: PackagePlus },
      { to: "/packages", label: "Packages", icon: Package },
      { to: "/deployments", label: "Deployments", icon: Rocket },
    ],
  },
  {
    label: "Infrastructure",
    items: [
      { to: "/repositories", label: "Repositories", icon: GitBranch },
      { to: "/servers", label: "Servers", icon: Server },
    ],
  },
  {
    label: "Governance",
    items: [
      { to: "/team", label: "Team & Roles", icon: Users },
      { to: "/audit", label: "Audit Logs", icon: ScrollText },
      { to: "/settings", label: "Settings", icon: Settings },
    ],
  },
];

export const Sidebar = () => {
  const location = useLocation();

  return (
    <aside className="hidden lg:flex h-screen w-[260px] shrink-0 flex-col border-r border-sidebar-border bg-sidebar/80 backdrop-blur-xl sticky top-0">
      <div className="px-5 py-5 border-b border-sidebar-border">
        <Logo />
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-5 space-y-6">
        {navGroups.map((group) => (
          <div key={group.label}>
            <div className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              {group.label}
            </div>
            <ul className="space-y-1">
              {group.items.map((item) => {
                const Icon = item.icon;
                const active =
                  item.to === "/"
                    ? location.pathname === "/"
                    : location.pathname.startsWith(item.to);
                return (
                  <li key={item.to}>
                    <NavLink
                      to={item.to}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-base",
                        "text-sidebar-foreground/80 hover:text-sidebar-foreground hover:bg-sidebar-accent",
                        active &&
                          "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm relative",
                      )}
                    >
                      {active && (
                        <span className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r-full brand-gradient-bg" />
                      )}
                      <Icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </NavLink>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="m-3 p-4 rounded-xl brand-soft-bg border border-border/60">
        <div className="text-xs font-semibold mb-1">Pro tip</div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Always generate a rollback package alongside production updates.
        </p>
      </div>
    </aside>
  );
};
