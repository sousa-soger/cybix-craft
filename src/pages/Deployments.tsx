import { useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { EnvBadge, StatusBadge } from "@/components/badges";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  deployments,
  packages,
  projects,
  repositories,
  servers,
  type Server,
  type PackageItem,
  type Project,
} from "@/lib/mock-data";
import {
  ChevronDown,
  ChevronRight,
  Server as ServerIcon,
  Search,
  Package as PackageIcon,
  Rocket,
  ShieldCheck,
  History,
  FolderGit2,
} from "lucide-react";

// Derive "current version" running on a server from most recent successful deployment
const currentVersionForServer = (serverName: string): string | null => {
  const d = deployments.find((x) => x.serverName === serverName && x.status === "success");
  if (!d) return null;
  const pkg = packages.find((p) => p.id === d.packageId);
  return pkg?.targetVersion ?? null;
};

const projectForServer = (serverId: string): Project | undefined =>
  projects.find((p) => p.serverIds.includes(serverId));

const compatiblePackages = (server: Server): PackageItem[] => {
  const project = projectForServer(server.id);
  if (!project) return [];
  return packages.filter((p) => {
    if (p.environment !== server.environment) return false;
    if (!project.repositoryIds.includes(p.repositoryId)) return false;
    return p.status === "success" || p.status === "queued";
  });
};

