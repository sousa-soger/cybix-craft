import { useMemo, useState } from "react";
import {
  Plus,
  Github,
  GitlabIcon as Gitlab,
  HardDrive,
  Server as ServerIcon,
  Search,
  GitBranch,
  Tag,
  Users,
  Trash2,
  X,
  Crown,
  Mail,
  UserPlus,
  FolderKanban,
  ChevronRight,
  ChevronDown,
  RefreshCw,
  KeyRound,
  CalendarDays,
  ExternalLink,
  LayoutGrid,
  List as ListIcon,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EnvBadge } from "@/components/badges";
import {
  projects as initialProjects,
  repositories as allRepos,
  servers as allServers,
  ROLE_META,
  type Project,
  type RepoMember,
  type RepoProvider,
  type Repository,
  type Server,
  type TeamRole,
} from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const providerIcon = (p: RepoProvider, cls = "h-4 w-4") => {
  switch (p) {
    case "github": return <Github className={cls} />;
    case "gitlab": return <Gitlab className={cls} />;
    case "company-server": return <ServerIcon className={cls} />;
    case "local-pc": return <HardDrive className={cls} />;
  }
};

const StatusPill = ({ status }: { status: Repository["status"] }) => (
  <span
    className={cn(
      "inline-flex items-center gap-1.5 text-[10px] font-semibold px-2 py-0.5 rounded-md border whitespace-nowrap",
      status === "connected" && "bg-success/10 text-success border-success/30",
      status === "expired" && "bg-queued/10 text-queued border-queued/30",
      status === "needs-auth" && "bg-failed/10 text-failed border-failed/30",
    )}
  >
    <span className="h-1.5 w-1.5 rounded-full bg-current" />
    {status === "connected" ? "Connected" : status === "expired" ? "Expired" : "Needs auth"}
  </span>
);

