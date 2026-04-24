import { Link } from "react-router-dom";
import {
  ArrowUpRight,
  CheckCircle2,
  Clock,
  PackagePlus,
  Rocket,
  TrendingUp,
  XCircle,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { EnvBadge, StatusBadge } from "@/components/badges";
import { deployments, packages, projects } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

const Index = () => {
  const stats = [
    {
      label: "Packages this week",
      value: "23",
      delta: "+18%",
      tone: "success" as const,
      icon: PackagePlus,
    },
    {
      label: "Successful deploys",
      value: "47",
      delta: "+9%",
      tone: "success" as const,
      icon: CheckCircle2,
    },
    {
      label: "Active deployments",
      value: "3",
      delta: "live",
      tone: "running" as const,
      icon: Rocket,
    },
    {
      label: "Failures (7d)",
      value: "2",
      delta: "-50%",
      tone: "failed" as const,
      icon: XCircle,
    },
  ];

  return (
    <AppShell
      title="Dashboard"
      subtitle="Overview of your packages, deployments and pipelines."
      actions={
        <Link to="/create">
          <Button variant="brand" size="sm">
            <PackagePlus className="h-4 w-4" /> New Package
          </Button>
        </Link>
      }
    >
      {/* Hero strip */}
      <section className="relative overflow-hidden rounded-2xl border border-border/70 bg-card p-6 lg:p-8 mb-6 shadow-soft">
        <div className="absolute inset-0 brand-soft-bg opacity-90 pointer-events-none" />
        <div className="absolute -top-24 -right-20 h-72 w-72 rounded-full brand-gradient-bg opacity-25 blur-3xl pointer-events-none" />
        <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-background/70 backdrop-blur px-3 py-1 text-xs font-medium border border-border/60">
              <span className="status-dot bg-success animate-pulse-soft" />
              All systems healthy
            </span>
            <h2 className="mt-3 text-2xl lg:text-3xl font-semibold tracking-tight">
              Ship updates with <span className="brand-gradient-text">confidence</span>.
            </h2>
            <p className="mt-1.5 text-sm text-muted-foreground max-w-xl">
              Build update and rollback packages from any version, deploy them safely, and recover instantly when needed.
            </p>
          </div>
          <div className="flex gap-2">
            <Link to="/create">
              <Button variant="brand" size="lg">
                <PackagePlus className="h-4 w-4" /> Quick Create Package
              </Button>
            </Link>
            <Link to="/deployments">
              <Button variant="outline" size="lg">
                <Rocket className="h-4 w-4" /> View Deployments
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="section-card p-5">
              <div className="flex items-center justify-between">
                <div
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-lg",
                    s.tone === "success" && "bg-success/10 text-success",
                    s.tone === "running" && "bg-running/10 text-running",
                    s.tone === "failed" && "bg-failed/10 text-failed",
                  )}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <span
                  className={cn(
                    "text-xs font-medium inline-flex items-center gap-1",
                    s.tone === "success" && "text-success",
                    s.tone === "running" && "text-running",
                    s.tone === "failed" && "text-failed",
                  )}
                >
                  {s.tone !== "running" && <TrendingUp className="h-3 w-3" />}
                  {s.delta}
                </span>
              </div>
              <div className="mt-4 text-3xl font-semibold tracking-tight tabular-nums">{s.value}</div>
              <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
            </div>
          );
        })}
      </section>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {/* Recent packages */}
        <section className="section-card p-0 xl:col-span-2 overflow-hidden">
          <header className="flex items-center justify-between p-5 border-b border-border/60">
            <div>
              <h3 className="text-sm font-semibold">Recent packages</h3>
              <p className="text-xs text-muted-foreground">Latest update & rollback bundles</p>
            </div>
            <Link to="/packages" className="text-xs font-medium text-primary inline-flex items-center gap-1 hover:underline">
              View all <ArrowUpRight className="h-3 w-3" />
            </Link>
          </header>
          <ul className="divide-y divide-border/60">
            {packages.slice(0, 5).map((p) => {
              const project = projects.find((pr) => pr.id === p.projectId);
              return (
                <li key={p.id} className="flex items-center gap-4 p-4 hover:bg-secondary/40 transition-base">
                  <div className="h-10 w-10 rounded-lg brand-soft-bg flex items-center justify-center shrink-0">
                    <PackagePlus className="h-4 w-4 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-sm font-medium truncate">{project?.name}</span>
                      <EnvBadge env={p.environment} />
                    </div>
                    <div className="font-mono text-[11px] text-muted-foreground truncate">{p.name}</div>
                  </div>
                  <div className="hidden md:flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" /> {p.createdAt}
                  </div>
                  <StatusBadge status={p.status} />
                </li>
              );
            })}
          </ul>
        </section>

        {/* Active deployments */}
        <section className="section-card p-0 overflow-hidden">
          <header className="flex items-center justify-between p-5 border-b border-border/60">
            <div>
              <h3 className="text-sm font-semibold">Active deployments</h3>
              <p className="text-xs text-muted-foreground">In flight right now</p>
            </div>
            <Link to="/deployments" className="text-xs font-medium text-primary inline-flex items-center gap-1 hover:underline">
              All <ArrowUpRight className="h-3 w-3" />
            </Link>
          </header>
          <ul className="divide-y divide-border/60">
            {deployments.slice(0, 4).map((d) => (
              <li key={d.id} className="p-4">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm font-medium truncate max-w-[60%]">{d.serverName}</span>
                  <StatusBadge status={d.status} />
                </div>
                <div className="font-mono text-[11px] text-muted-foreground truncate">{d.packageName}</div>
                <div className="flex items-center justify-between mt-2 text-[11px] text-muted-foreground">
                  <EnvBadge env={d.environment} />
                  <span>{d.deployedBy} · {d.deployedAt}</span>
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>

      {/* Projects */}
      <section className="mt-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold">Projects</h3>
          <Link to="/repositories" className="text-xs font-medium text-primary inline-flex items-center gap-1 hover:underline">
            Manage repositories <ArrowUpRight className="h-3 w-3" />
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {projects.map((p) => (
            <div key={p.id} className="section-card p-5 group cursor-pointer">
              <div className={cn("h-10 w-10 rounded-lg bg-gradient-to-br shadow-soft mb-3", p.color)} />
              <div className="text-sm font-semibold">{p.name}</div>
              <div className="text-xs text-muted-foreground mt-1 line-clamp-2">{p.description}</div>
              <div className="mt-3 flex items-center justify-between text-[11px] text-muted-foreground">
                <span>{p.repoCount} repositories</span>
                <span>· {p.lastDeployedAt}</span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </AppShell>
  );
};

export default Index;
