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
  KeyRound,
  RefreshCw,
  Trash2,
  X,
  ExternalLink,
  Crown,
  Mail,
  UserPlus,
  Package as PackageIcon,
  ChevronRight,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { EnvBadge } from "@/components/badges";
import { ConnectRepositoryDialog } from "@/components/connect-repository-dialog";
import {
  repositories as initialRepos,
  servers as initialServers,
  ROLE_META,
  type RepoAuthMethod,
  type RepoMember,
  type RepoProvider,
  type Repository,
  type Server,
  type TeamRole,
} from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type Tab = "repositories" | "servers";

const providerIcon = (p: RepoProvider, cls = "h-4 w-4") => {
  switch (p) {
    case "github": return <Github className={cls} />;
    case "gitlab": return <Gitlab className={cls} />;
    case "company-server": return <ServerIcon className={cls} />;
    case "local-pc": return <HardDrive className={cls} />;
  }
};

const AUTH_LABEL: Record<RepoAuthMethod, string> = {
  oauth: "OAuth",
  pat: "Personal Access Token",
  ssh: "SSH key",
  userpass: "User / Password",
};

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div>
    <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">{label}</div>
    {children}
  </div>
);

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
  const [tab, setTab] = useState<Tab>("repositories");
  const [repos, setRepos] = useState<Repository[]>(initialRepos);
  const [servers, setServers] = useState<Server[]>(initialServers);
  const [query, setQuery] = useState("");
  const [activeRepoId, setActiveRepoId] = useState<string | null>(initialRepos[0]?.id ?? null);
  const [activeServerId, setActiveServerId] = useState<string | null>(initialServers[0]?.id ?? null);
  const [connectOpen, setConnectOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<TeamRole>("maintainer");

  const filteredRepos = useMemo(() => {
    if (!query.trim()) return repos;
    const q = query.toLowerCase();
    return repos.filter((r) => r.name.toLowerCase().includes(q) || r.url.toLowerCase().includes(q));
  }, [repos, query]);

  const filteredServers = useMemo(() => {
    if (!query.trim()) return servers;
    const q = query.toLowerCase();
    return servers.filter((s) => s.name.toLowerCase().includes(q) || s.host.toLowerCase().includes(q));
  }, [servers, query]);

  const activeRepo = repos.find((r) => r.id === activeRepoId) ?? null;
  const activeServer = servers.find((s) => s.id === activeServerId) ?? null;

  const updateRepo = (id: string, patch: Partial<Repository>) =>
    setRepos((all) => all.map((r) => (r.id === id ? { ...r, ...patch } : r)));

  const removeRepo = (id: string) => {
    setRepos((all) => all.filter((r) => r.id !== id));
    setActiveRepoId(null);
    toast.success("Repository disconnected");
  };

  const removeServer = (id: string) => {
    setServers((all) => all.filter((s) => s.id !== id));
    setActiveServerId(null);
    toast.success("Server removed");
  };

  const handleVerify = () => {
    if (!activeRepo) return;
    toast.success("Verifying credentials…", { description: activeRepo.name });
    window.setTimeout(() => {
      updateRepo(activeRepo.id, { status: "connected", lastVerifiedAt: "Just now", lastSyncedAt: "Just now" });
      toast.success("Verified", { description: `${activeRepo.name} is connected.` });
    }, 800);
  };

  const handleAuthChange = (method: RepoAuthMethod) => {
    if (!activeRepo) return;
    updateRepo(activeRepo.id, { authMethod: method });
    toast.success("Auth method updated", { description: AUTH_LABEL[method] });
  };

  const handleRoleChange = (memberId: string, role: TeamRole) => {
    if (!activeRepo) return;
    const next = activeRepo.members.map((m) => (m.id === memberId ? { ...m, role } : m));
    updateRepo(activeRepo.id, { members: next });
    toast.success("Role updated", { description: ROLE_META[role].label });
  };

  const handleRemoveMember = (memberId: string) => {
    if (!activeRepo) return;
    const m = activeRepo.members.find((x) => x.id === memberId);
    updateRepo(activeRepo.id, { members: activeRepo.members.filter((x) => x.id !== memberId) });
    toast.success("Member removed", { description: m?.name });
  };

  const handleInvite = () => {
    if (!activeRepo) return;
    const email = inviteEmail.trim();
    if (!email) return;
    const newMember: RepoMember = {
      id: `m-${Date.now()}`,
      name: email.split("@")[0],
      email,
      initials: email.slice(0, 2).toUpperCase(),
      role: inviteRole,
      status: "pending",
    };
    updateRepo(activeRepo.id, { members: [...activeRepo.members, newMember] });
    setInviteEmail("");
    toast.success("Invite sent", { description: `${email} as ${ROLE_META[inviteRole].label}` });
  };

  const sortedMembers = useMemo<RepoMember[]>(() => {
    if (!activeRepo) return [];
    const order: TeamRole[] = ["owner", "maintainer", "creator", "deployer", "viewer"];
    return [...activeRepo.members].sort((a, b) => order.indexOf(a.role) - order.indexOf(b.role));
  }, [activeRepo]);

  return (
    <AppShell
      title="Projects"
      subtitle="Unified workspace for repositories and deployment servers."
      actions={
        <Button
          variant="brand"
          size="sm"
          onClick={() => (tab === "repositories" ? setConnectOpen(true) : toast.info("Add Server flow"))}
        >
          <Plus className="h-4 w-4" /> {tab === "repositories" ? "Connect Repository" : "Add Server"}
        </Button>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-4 min-h-[calc(100vh-180px)]">
        {/* LEFT — List column */}
        <aside className="section-card p-0 overflow-hidden flex flex-col">
          {/* Tabs */}
          <div className="p-2 border-b border-border/60">
            <div className="inline-flex w-full rounded-lg border border-border/70 bg-card p-1">
              {(["repositories", "servers"] as Tab[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={cn(
                    "flex-1 px-2.5 py-1.5 rounded-md text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-base capitalize",
                    tab === t ? "brand-soft-bg text-foreground shadow-soft" : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {t === "repositories" ? <GitBranch className="h-3.5 w-3.5" /> : <ServerIcon className="h-3.5 w-3.5" />}
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Search */}
          <div className="p-3 border-b border-border/60">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder={`Search ${tab}…`}
                className="pl-8 h-9 text-sm"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto">
            {tab === "repositories" && (
              <ul className="p-2 space-y-1">
                {filteredRepos.map((r) => {
                  const isActive = r.id === activeRepoId;
                  return (
                    <li key={r.id}>
                      <button
                        onClick={() => setActiveRepoId(r.id)}
                        className={cn(
                          "w-full text-left px-3 py-2.5 rounded-lg flex items-center gap-3 transition-base group",
                          isActive ? "brand-soft-bg shadow-soft" : "hover:bg-secondary/60",
                        )}
                      >
                        <div className={cn(
                          "h-8 w-8 rounded-md flex items-center justify-center shrink-0",
                          isActive ? "bg-primary/15 text-primary" : "bg-secondary text-muted-foreground",
                        )}>
                          {providerIcon(r.provider, "h-4 w-4")}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-semibold font-mono truncate">{r.name}</div>
                          <div className="text-[10px] text-muted-foreground truncate">
                            {r.defaultBranch} · {r.branches.length}br
                          </div>
                        </div>
                        <ChevronRight className={cn("h-3.5 w-3.5 shrink-0 transition-base", isActive ? "text-primary" : "text-muted-foreground opacity-0 group-hover:opacity-100")} />
                      </button>
                    </li>
                  );
                })}
                {filteredRepos.length === 0 && (
                  <div className="text-center py-8 text-xs text-muted-foreground">No repositories</div>
                )}
              </ul>
            )}
            {tab === "servers" && (
              <ul className="p-2 space-y-1">
                {filteredServers.map((s) => {
                  const isActive = s.id === activeServerId;
                  return (
                    <li key={s.id}>
                      <button
                        onClick={() => setActiveServerId(s.id)}
                        className={cn(
                          "w-full text-left px-3 py-2.5 rounded-lg flex items-center gap-3 transition-base group",
                          isActive ? "brand-soft-bg shadow-soft" : "hover:bg-secondary/60",
                        )}
                      >
                        <div className={cn(
                          "h-8 w-8 rounded-md flex items-center justify-center shrink-0",
                          isActive ? "bg-primary/15 text-primary" : "bg-secondary text-muted-foreground",
                        )}>
                          <ServerIcon className="h-4 w-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-semibold truncate flex items-center gap-1.5">
                            {s.name}
                            <span className={cn(
                              "h-1.5 w-1.5 rounded-full",
                              s.status === "online" ? "bg-success animate-pulse-soft" : "bg-inactive",
                            )} />
                          </div>
                          <div className="text-[10px] font-mono text-muted-foreground truncate">{s.host}</div>
                        </div>
                      </button>
                    </li>
                  );
                })}
                {filteredServers.length === 0 && (
                  <div className="text-center py-8 text-xs text-muted-foreground">No servers</div>
                )}
              </ul>
            )}
          </div>
        </aside>

        {/* RIGHT — Detail panel */}
        <div className="min-w-0">
          {tab === "repositories" && activeRepo && (
            <div className="section-card overflow-hidden">
              {/* Header */}
              <div className="relative px-6 pt-5 pb-5 border-b border-border/60">
                <div className="absolute -top-10 right-10 h-40 w-40 rounded-full brand-gradient-bg opacity-15 blur-3xl pointer-events-none" />
                <div className="flex items-start gap-4">
                  <div className="h-14 w-14 rounded-2xl brand-soft-bg flex items-center justify-center text-primary shrink-0 shadow-soft">
                    {providerIcon(activeRepo.provider, "h-6 w-6")}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-lg font-bold font-mono truncate">{activeRepo.name}</h2>
                      <StatusPill status={activeRepo.status} />
                    </div>
                    <a
                      href={activeRepo.url.startsWith("http") ? activeRepo.url : undefined}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-muted-foreground hover:text-primary inline-flex items-center gap-1 mt-1 break-all"
                    >
                      {activeRepo.url}
                      {activeRepo.url.startsWith("http") && <ExternalLink className="h-3 w-3 shrink-0" />}
                    </a>
                    <div className="mt-3 flex flex-wrap items-center gap-1.5">
                      <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-secondary/70 text-muted-foreground inline-flex items-center gap-1">
                        <GitBranch className="h-3 w-3" /> {activeRepo.branches.length} branches
                      </span>
                      <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-secondary/70 text-muted-foreground inline-flex items-center gap-1">
                        <Tag className="h-3 w-3" /> {activeRepo.tags.length} tags
                      </span>
                      <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-secondary/70 text-muted-foreground inline-flex items-center gap-1">
                        <Users className="h-3 w-3" /> {activeRepo.members.length} members
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      variant="brand"
                      size="sm"
                      onClick={() => navigate(`/create?repo=${activeRepo.id}`)}
                    >
                      <PackageIcon className="h-4 w-4" /> Create package
                    </Button>
                    <Button variant="ghost" size="icon" className="h-9 w-9" onClick={handleVerify} aria-label="Sync">
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 text-failed hover:text-failed"
                      onClick={() => setConfirmDelete(true)}
                      aria-label="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Body */}
              <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] gap-0">
                {/* Connection */}
                <aside className="p-6 border-b lg:border-b-0 lg:border-r border-border/60 bg-secondary/20">
                  <div className="text-sm font-semibold inline-flex items-center gap-2 mb-4">
                    <KeyRound className="h-4 w-4 text-primary" /> Connection
                  </div>
                  <div className="space-y-4">
                    <Field label="Connection type">
                      <Select value={activeRepo.authMethod} onValueChange={(v) => handleAuthChange(v as RepoAuthMethod)}>
                        <SelectTrigger className="h-9 text-sm font-semibold"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {(Object.keys(AUTH_LABEL) as RepoAuthMethod[]).map((m) => (
                            <SelectItem key={m} value={m}>{AUTH_LABEL[m]}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </Field>
                    <Field label="Synced">
                      <div className="text-sm font-semibold">{activeRepo.lastSyncedAt}</div>
                    </Field>
                    <Field label="Slug">
                      <div className="text-sm font-semibold font-mono break-all">{activeRepo.name}</div>
                    </Field>
                    <Field label="Default branch">
                      <div className="text-sm font-semibold font-mono">{activeRepo.defaultBranch}</div>
                    </Field>

                    <div className="pt-2 space-y-2">
                      <Button variant="outline" size="sm" className="w-full" onClick={handleVerify}>
                        <RefreshCw className="h-3.5 w-3.5" /> Sync now
                      </Button>
                      <Button variant="ghost" size="sm" className="w-full" onClick={() => toast.info("Re-authenticate flow")}>
                        Reconnect {AUTH_LABEL[activeRepo.authMethod]}
                      </Button>
                      {activeRepo.authMethod === "pat" && (
                        <Button variant="ghost" size="sm" className="w-full" onClick={() => toast.info("Change PAT flow")}>
                          Change PAT
                        </Button>
                      )}
                    </div>
                  </div>
                </aside>

                {/* People & Roles */}
                <section className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-sm font-semibold inline-flex items-center gap-2">
                      <Users className="h-4 w-4 text-primary" /> People and Roles
                      <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-secondary text-muted-foreground ml-1">
                        {activeRepo.members.length}
                      </span>
                    </div>
                  </div>

                  <div className="rounded-xl border border-border/70 bg-card p-3 mb-4">
                    <div className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2">Add member</div>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <div className="relative flex-1">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          value={inviteEmail}
                          onChange={(e) => setInviteEmail(e.target.value)}
                          placeholder="Search LDAP users…"
                          className="pl-9"
                          onKeyDown={(e) => e.key === "Enter" && handleInvite()}
                        />
                      </div>
                      <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as TeamRole)}>
                        <SelectTrigger className="sm:w-[160px]"><SelectValue /></SelectTrigger>
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
                      <Button variant="brand" onClick={handleInvite} disabled={!inviteEmail.trim()}>
                        <UserPlus className="h-4 w-4" /> Invite
                      </Button>
                    </div>
                  </div>

                  {/* Owner spotlight */}
                  {(() => {
                    const owner = activeRepo.members.find((m) => m.id === activeRepo.ownerId);
                    if (!owner) return null;
                    return (
                      <div className="mb-3">
                        <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">Owner</div>
                        <div className="flex items-center gap-3 rounded-lg border border-primary/30 bg-primary/5 p-3">
                          <Avatar className="h-9 w-9 shrink-0">
                            <AvatarFallback className="brand-gradient-bg text-[hsl(var(--on-brand))] text-xs font-semibold">
                              {owner.initials}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0 flex-1">
                            <div className="text-sm font-semibold truncate flex items-center gap-1.5">
                              {owner.name}
                              <Crown className="h-3 w-3 text-primary" />
                            </div>
                            <div className="text-[11px] text-muted-foreground truncate">{owner.email}</div>
                          </div>
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md border border-primary/40 bg-primary/10 text-primary">
                            Owner
                          </span>
                        </div>
                      </div>
                    );
                  })()}

                  <ul className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
                    {sortedMembers.filter((m) => m.role !== "owner").map((m) => {
                      const meta = ROLE_META[m.role];
                      return (
                        <li
                          key={m.id}
                          className="group flex items-center gap-3 rounded-lg border border-border/60 bg-card p-3 hover:shadow-soft transition-base"
                        >
                          <Avatar className="h-9 w-9 shrink-0">
                            <AvatarFallback className="brand-gradient-bg text-[hsl(var(--on-brand))] text-xs font-semibold">
                              {m.initials}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0 flex-1">
                            <div className="text-sm font-semibold truncate">{m.name}</div>
                            <div className="text-[11px] text-muted-foreground truncate">
                              {m.username ? `${m.username} · ` : ""}{m.email}
                            </div>
                          </div>
                          {m.status === "pending" && (
                            <span className="hidden sm:inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-semibold bg-queued/10 text-queued border-queued/30">
                              PENDING
                            </span>
                          )}
                          <Select value={m.role} onValueChange={(v) => handleRoleChange(m.id, v as TeamRole)}>
                            <SelectTrigger className="h-8 w-[140px] text-xs">
                              <span className="flex items-center gap-2">
                                <span className={cn("h-2.5 w-2.5 rounded-full bg-gradient-to-br", meta.color)} />
                                <SelectValue />
                              </span>
                            </SelectTrigger>
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
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-failed hover:text-failed opacity-0 group-hover:opacity-100"
                            onClick={() => handleRemoveMember(m.id)}
                            aria-label="Remove member"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </li>
                      );
                    })}
                    {sortedMembers.filter((m) => m.role !== "owner").length === 0 && (
                      <div className="text-center py-8 text-xs text-muted-foreground">No members assigned yet.</div>
                    )}
                  </ul>
                </section>
              </div>
            </div>
          )}

          {tab === "servers" && activeServer && (
            <div className="section-card overflow-hidden">
              {/* Header */}
              <div className="relative px-6 pt-5 pb-5 border-b border-border/60">
                <div className="absolute -top-10 right-10 h-40 w-40 rounded-full brand-gradient-bg opacity-15 blur-3xl pointer-events-none" />
                <div className="flex items-start gap-4">
                  <div className="h-14 w-14 rounded-2xl brand-soft-bg flex items-center justify-center text-primary shrink-0 shadow-soft">
                    <ServerIcon className="h-6 w-6" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-lg font-bold truncate">{activeServer.name}</h2>
                      <EnvBadge env={activeServer.environment} />
                      <span className={cn(
                        "text-[10px] font-semibold px-2 py-0.5 rounded-md border inline-flex items-center gap-1.5",
                        activeServer.status === "online"
                          ? "bg-success/10 text-success border-success/30"
                          : "bg-inactive/15 text-inactive border-inactive/30",
                      )}>
                        <span className={cn("h-1.5 w-1.5 rounded-full bg-current", activeServer.status === "online" && "animate-pulse-soft")} />
                        {activeServer.status === "online" ? "Online" : "Offline"}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground font-mono mt-1">
                      {activeServer.protocol} · {activeServer.host}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => toast.success("Pinging server…")} aria-label="Test connection">
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 text-failed hover:text-failed"
                      onClick={() => removeServer(activeServer.id)}
                      aria-label="Remove"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
                <aside className="p-6 border-b lg:border-b-0 lg:border-r border-border/60 bg-secondary/20 space-y-4">
                  <div className="text-sm font-semibold inline-flex items-center gap-2 mb-2">
                    <KeyRound className="h-4 w-4 text-primary" /> Connection
                  </div>
                  <Field label="Protocol">
                    <div className="text-sm font-semibold">{activeServer.protocol}</div>
                  </Field>
                  <Field label="Host">
                    <div className="text-sm font-semibold font-mono break-all">{activeServer.host}</div>
                  </Field>
                  <Field label="Deploy path">
                    <div className="text-sm font-semibold font-mono break-all">{activeServer.path}</div>
                  </Field>
                  <Field label="Environment">
                    <EnvBadge env={activeServer.environment} />
                  </Field>
                  <div className="pt-2">
                    <Button variant="outline" size="sm" className="w-full" onClick={() => toast.success("Pinging server…")}>
                      <RefreshCw className="h-3.5 w-3.5" /> Test connection
                    </Button>
                  </div>
                </aside>
                <section className="p-6">
                  <div className="text-sm font-semibold inline-flex items-center gap-2 mb-4">
                    <Users className="h-4 w-4 text-primary" /> Access
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Server credentials are managed securely on the backend. Use Deployments to push packages to this target.
                  </div>
                  <Button variant="brand" size="sm" className="mt-4" onClick={() => navigate("/deployments")}>
                    Go to Deployments
                  </Button>
                </section>
              </div>
            </div>
          )}

          {((tab === "repositories" && !activeRepo) || (tab === "servers" && !activeServer)) && (
            <div className="section-card p-12 text-center h-full flex flex-col items-center justify-center">
              <div className="mx-auto h-12 w-12 rounded-xl brand-soft-bg flex items-center justify-center mb-3">
                {tab === "repositories" ? <GitBranch className="h-5 w-5 text-primary" /> : <ServerIcon className="h-5 w-5 text-primary" />}
              </div>
              <div className="text-sm font-semibold">Select a {tab === "repositories" ? "repository" : "server"}</div>
              <p className="text-xs text-muted-foreground mt-1">Pick one from the list to view details.</p>
            </div>
          )}
        </div>
      </div>

      <ConnectRepositoryDialog open={connectOpen} onOpenChange={setConnectOpen} />

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Disconnect this repository?</AlertDialogTitle>
            <AlertDialogDescription>
              {activeRepo?.name} will be removed from Cybix Deployer. Existing packages keep their history.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-failed text-failed-foreground hover:bg-failed/90"
              onClick={() => { if (activeRepo) removeRepo(activeRepo.id); setConfirmDelete(false); }}
            >
              Disconnect
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppShell>
  );
};

export default Projects;