const Projects = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [query, setQuery] = useState("");
  const [view, setView] = useState<"card" | "list">("card");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [activeId, setActiveId] = useState<string | null>(null);

  const toggleExpand = (id: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const filtered = useMemo(() => {
    if (!query.trim()) return projects;
    const q = query.toLowerCase();
    return projects.filter((p) => p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q));
  }, [projects, query]);

  const active = projects.find((p) => p.id === activeId) ?? null;

  const updateProject = (id: string, patch: Partial<Project>) =>
    setProjects((all) => all.map((p) => (p.id === id ? { ...p, ...patch } : p)));

  return (
    <AppShell
      title="Projects"
      subtitle="Group repositories, servers and people into a single workspace."
      actions={
        <Button variant="brand" size="sm" onClick={() => toast.info("New project flow")}>
          <Plus className="h-4 w-4" /> New Project
        </Button>
      }
    >
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <div className="relative flex-1 min-w-[220px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search projects…"
            className="pl-9"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className="ml-auto inline-flex items-center rounded-lg border border-border/70 bg-card p-1 shadow-sm">
          <button
            onClick={() => setView("card")}
            className={cn(
              "px-2.5 py-1.5 rounded-md text-xs font-semibold inline-flex items-center gap-1.5 transition-base",
              view === "card" ? "brand-soft-bg text-foreground shadow-soft" : "text-muted-foreground hover:text-foreground",
            )}
            aria-label="Card view"
          >
            <LayoutGrid className="h-3.5 w-3.5" /> Cards
          </button>
          <button
            onClick={() => setView("list")}
            className={cn(
              "px-2.5 py-1.5 rounded-md text-xs font-semibold inline-flex items-center gap-1.5 transition-base",
              view === "list" ? "brand-soft-bg text-foreground shadow-soft" : "text-muted-foreground hover:text-foreground",
            )}
            aria-label="List view"
          >
            <ListIcon className="h-3.5 w-3.5" /> List
          </button>
        </div>
        <div className="text-xs text-muted-foreground tabular-nums">
          {filtered.length} of {projects.length}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="section-card p-12 text-center">
          <div className="mx-auto h-12 w-12 rounded-xl brand-soft-bg flex items-center justify-center mb-3">
            <FolderKanban className="h-5 w-5 text-primary" />
          </div>
          <div className="text-sm font-semibold">No projects found</div>
          <p className="text-xs text-muted-foreground mt-1">
            {query ? "Try a different search." : "Create your first project to group repositories and servers."}
          </p>
        </div>
      ) : view === "card" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((p) => {
            const owner = allRepos.flatMap((r) => r.members).find((m) => m.id === p.ownerId);
            const repos = allRepos.filter((r) => p.repositoryIds.includes(r.id));
            const servers = allServers.filter((s) => p.serverIds.includes(s.id));
            return (
              <button
                key={p.id}
                onClick={() => setActiveId(p.id)}
                className="section-card text-left p-5 group hover:border-primary/40 hover:shadow-soft transition-base relative overflow-hidden"
              >
                <div className={cn("absolute -top-12 -right-12 h-32 w-32 rounded-full bg-gradient-to-br opacity-20 blur-2xl pointer-events-none", p.color)} />
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className={cn("h-10 w-10 rounded-lg flex items-center justify-center text-[hsl(var(--on-brand))] shrink-0 bg-gradient-to-br shadow-soft", p.color)}>
                    <FolderKanban className="h-5 w-5" />
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-base" />
                </div>
                <div className="text-base font-bold truncate">{p.name}</div>
                <div className="text-[11px] text-muted-foreground mt-1 line-clamp-2 min-h-[2rem]">{p.description}</div>
                {owner && (
                  <div className="mt-3 flex items-center gap-2 rounded-lg border border-border/60 bg-secondary/30 px-2 py-1.5">
                    <Avatar className="h-6 w-6 shrink-0">
                      <AvatarFallback className="brand-gradient-bg text-[hsl(var(--on-brand))] text-[10px] font-semibold">
                        {owner.initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="text-[11px] font-semibold truncate inline-flex items-center gap-1">
                        <Crown className="h-2.5 w-2.5 text-primary" /> {owner.name}
                      </div>
                      <div className="text-[10px] text-muted-foreground truncate">Owner</div>
                    </div>
                  </div>
                )}
                <div className="mt-3 flex flex-wrap items-center gap-1.5">
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-secondary/70 text-muted-foreground inline-flex items-center gap-1">
                    <GitBranch className="h-2.5 w-2.5" /> {repos.length} repos
                  </span>
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-secondary/70 text-muted-foreground inline-flex items-center gap-1">
                    <ServerIcon className="h-2.5 w-2.5" /> {servers.length} servers
                  </span>
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-secondary/70 text-muted-foreground inline-flex items-center gap-1">
                    <Users className="h-2.5 w-2.5" /> {p.memberIds.length}
                  </span>
                </div>
                <div className="mt-3 text-[11px] text-muted-foreground inline-flex items-center gap-1">
                  <CalendarDays className="h-3 w-3" /> Created {p.createdAt}
                </div>
              </button>
            );
          })}
          {/* Add tile */}
          <button
            onClick={() => toast.info("New project flow")}
            className="rounded-2xl border border-dashed border-border/70 hover:border-primary/50 hover:bg-secondary/30 transition-base p-5 flex flex-col items-center justify-center gap-2 min-h-[200px]"
          >
            <div className="h-10 w-10 rounded-lg brand-soft-bg flex items-center justify-center text-primary">
              <Plus className="h-5 w-5" />
            </div>
            <div className="text-sm font-semibold">New Project</div>
            <div className="text-[11px] text-muted-foreground">Group repositories and servers</div>
          </button>
        </div>
      ) : (
        <div className="section-card p-0 overflow-hidden">
          <div className="grid grid-cols-[auto_minmax(0,2fr)_minmax(0,1.2fr)_auto_auto_auto] gap-3 px-5 py-2.5 text-[10px] uppercase tracking-wider text-muted-foreground bg-secondary/40 border-b border-border/60 font-semibold">
            <div />
            <div>Project</div>
            <div className="hidden md:block">Owner</div>
            <div className="hidden md:block text-right">Repos</div>
            <div className="hidden md:block text-right">Servers</div>
            <div className="text-right">Members</div>
          </div>
          <ul className="divide-y divide-border/60">
            {filtered.map((p) => {
              const owner = allRepos.flatMap((r) => r.members).find((m) => m.id === p.ownerId);
              const repos = allRepos.filter((r) => p.repositoryIds.includes(r.id));
              const servers = allServers.filter((s) => p.serverIds.includes(s.id));
              const isOpen = expanded.has(p.id);
              return (
                <li key={p.id}>
                  <div className="grid grid-cols-[auto_minmax(0,2fr)_minmax(0,1.2fr)_auto_auto_auto] gap-3 items-center px-5 py-3 hover:bg-secondary/40 transition-base">
                    <button
                      onClick={() => toggleExpand(p.id)}
                      className="h-7 w-7 rounded-md flex items-center justify-center text-muted-foreground hover:bg-secondary"
                      aria-label={isOpen ? "Collapse" : "Expand"}
                    >
                      {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    </button>
                    <button
                      onClick={() => setActiveId(p.id)}
                      className="flex items-center gap-3 min-w-0 text-left"
                    >
                      <div className={cn("h-9 w-9 rounded-md flex items-center justify-center text-[hsl(var(--on-brand))] shrink-0 bg-gradient-to-br shadow-soft", p.color)}>
                        <FolderKanban className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-semibold truncate">{p.name}</div>
                        <div className="text-[11px] text-muted-foreground truncate">{p.description}</div>
                      </div>
                    </button>
                    <div className="hidden md:flex items-center gap-2 min-w-0">
                      {owner ? (
                        <>
                          <Avatar className="h-6 w-6 shrink-0">
                            <AvatarFallback className="brand-gradient-bg text-[hsl(var(--on-brand))] text-[10px] font-semibold">
                              {owner.initials}
                            </AvatarFallback>
                          </Avatar>
                          <div className="text-xs font-semibold truncate inline-flex items-center gap-1">
                            <Crown className="h-2.5 w-2.5 text-primary" /> {owner.name}
                          </div>
                        </>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </div>
                    <div className="hidden md:block text-xs text-muted-foreground tabular-nums text-right">{repos.length}</div>
                    <div className="hidden md:block text-xs text-muted-foreground tabular-nums text-right">{servers.length}</div>
                    <div className="text-xs text-muted-foreground tabular-nums text-right">{p.memberIds.length}</div>
                  </div>
                  {isOpen && (
                    <div className="px-5 pb-4 pt-1 bg-secondary/20 border-t border-border/40 grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Repositories */}
                      <div>
                        <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-2 inline-flex items-center gap-1.5">
                          <GitBranch className="h-3 w-3" /> Repositories · {repos.length}
                        </div>
                        {repos.length === 0 ? (
                          <div className="text-[11px] text-muted-foreground italic">No repositories attached.</div>
                        ) : (
                          <ul className="space-y-1.5">
                            {repos.map((r) => (
                              <li key={r.id}>
                                <button
                                  onClick={() => navigate("/repositories")}
                                  className="w-full flex items-center gap-2.5 rounded-md border border-border/60 bg-card px-2.5 py-2 hover:border-primary/40 hover:shadow-soft transition-base text-left"
                                >
                                  <div className="h-7 w-7 rounded brand-soft-bg flex items-center justify-center text-primary shrink-0">
                                    {providerIcon(r.provider, "h-3.5 w-3.5")}
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <div className="text-xs font-semibold font-mono truncate">{r.name}</div>
                                    <div className="text-[10px] text-muted-foreground truncate inline-flex items-center gap-2">
                                      <span className="inline-flex items-center gap-1"><GitBranch className="h-2.5 w-2.5" />{r.branches.length}</span>
                                      <span className="inline-flex items-center gap-1"><Tag className="h-2.5 w-2.5" />{r.tags.length}</span>
                                      <span>default · {r.defaultBranch}</span>
                                    </div>
                                  </div>
                                  <StatusPill status={r.status} />
                                </button>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                      {/* Servers */}
                      <div>
                        <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-2 inline-flex items-center gap-1.5">
                          <ServerIcon className="h-3 w-3" /> Servers · {servers.length}
                        </div>
                        {servers.length === 0 ? (
                          <div className="text-[11px] text-muted-foreground italic">No servers attached.</div>
                        ) : (
                          <ul className="space-y-1.5">
                            {servers.map((s) => (
                              <li key={s.id}>
                                <button
                                  onClick={() => navigate("/servers")}
                                  className="w-full flex items-center gap-2.5 rounded-md border border-border/60 bg-card px-2.5 py-2 hover:border-primary/40 hover:shadow-soft transition-base text-left"
                                >
                                  <div className="h-7 w-7 rounded brand-soft-bg flex items-center justify-center text-primary shrink-0">
                                    <ServerIcon className="h-3.5 w-3.5" />
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <div className="text-xs font-semibold font-mono truncate">{s.name}</div>
                                    <div className="text-[10px] text-muted-foreground truncate">
                                      {s.protocol} · {s.host} · {s.path}
                                    </div>
                                  </div>
                                  <EnvBadge env={s.environment} />
                                  <span
                                    className={cn(
                                      "inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded border whitespace-nowrap",
                                      s.status === "online"
                                        ? "bg-success/10 text-success border-success/30"
                                        : "bg-failed/10 text-failed border-failed/30",
                                    )}
                                  >
                                    <span className="h-1.5 w-1.5 rounded-full bg-current" />
                                    {s.status}
                                  </span>
                                </button>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <ProjectDetailsSheet
        project={active}
        open={!!active}
        onOpenChange={(o) => !o && setActiveId(null)}
        onUpdate={updateProject}
        onNavigate={navigate}
      />
    </AppShell>
  );
};

export default Projects;

/* ------------------------------ Sheet ------------------------------ */

interface SheetProps {
  project: Project | null;
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onUpdate: (id: string, patch: Partial<Project>) => void;
  onNavigate: (path: string) => void;
}

const AUTH_LABEL: Record<string, string> = {
  oauth: "OAuth",
  pat: "Personal Access Token",
  ssh: "SSH key",
  userpass: "User / Password",
};

const ProjectDetailsSheet = ({ project, open, onOpenChange, onUpdate, onNavigate }: SheetProps) => {
  const [expandedRepos, setExpandedRepos] = useState<Set<string>>(new Set());
  const [expandedServers, setExpandedServers] = useState<Set<string>>(new Set());
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<TeamRole>("maintainer");
  const [serverIgnores, setServerIgnores] = useState<Record<string, string>>({});
  const [ignoreEditing, setIgnoreEditing] = useState<Set<string>>(new Set());

  const DEFAULT_IGNORE = `# .ignore — files & folders excluded from deployment
node_modules/
.git/
.env
.env.*
dist/
build/
*.log
.DS_Store
coverage/
`;

  const toggleRepo = (id: string) =>
    setExpandedRepos((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });

  const toggleServer = (id: string) =>
    setExpandedServers((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });

  const repos = useMemo<Repository[]>(
    () => (project ? allRepos.filter((r) => project.repositoryIds.includes(r.id)) : []),
    [project],
  );
  const servers = useMemo<Server[]>(
    () => (project ? allServers.filter((s) => project.serverIds.includes(s.id)) : []),
    [project],
  );

  const members = useMemo<RepoMember[]>(() => {
    if (!project) return [];
    const pool = allRepos.flatMap((r) => r.members);
    const seen = new Set<string>();
    const list: RepoMember[] = [];
    for (const id of project.memberIds) {
      const m = pool.find((x) => x.id === id);
      if (m && !seen.has(m.id)) {
        seen.add(m.id);
        list.push(m.id === project.ownerId ? { ...m, role: "owner" } : m);
      }
    }
    const order: TeamRole[] = ["owner", "maintainer", "creator", "deployer", "viewer"];
    return list.sort((a, b) => order.indexOf(a.role) - order.indexOf(b.role));
  }, [project]);

  if (!project) return null;

  const owner = members.find((m) => m.id === project.ownerId);

  const handleInvite = () => {
    const email = inviteEmail.trim();
    if (!email) return;
    toast.success("Invite sent", { description: `${email} as ${ROLE_META[inviteRole].label}` });
    setInviteEmail("");
  };

  const handleRoleChange = (memberId: string, role: TeamRole) => {
    toast.success("Role updated", { description: ROLE_META[role].label });
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[94vh]">
        <div className="mx-auto w-full max-w-[1400px] flex flex-col overflow-hidden">
          {/* TOP — Project details (full width) */}
          <div className="relative px-6 pt-3 pb-5 border-b border-border/60">
            <div className={cn("absolute -top-10 right-12 h-40 w-60 rounded-full bg-gradient-to-br opacity-20 blur-3xl pointer-events-none", project.color)} />
            <div className="flex items-start gap-4">
              <div className={cn("h-14 w-14 rounded-2xl flex items-center justify-center text-[hsl(var(--on-brand))] shrink-0 shadow-soft bg-gradient-to-br", project.color)}>
                <FolderKanban className="h-6 w-6" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-lg font-bold truncate">{project.name}</h2>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md border border-primary/30 bg-primary/5 text-primary">
                    PROJECT
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1 max-w-3xl">{project.description}</p>
                <div className="mt-3 flex flex-wrap items-center gap-1.5">
                  {owner && (
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold pl-1 pr-2 py-0.5 rounded-full border border-primary/30 bg-primary/5 text-foreground">
                      <Avatar className="h-4 w-4">
                        <AvatarFallback className="brand-gradient-bg text-[hsl(var(--on-brand))] text-[8px] font-semibold">
                          {owner.initials}
                        </AvatarFallback>
                      </Avatar>
                      <Crown className="h-2.5 w-2.5 text-primary" />
                      Owner · {owner.name}
                    </span>
                  )}
                  <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-secondary/70 text-muted-foreground inline-flex items-center gap-1">
                    <GitBranch className="h-3 w-3" /> {repos.length} repositories
                  </span>
                  <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-secondary/70 text-muted-foreground inline-flex items-center gap-1">
                    <ServerIcon className="h-3 w-3" /> {servers.length} servers
                  </span>
                  <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-secondary/70 text-muted-foreground inline-flex items-center gap-1">
                    <Users className="h-3 w-3" /> {members.length} members
                  </span>
                  <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-secondary/70 text-muted-foreground inline-flex items-center gap-1">
                    <CalendarDays className="h-3 w-3" /> {project.createdAt}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Button variant="ghost" size="icon" className="h-9 w-9 text-failed hover:text-failed" onClick={() => toast.info("Delete project")} aria-label="Delete">
                  <Trash2 className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => onOpenChange(false)} aria-label="Close">
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* BOTTOM — 3-column layout */}
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)_minmax(0,1.2fr)] gap-0 overflow-y-auto">
            {/* Members & Roles */}
            <section className="p-5 border-b lg:border-b-0 lg:border-r border-border/60 bg-secondary/20">
              <div className="flex items-center justify-between mb-3">
                <div className="text-sm font-semibold inline-flex items-center gap-2">
                  <Users className="h-4 w-4 text-primary" /> Members & Roles
                  <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-secondary text-muted-foreground ml-1">
                    {members.length}
                  </span>
                </div>
              </div>

              <div className="rounded-xl border border-border/70 bg-card p-3 mb-3">
                <div className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2">Add member</div>
                <div className="flex flex-col gap-2">
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      placeholder="Search LDAP user…"
                      className="pl-9 h-9"
                      onKeyDown={(e) => e.key === "Enter" && handleInvite()}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as TeamRole)}>
                      <SelectTrigger className="flex-1 h-9 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {(Object.keys(ROLE_META) as TeamRole[]).filter((r) => r !== "owner").map((r) => (
                          <SelectItem key={r} value={r}>
                            <span className="flex items-center gap-2">
                              <span className={cn("h-2.5 w-2.5 rounded-full bg-gradient-to-br", ROLE_META[r].color)} />
                              {ROLE_META[r].label}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button variant="brand" size="sm" onClick={handleInvite} disabled={!inviteEmail.trim()}>
                      <UserPlus className="h-4 w-4" /> Invite
                    </Button>
                  </div>
                </div>
              </div>

              <ul className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
                {members.map((m) => {
                  const isOwner = m.role === "owner";
                  const meta = ROLE_META[m.role];
                  return (
                    <li
                      key={m.id}
                      className="group flex items-center gap-2.5 rounded-lg border border-border/60 bg-card p-2.5 hover:shadow-soft transition-base"
                    >
                      <Avatar className="h-8 w-8 shrink-0">
                        <AvatarFallback className="brand-gradient-bg text-[hsl(var(--on-brand))] text-xs font-semibold">
                          {m.initials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-semibold truncate flex items-center gap-1.5">
                          {m.name}
                          {isOwner && <Crown className="h-3 w-3 text-primary" />}
                        </div>
                        <div className="text-[10px] text-muted-foreground truncate">{m.email}</div>
                      </div>
                      <Select
                        value={m.role}
                        onValueChange={(v) => handleRoleChange(m.id, v as TeamRole)}
                        disabled={isOwner}
                      >
                        <SelectTrigger className="h-7 w-[120px] text-[11px]">
                          <span className="flex items-center gap-1.5">
                            <span className={cn("h-2 w-2 rounded-full bg-gradient-to-br", meta.color)} />
                            <SelectValue />
                          </span>
                        </SelectTrigger>
                        <SelectContent>
                          {(Object.keys(ROLE_META) as TeamRole[]).map((r) => (
                            <SelectItem key={r} value={r}>
                              <span className="flex items-center gap-2">
                                <span className={cn("h-2.5 w-2.5 rounded-full bg-gradient-to-br", ROLE_META[r].color)} />
                                {ROLE_META[r].label}
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </li>
                  );
                })}
              </ul>
            </section>

            {/* Repository list */}
            <section className="p-5 border-b lg:border-b-0 lg:border-r border-border/60">
              <div className="flex items-center justify-between mb-3">
                <div className="text-sm font-semibold inline-flex items-center gap-2">
                  <GitBranch className="h-4 w-4 text-primary" /> Repositories
                  <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-secondary text-muted-foreground ml-1">
                    {repos.length}
                  </span>
                </div>
                <Button variant="ghost" size="sm" onClick={() => onNavigate("/repositories")}>
                  <Plus className="h-3.5 w-3.5" /> Attach
                </Button>
              </div>
              <ul className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                {repos.map((r) => {
                  const isOpen = expandedRepos.has(r.id);
                  const authLabel = AUTH_LABEL[r.authMethod] ?? r.authMethod;
                  const isOAuth = r.authMethod === "oauth";
                  return (
                  <li
                    key={r.id}
                    className="rounded-lg border border-border/60 bg-card hover:border-primary/40 hover:shadow-soft transition-base overflow-hidden"
                  >
                    <button
                      type="button"
                      onClick={() => toggleRepo(r.id)}
                      className="w-full text-left p-3 flex items-start gap-3"
                      aria-expanded={isOpen}
                    >
                      <div className="h-9 w-9 rounded-md brand-soft-bg flex items-center justify-center text-primary shrink-0">
                        {providerIcon(r.provider, "h-4 w-4")}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <div className="text-xs font-semibold font-mono truncate">{r.name}</div>
                          <StatusPill status={r.status} />
                        </div>
                        <div className="text-[10px] text-muted-foreground truncate mt-0.5 inline-flex items-center gap-1">
                          {r.url}
                          {r.url.startsWith("http") && <ExternalLink className="h-2.5 w-2.5" />}
                        </div>
                        <div className="mt-2 flex flex-wrap items-center gap-1.5">
                          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-secondary/70 text-muted-foreground inline-flex items-center gap-1">
                            <GitBranch className="h-2.5 w-2.5" /> {r.branches.length}
                          </span>
                          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-secondary/70 text-muted-foreground inline-flex items-center gap-1">
                            <Tag className="h-2.5 w-2.5" /> {r.tags.length}
                          </span>
                          <span className="text-[10px] text-muted-foreground">· {r.defaultBranch}</span>
                        </div>
                      </div>
                      <ChevronDown
                        className={cn(
                          "h-4 w-4 text-muted-foreground shrink-0 transition-transform",
                          isOpen && "rotate-180",
                        )}
                      />
                    </button>
                    {isOpen && (
                      <div className="border-t border-border/60 bg-secondary/30 px-3 py-3 space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">
                              Connection type
                            </div>
                            <div className="text-xs font-semibold inline-flex items-center gap-1.5">
                              <KeyRound className="h-3 w-3 text-primary" />
                              {authLabel}
                            </div>
                          </div>
                          <div>
                            <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">
                              Default branch
                            </div>
                            <div className="text-xs font-semibold font-mono inline-flex items-center gap-1.5">
                              <GitBranch className="h-3 w-3 text-primary" />
                              {r.defaultBranch}
                            </div>
                          </div>
                          <div>
                            <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">
                              Synced
                            </div>
                            <div className="text-xs font-semibold">{r.lastSyncedAt}</div>
                          </div>
                          <div>
                            <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">
                              Last verified
                            </div>
                            <div className="text-xs font-semibold">{r.lastVerifiedAt}</div>
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 pt-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => toast.success("Syncing…", { description: r.name })}
                          >
                            <RefreshCw className="h-3.5 w-3.5" /> Sync now
                          </Button>
                          <Button
                            variant="soft"
                            size="sm"
                            onClick={() =>
                              toast.info(
                                isOAuth ? `Reconnect ${authLabel}` : `Update ${authLabel}`,
                                { description: r.name },
                              )
                            }
                          >
                            <KeyRound className="h-3.5 w-3.5" />
                            {isOAuth ? `Reconnect ${authLabel}` : `Update ${authLabel}`}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="ml-auto"
                            onClick={() => onNavigate("/repositories")}
                          >
                            Open <ExternalLink className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </li>
                  );
                })}
                {repos.length === 0 && (
                  <div className="text-center py-8 text-xs text-muted-foreground border border-dashed rounded-lg">
                    No repositories attached.
                  </div>
                )}
              </ul>
            </section>

            {/* Servers */}
            <section className="p-5 bg-secondary/10">
              <div className="flex items-center justify-between mb-3">
                <div className="text-sm font-semibold inline-flex items-center gap-2">
                  <ServerIcon className="h-4 w-4 text-primary" /> Servers
                  <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-secondary text-muted-foreground ml-1">
                    {servers.length}
                  </span>
                </div>
                <Button variant="ghost" size="sm" onClick={() => onNavigate("/servers")}>
                  <Plus className="h-3.5 w-3.5" /> Add
                </Button>
              </div>
              <ul className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                {servers.map((s) => {
                  const isOpen = expandedServers.has(s.id);
                  return (
                    <li
                      key={s.id}
                      className="rounded-lg border border-border/60 bg-card hover:border-primary/40 hover:shadow-soft transition-base overflow-hidden"
                    >
                      <button
                        type="button"
                        onClick={() => toggleServer(s.id)}
                        className="w-full text-left p-3 flex items-start gap-3"
                        aria-expanded={isOpen}
                      >
                        <div className="h-9 w-9 rounded-md brand-soft-bg flex items-center justify-center text-primary shrink-0">
                          <ServerIcon className="h-4 w-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <div className="text-xs font-semibold font-mono truncate">{s.name}</div>
                            <span
                              className={cn(
                                "inline-flex items-center gap-1.5 text-[10px] font-semibold px-2 py-0.5 rounded-md border whitespace-nowrap",
                                s.status === "online"
                                  ? "bg-success/10 text-success border-success/30"
                                  : "bg-inactive/15 text-inactive border-inactive/30",
                              )}
                            >
                              <span className={cn("h-1.5 w-1.5 rounded-full bg-current", s.status === "online" && "animate-pulse-soft")} />
                              {s.status === "online" ? "Online" : "Offline"}
                            </span>
                          </div>
                          <div className="text-[10px] text-muted-foreground truncate mt-0.5 inline-flex items-center gap-1">
                            {s.protocol} · {s.host}
                          </div>
                          <div className="mt-2 flex flex-wrap items-center gap-1.5">
                            <EnvBadge env={s.environment} />
                          </div>
                        </div>
                        <ChevronDown
                          className={cn(
                            "h-4 w-4 text-muted-foreground shrink-0 transition-transform",
                            isOpen && "rotate-180",
                          )}
                        />
                      </button>
                      {isOpen && (
                        <div className="border-t border-border/60 bg-secondary/30 px-3 py-3 space-y-3">
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">
                                Protocol
                              </div>
                              <div className="text-xs font-semibold">{s.protocol}</div>
                            </div>
                            <div>
                              <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">
                                Environment
                              </div>
                              <EnvBadge env={s.environment} />
                            </div>
                            <div>
                              <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">
                                Host
                              </div>
                              <div className="text-xs font-semibold font-mono">{s.host}</div>
                            </div>
                            <div>
                              <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">
                                Deploy path
                              </div>
                              <div className="text-xs font-semibold font-mono">{s.path}</div>
                            </div>
                          </div>
                          <div className="flex flex-wrap items-center gap-2 pt-1">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => toast.success("Pinging server…", { description: s.name })}
                            >
                              <RefreshCw className="h-3.5 w-3.5" /> Test
                            </Button>
                            <Button
                              variant="brand"
                              size="sm"
                              onClick={() => onNavigate("/deployments")}
                            >
                              Deploy
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="ml-auto"
                              onClick={() => onNavigate("/servers")}
                            >
                              Open <ExternalLink className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </li>
                  );
                })}
                {servers.length === 0 && (
                  <div className="text-center py-8 text-xs text-muted-foreground border border-dashed rounded-lg">
                    No servers attached.
                  </div>
                )}
              </ul>
            </section>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
};

const DetailRow = ({ label, value, mono }: { label: string; value: React.ReactNode; mono?: boolean }) => (
  <div className="flex items-start justify-between gap-3">
    <div className="text-[10px] uppercase tracking-wider text-muted-foreground pt-0.5">{label}</div>
    <div className={cn("text-xs font-semibold text-right break-all", mono && "font-mono")}>{value}</div>
  </div>
);