const Deployments = () => {
  const [selectedServerId, setSelectedServerId] = useState<string | null>(servers[0]?.id ?? null);
  const [query, setQuery] = useState("");
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const grouped = useMemo(() => {
    const q = query.trim().toLowerCase();
    return projects
      .map((project) => ({
        project,
        servers: project.serverIds
          .map((id) => servers.find((s) => s.id === id))
          .filter((s): s is Server => !!s)
          .filter((s) =>
            !q ||
            s.name.toLowerCase().includes(q) ||
            s.host.toLowerCase().includes(q) ||
            project.name.toLowerCase().includes(q),
          ),
      }))
      .filter((g) => g.servers.length > 0);
  }, [query]);

  const selectedServer = servers.find((s) => s.id === selectedServerId) ?? null;
  const selectedProject = selectedServer ? projectForServer(selectedServer.id) : undefined;
  const compatible = selectedServer ? compatiblePackages(selectedServer) : [];
  const currentVersion = selectedServer ? currentVersionForServer(selectedServer.name) : null;
  const recentDeploys = selectedServer
    ? deployments.filter((d) => d.serverName === selectedServer.name).slice(0, 4)
    : [];

  return (
    <AppShell title="Deployments" subtitle="Pick a server and deploy a compatible package.">
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(320px,420px)_1fr] gap-5">
        {/* LEFT — servers grouped by project */}
        <div className="section-card p-0 overflow-hidden flex flex-col max-h-[calc(100vh-180px)]">
          <div className="p-4 border-b border-border/60">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search servers, hosts, projects…"
                className="pl-8 h-9"
              />
            </div>
          </div>
          <div className="overflow-y-auto flex-1 p-2 space-y-3">
            {grouped.length === 0 && (
              <div className="text-center text-xs text-muted-foreground py-8">No servers match.</div>
            )}
            {grouped.map(({ project, servers: srvs }) => {
              const isCollapsed = collapsed[project.id];
              return (
                <div key={project.id} className="rounded-lg border border-border/60 bg-secondary/20">
                  <button
                    onClick={() =>
                      setCollapsed((prev) => ({ ...prev, [project.id]: !prev[project.id] }))
                    }
                    className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-secondary/40 rounded-t-lg transition-base"
                  >
                    {isCollapsed ? (
                      <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                    )}
                    <div
                      className={cn(
                        "h-5 w-5 rounded-md bg-gradient-to-br shrink-0",
                        project.color,
                      )}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold truncate">{project.name}</div>
                    </div>
                    <span className="text-[10px] text-muted-foreground tabular-nums">
                      {srvs.length}
                    </span>
                  </button>
                  {!isCollapsed && (
                    <div className="p-1.5 pt-0 space-y-1">
                      {srvs.map((s) => {
                        const active = s.id === selectedServerId;
                        const version = currentVersionForServer(s.name);
                        return (
                          <button
                            key={s.id}
                            onClick={() => setSelectedServerId(s.id)}
                            className={cn(
                              "w-full text-left rounded-md px-2.5 py-2 border transition-base",
                              active
                                ? "bg-primary/10 border-primary/40 shadow-sm"
                                : "bg-background border-border/60 hover:bg-secondary/50",
                            )}
                          >
                            <div className="flex items-center gap-2">
                              <ServerIcon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                              <span className="text-xs font-medium truncate flex-1">{s.name}</span>
                              <EnvBadge env={s.environment} />
                            </div>
                            <div className="mt-1.5 grid grid-cols-[auto_1fr] gap-x-2 gap-y-0.5 text-[10.5px] text-muted-foreground font-mono">
                              <span className="text-muted-foreground/70">ver</span>
                              <span className="text-foreground truncate">{version ?? "—"}</span>
                              <span className="text-muted-foreground/70">host</span>
                              <span className="truncate">{s.host}:{s.port}</span>
                              <span className="text-muted-foreground/70">user</span>
                              <span className="truncate">{s.user}</span>
                              <span className="text-muted-foreground/70">path</span>
                              <span className="truncate">{s.path}</span>
                            </div>
                            <div className="mt-1.5 flex items-center gap-1.5">
                              <span
                                className={cn(
                                  "h-1.5 w-1.5 rounded-full",
                                  s.status === "online" ? "bg-success" : "bg-inactive",
                                )}
                              />
                              <span className="text-[10px] text-muted-foreground capitalize">
                                {s.status} · {s.protocol}
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT — compatible packages for selected server */}
        <div className="space-y-5">
          {!selectedServer && (
            <div className="section-card p-10 text-center text-sm text-muted-foreground">
              Select a server to see compatible packages.
            </div>
          )}

          {selectedServer && (
            <>
              {/* Server header */}
              <div className="section-card p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <EnvBadge env={selectedServer.environment} />
                      <span
                        className={cn(
                          "inline-flex items-center gap-1.5 text-[11px] text-muted-foreground",
                        )}
                      >
                        <span
                          className={cn(
                            "h-1.5 w-1.5 rounded-full",
                            selectedServer.status === "online" ? "bg-success" : "bg-inactive",
                          )}
                        />
                        {selectedServer.status}
                      </span>
                      {selectedProject && (
                        <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                          <FolderGit2 className="h-3 w-3" />
                          {selectedProject.name}
                        </span>
                      )}
                    </div>
                    <h2 className="text-lg font-semibold truncate">{selectedServer.name}</h2>
                    <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-3 text-[11px]">
                      <MetaCell label="Current version" value={currentVersion ?? "—"} mono />
                      <MetaCell
                        label="Host"
                        value={`${selectedServer.host}:${selectedServer.port}`}
                        mono
                      />
                      <MetaCell label="User" value={selectedServer.user} mono />
                      <MetaCell label="Deploy path" value={selectedServer.path} mono />
                    </div>
                  </div>
                </div>
              </div>

              {/* Compatible packages */}
              <div className="section-card p-0 overflow-hidden">
                <div className="px-5 py-3 border-b border-border/60 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <PackageIcon className="h-4 w-4 text-muted-foreground" />
                    <h3 className="text-sm font-semibold">Compatible packages</h3>
                    <span className="text-[11px] text-muted-foreground tabular-nums">
                      {compatible.length}
                    </span>
                  </div>
                  <span className="text-[11px] text-muted-foreground">
                    Matched by project & environment
                  </span>
                </div>
                {compatible.length === 0 ? (
                  <div className="p-8 text-center text-sm text-muted-foreground">
                    No packages match this server's project and environment.
                  </div>
                ) : (
                  <ul className="divide-y divide-border/60">
                    {compatible.map((p) => {
                      const repo = repositories.find((r) => r.id === p.repositoryId);
                      const isCurrent = currentVersion === p.targetVersion;
                      return (
                        <li
                          key={p.id}
                          className="px-5 py-3.5 hover:bg-secondary/30 transition-base flex items-center gap-4"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <StatusBadge status={p.status} />
                              {isCurrent && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-medium text-success">
                                  <ShieldCheck className="h-3 w-3" /> currently deployed
                                </span>
                              )}
                            </div>
                            <div className="font-mono text-[11.5px] truncate">{p.name}</div>
                            <div className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-2 flex-wrap">
                              <span className="truncate">{repo?.name ?? "—"}</span>
                              <span>·</span>
                              <span className="font-mono">
                                {p.baseVersion} → {p.targetVersion}
                              </span>
                              <span>·</span>
                              <span>{p.createdBy}</span>
                              <span>·</span>
                              <span>{p.createdAt}</span>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            className="gap-1.5 shrink-0"
                            disabled={p.status !== "success"}
                          >
                            <Rocket className="h-3.5 w-3.5" />
                            Deploy
                          </Button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>

              {/* Recent deployments on this server */}
              <div className="section-card p-0 overflow-hidden">
                <div className="px-5 py-3 border-b border-border/60 flex items-center gap-2">
                  <History className="h-4 w-4 text-muted-foreground" />
                  <h3 className="text-sm font-semibold">Recent deployments</h3>
                </div>
                {recentDeploys.length === 0 ? (
                  <div className="p-6 text-center text-xs text-muted-foreground">
                    No deployments recorded on this server yet.
                  </div>
                ) : (
                  <ul className="divide-y divide-border/60">
                    {recentDeploys.map((d) => (
                      <li key={d.id} className="px-5 py-2.5 flex items-center gap-3 text-xs">
                        <StatusBadge status={d.status} />
                        <span className="font-mono text-[11px] truncate flex-1">
                          {d.packageName}
                        </span>
                        <span className="text-muted-foreground">{d.deployedBy}</span>
                        <span className="text-muted-foreground tabular-nums">{d.duration}</span>
                        <span className="text-muted-foreground">{d.deployedAt}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </AppShell>
  );
};

const MetaCell = ({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) => (
  <div className="min-w-0">
    <div className="text-muted-foreground uppercase tracking-wider text-[9.5px]">{label}</div>
    <div className={cn("truncate mt-0.5", mono && "font-mono text-[11.5px]")}>{value}</div>
  </div>
);

export default Deployments;
