import { useEffect, useMemo, useState } from "react";
import {
  X,
  Trash2,
  RefreshCw,
  Github,
  GitlabIcon as Gitlab,
  HardDrive,
  Server,
  KeyRound,
  GitBranch,
  Tag,
  Users,
  ExternalLink,
  UserPlus,
  Crown,
  Mail,
} from "lucide-react";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
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
import {
  ROLE_META,
  type RepoAuthMethod,
  type RepoMember,
  type RepoProvider,
  type Repository,
  type TeamRole,
} from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const providerIcon = (p: RepoProvider, cls = "h-4 w-4") => {
  switch (p) {
    case "github": return <Github className={cls} />;
    case "gitlab": return <Gitlab className={cls} />;
    case "company-server": return <Server className={cls} />;
    case "local-pc": return <HardDrive className={cls} />;
  }
};

const AUTH_LABEL: Record<RepoAuthMethod, string> = {
  oauth: "OAuth",
  pat: "Personal Access Token",
  ssh: "SSH key",
  userpass: "User / Password",
};

interface Props {
  repo: Repository | null;
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onUpdate: (id: string, patch: Partial<Repository>) => void;
  onRemove: (id: string) => void;
}

export const RepositoryDetailsSheet = ({ repo, open, onOpenChange, onUpdate, onRemove }: Props) => {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<TeamRole>("maintainer");

  useEffect(() => {
    if (open) {
      setInviteEmail("");
      setInviteRole("maintainer");
    }
  }, [open, repo?.id]);

  const sortedMembers = useMemo<RepoMember[]>(() => {
    if (!repo) return [];
    const order: TeamRole[] = ["owner", "maintainer", "creator", "deployer", "viewer"];
    return [...repo.members].sort((a, b) => order.indexOf(a.role) - order.indexOf(b.role));
  }, [repo]);

  if (!repo) return null;

  const handleVerify = () => {
    toast.success("Verifying credentials…", { description: repo.name });
    window.setTimeout(() => {
      onUpdate(repo.id, { status: "connected", lastVerifiedAt: "Just now", lastSyncedAt: "Just now" });
      toast.success("Verified", { description: `${repo.name} is connected.` });
    }, 800);
  };

  const handleAuthChange = (method: RepoAuthMethod) => {
    onUpdate(repo.id, { authMethod: method });
    toast.success("Auth method updated", { description: AUTH_LABEL[method] });
  };

  const handleRoleChange = (memberId: string, role: TeamRole) => {
    const next = repo.members.map((m) => (m.id === memberId ? { ...m, role } : m));
    onUpdate(repo.id, { members: next });
    toast.success("Role updated", { description: ROLE_META[role].label });
  };

  const handleRemoveMember = (memberId: string) => {
    const m = repo.members.find((x) => x.id === memberId);
    onUpdate(repo.id, { members: repo.members.filter((x) => x.id !== memberId) });
    toast.success("Member removed", { description: m?.name });
  };

  const handleInvite = () => {
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
    onUpdate(repo.id, { members: [...repo.members, newMember] });
    setInviteEmail("");
    toast.success("Invite sent", { description: `${email} as ${ROLE_META[inviteRole].label}` });
  };

  return (
    <>
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="max-h-[92vh]">
          <div className="mx-auto w-full max-w-5xl flex flex-col overflow-hidden">
            {/* Header */}
            <div className="relative px-6 pt-2 pb-5 border-b border-border/60">
              <div className="absolute -top-10 right-10 h-40 w-40 rounded-full brand-gradient-bg opacity-15 blur-3xl pointer-events-none" />
              <div className="flex items-start gap-4">
                <div className="h-14 w-14 rounded-2xl brand-soft-bg flex items-center justify-center text-primary shrink-0 shadow-soft">
                  {providerIcon(repo.provider, "h-6 w-6")}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-lg font-bold font-mono truncate">{repo.name}</h2>
                    <span
                      className={cn(
                        "inline-flex items-center gap-1.5 text-[10px] font-semibold px-2 py-0.5 rounded-md border",
                        repo.status === "connected" && "bg-success/10 text-success border-success/30",
                        repo.status === "expired" && "bg-queued/10 text-queued border-queued/30",
                        repo.status === "needs-auth" && "bg-failed/10 text-failed border-failed/30",
                      )}
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-current" />
                      {repo.status === "connected" ? "Connected" : repo.status === "expired" ? "Expired" : "Needs auth"}
                    </span>
                  </div>
                  <a
                    href={repo.url.startsWith("http") ? repo.url : undefined}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-muted-foreground hover:text-primary inline-flex items-center gap-1 mt-1 break-all"
                  >
                    {repo.url}
                    {repo.url.startsWith("http") && <ExternalLink className="h-3 w-3 shrink-0" />}
                  </a>
                  <div className="mt-3 flex flex-wrap items-center gap-1.5">
                    <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-secondary/70 text-muted-foreground inline-flex items-center gap-1">
                      <GitBranch className="h-3 w-3" /> {repo.branches.length} branches
                    </span>
                    <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-secondary/70 text-muted-foreground inline-flex items-center gap-1">
                      <Tag className="h-3 w-3" /> {repo.tags.length} tags
                    </span>
                    <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-secondary/70 text-muted-foreground inline-flex items-center gap-1">
                      <Users className="h-3 w-3" /> {repo.members.length} members
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button variant="ghost" size="icon" className="h-9 w-9" onClick={handleVerify} aria-label="Sync / verify">
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
                  <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => onOpenChange(false)} aria-label="Close">
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Body */}
            <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-0 overflow-y-auto">
              {/* LEFT — Connection */}
              <aside className="p-6 border-b lg:border-b-0 lg:border-r border-border/60 bg-secondary/20">
                <div className="text-sm font-semibold inline-flex items-center gap-2 mb-4">
                  <KeyRound className="h-4 w-4 text-primary" /> Connection
                </div>
                <div className="space-y-4">
                  <Field label="Connection type">
                    <Select value={repo.authMethod} onValueChange={(v) => handleAuthChange(v as RepoAuthMethod)}>
                      <SelectTrigger className="h-9 text-sm font-semibold"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {(Object.keys(AUTH_LABEL) as RepoAuthMethod[]).map((m) => (
                          <SelectItem key={m} value={m}>{AUTH_LABEL[m]}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field label="Synced">
                    <div className="text-sm font-semibold">{repo.lastSyncedAt}</div>
                  </Field>
                  <Field label="Default branch">
                    <div className="text-sm font-semibold font-mono">{repo.defaultBranch}</div>
                  </Field>
                  <Field label="Last verified">
                    <div className="text-sm font-semibold">{repo.lastVerifiedAt}</div>
                  </Field>

                  <div className="pt-2 space-y-2">
                    <Button variant="outline" size="sm" className="w-full" onClick={handleVerify}>
                      <RefreshCw className="h-3.5 w-3.5" /> Sync now
                    </Button>
                    <Button variant="ghost" size="sm" className="w-full" onClick={() => toast.info("Re-authenticate flow")}>
                      Reconnect {AUTH_LABEL[repo.authMethod]}
                    </Button>
                  </div>
                </div>
              </aside>

              {/* RIGHT — People */}
              <section className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-sm font-semibold inline-flex items-center gap-2">
                    <Users className="h-4 w-4 text-primary" /> People & roles
                    <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-secondary text-muted-foreground ml-1">
                      {repo.members.length}
                    </span>
                  </div>
                </div>

                {/* Invite row */}
                <div className="rounded-xl border border-border/70 bg-card p-3 mb-4">
                  <div className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2">Add member</div>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <div className="relative flex-1">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        placeholder="email@company.com or LDAP user"
                        className="pl-9"
                        onKeyDown={(e) => e.key === "Enter" && handleInvite()}
                      />
                    </div>
                    <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as TeamRole)}>
                      <SelectTrigger className="sm:w-[170px]"><SelectValue /></SelectTrigger>
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

                <ul className="space-y-2">
                  {sortedMembers.map((m) => {
                    const isOwner = m.role === "owner";
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
                          <div className="text-sm font-semibold truncate flex items-center gap-1.5">
                            {m.name}
                            {isOwner && <Crown className="h-3 w-3 text-primary" />}
                          </div>
                          <div className="text-[11px] text-muted-foreground truncate">
                            {m.username ? `${m.username} · ` : ""}{m.email}
                          </div>
                        </div>
                        {m.status === "pending" && (
                          <span className="hidden sm:inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-semibold bg-queued/10 text-queued border-queued/30">
                            PENDING
                          </span>
                        )}
                        <Select
                          value={m.role}
                          onValueChange={(v) => handleRoleChange(m.id, v as TeamRole)}
                          disabled={isOwner}
                        >
                          <SelectTrigger className="h-8 w-[140px] text-xs">
                            <span className="flex items-center gap-2">
                              <span className={cn("h-2.5 w-2.5 rounded-full bg-gradient-to-br", meta.color)} />
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
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-failed hover:text-failed opacity-0 group-hover:opacity-100 disabled:opacity-0"
                          disabled={isOwner}
                          onClick={() => handleRemoveMember(m.id)}
                          aria-label="Remove member"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </li>
                    );
                  })}
                </ul>
              </section>
            </div>
          </div>
        </DrawerContent>
      </Drawer>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Disconnect this repository?</AlertDialogTitle>
            <AlertDialogDescription>
              {repo.name} will be removed from Cybix Deployer. Existing packages keep their history.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-failed text-failed-foreground hover:bg-failed/90"
              onClick={() => { onRemove(repo.id); setConfirmDelete(false); }}
            >
              Disconnect
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div>
    <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">{label}</div>
    {children}
  </div>
);
