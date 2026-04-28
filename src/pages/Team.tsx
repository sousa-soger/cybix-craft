import { useMemo, useState } from "react";
import {
  ChevronDown,
  FolderPlus,
  Pencil,
  Plus,
  ShieldCheck,
  Trash2,
  UserPlus,
  Mail,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  teams as initialTeams,
  projects,
  ROLE_META,
  CURRENT_USER_ID,
  type Team,
  type TeamMember,
  type TeamRole,
} from "@/lib/mock-data";
import {
  InviteMemberDialog,
  CreateTeamDialog,
  AssignProjectDialog,
} from "@/components/team-dialogs";

const TeamPage = () => {
  const [teams, setTeams] = useState<Team[]>(initialTeams);
  const [activeId, setActiveId] = useState<string>(teams[0]?.id ?? "");
  const [createOpen, setCreateOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null);
  const [permsOpen, setPermsOpen] = useState(false);

  const active = useMemo(
    () => teams.find((t) => t.id === activeId) ?? teams[0],
    [teams, activeId],
  );

  const updateTeam = (id: string, patch: (t: Team) => Team) =>
    setTeams((all) => all.map((t) => (t.id === id ? patch(t) : t)));

  const handleCreateTeam = (team: Team) => {
    setTeams((all) => [...all, team]);
    setActiveId(team.id);
  };

  const handleInvite = (member: TeamMember) => {
    if (!active) return;
    updateTeam(active.id, (t) => ({ ...t, members: [...t.members, member] }));
  };

  const handleRoleChange = (memberId: string, role: TeamRole) => {
    if (!active) return;
    updateTeam(active.id, (t) => ({
      ...t,
      members: t.members.map((m) => (m.id === memberId ? { ...m, role } : m)),
    }));
    toast.success("Role updated", { description: `Saved · ${ROLE_META[role].label}` });
  };

  const handleRemoveMember = (memberId: string) => {
    if (!active) return;
    const m = active.members.find((x) => x.id === memberId);
    updateTeam(active.id, (t) => ({ ...t, members: t.members.filter((x) => x.id !== memberId) }));
    setConfirmRemoveId(null);
    toast.success("Member removed", { description: m ? `${m.name} no longer has access.` : "" });
  };

  const handleAssignProjects = (ids: string[]) => {
    if (!active) return;
    updateTeam(active.id, (t) => ({ ...t, projectIds: [...t.projectIds, ...ids] }));
  };

  const handleRemoveProject = (pid: string) => {
    if (!active) return;
    updateTeam(active.id, (t) => ({ ...t, projectIds: t.projectIds.filter((x) => x !== pid) }));
    toast.success("Project removed");
  };

  const handleResend = (email: string) => {
    toast.success("Invite resent", { description: email });
  };

  if (!active) return null;

  const teamProjects = projects.filter((p) => active.projectIds.includes(p.id));

  return (
    <AppShell
      title="Teams & Members"
      subtitle="Group people, assign projects, and decide who can ship."
    >
      {/* Mobile horizontal team pills */}
      <div className="lg:hidden -mx-1 mb-4 overflow-x-auto">
        <div className="flex items-center gap-2 px-1 h-12">
          {teams.map((t) => {
            const selected = t.id === active.id;
            return (
              <button
                key={t.id}
                onClick={() => setActiveId(t.id)}
                className={cn(
                  "flex items-center gap-2 px-3 h-10 rounded-full border whitespace-nowrap transition-base",
                  selected
                    ? "border-transparent brand-soft-bg shadow-soft"
                    : "border-border/70 bg-card hover:border-primary/40",
                )}
              >
                <span className={cn("h-6 w-6 rounded-full bg-gradient-to-br grid place-items-center text-[10px] font-bold text-[hsl(var(--on-brand))]", t.avatarColor)}>
                  {t.name.charAt(0)}
                </span>
                <span className={cn("text-sm font-medium", selected && "brand-gradient-text font-semibold")}>{t.name}</span>
              </button>
            );
          })}
          <button
            onClick={() => setCreateOpen(true)}
            className="flex items-center gap-1 px-3 h-10 rounded-full border border-dashed border-border text-xs text-muted-foreground hover:border-primary/50 hover:text-primary transition-base whitespace-nowrap"
          >
            <Plus className="h-3.5 w-3.5" /> New team
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-5">
        {/* LEFT — team switcher */}
        <aside className="hidden lg:block">
          <div className="section-card p-3 sticky top-4">
            <div className="flex items-center justify-between px-2 py-1.5 mb-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Your Teams
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-primary"
                onClick={() => setCreateOpen(true)}
                aria-label="Create team"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            <ul className="space-y-1">
              {teams.map((t) => {
                const selected = t.id === active.id;
                return (
                  <li key={t.id}>
                    <button
                      onClick={() => setActiveId(t.id)}
                      className={cn(
                        "w-full flex items-center gap-3 rounded-lg px-2.5 py-2 text-left transition-base relative",
                        selected ? "brand-soft-bg" : "hover:bg-secondary/50",
                      )}
                    >
                      {selected && (
                        <span className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r brand-gradient-bg" />
                      )}
                      <span
                        className={cn(
                          "h-9 w-9 rounded-full bg-gradient-to-br grid place-items-center text-sm font-bold shrink-0 text-[hsl(var(--on-brand))] shadow-soft",
                          t.avatarColor,
                        )}
                      >
                        {t.name.charAt(0)}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-semibold truncate">{t.name}</div>
                        <div className="text-[10px] font-mono text-muted-foreground">/{t.slug}</div>
                      </div>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-secondary text-muted-foreground">
                        {t.members.length}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>

            <button
              onClick={() => setCreateOpen(true)}
              className="mt-2 w-full flex items-center justify-center gap-2 rounded-lg border border-dashed border-border/70 px-3 py-3 text-xs text-muted-foreground hover:border-primary/50 hover:text-primary hover:bg-secondary/30 transition-base"
            >
              <Plus className="h-3.5 w-3.5" /> New Team
            </button>
          </div>
        </aside>

        {/* RIGHT — selected team */}
        <div className="space-y-5 min-w-0">
          {/* Section 1 — header */}
          <div className="section-card p-5">
            <div className="flex items-center gap-4">
              <div
                className={cn(
                  "h-12 w-12 rounded-full bg-gradient-to-br grid place-items-center text-lg font-bold text-[hsl(var(--on-brand))] shadow-soft shrink-0",
                  active.avatarColor,
                )}
              >
                {active.name.charAt(0)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-lg font-bold truncate">{active.name}</div>
                <div className="text-xs font-mono text-muted-foreground">/{active.slug}</div>
              </div>
              <div className="hidden sm:flex items-center gap-1.5">
                <span className="text-[11px] font-mono px-2 py-1 rounded-md bg-secondary text-muted-foreground">
                  {active.members.length} members
                </span>
                <span className="text-[11px] font-mono px-2 py-1 rounded-md bg-secondary text-muted-foreground">
                  {active.projectIds.length} projects
                </span>
              </div>
              <Button variant="ghost" size="sm" className="text-xs">
                <Pencil className="h-3.5 w-3.5" /> Edit team
              </Button>
            </div>
          </div>

          {/* Section 2 — members */}
          <div className="section-card p-0 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-border/60">
              <div className="text-sm font-semibold">Members</div>
              <Button variant="brand" size="sm" onClick={() => setInviteOpen(true)}>
                <UserPlus className="h-4 w-4" /> Invite member
              </Button>
            </div>

            {active.members.length === 0 ? (
              <div className="p-10 text-center">
                <div className="mx-auto h-12 w-12 rounded-full brand-soft-bg grid place-items-center mb-3">
                  <UserPlus className="h-5 w-5 text-primary" />
                </div>
                <div className="text-sm font-semibold">No members yet</div>
                <div className="text-xs text-muted-foreground mt-1">Invite your first teammate to get started.</div>
              </div>
            ) : (
              <ul className="divide-y divide-border/60">
                {active.members.map((m) => {
                  const isCurrent = m.id === CURRENT_USER_ID;
                  const isOwner = m.role === "owner";
                  const meta = ROLE_META[m.role];
                  const confirming = confirmRemoveId === m.id;

                  if (confirming) {
                    return (
                      <li key={m.id} className="flex items-center justify-between gap-3 px-5 py-3 bg-failed/5">
                        <div className="text-sm">
                          Remove <span className="font-semibold">{m.name}</span> from {active.name}?
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="sm" onClick={() => setConfirmRemoveId(null)}>
                            Cancel
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-failed/40 text-failed hover:bg-failed/10"
                            onClick={() => handleRemoveMember(m.id)}
                          >
                            Confirm remove
                          </Button>
                        </div>
                      </li>
                    );
                  }

                  return (
                    <li
                      key={m.id}
                      className="group flex items-center gap-3 sm:gap-4 px-5 py-3 hover:bg-secondary/40 transition-base"
                    >
                      <Avatar className="h-9 w-9 shrink-0">
                        <AvatarFallback className="brand-gradient-bg text-[hsl(var(--on-brand))] text-xs font-semibold">
                          {m.initials}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">
                          {m.name}
                          {isCurrent && <span className="text-muted-foreground font-normal"> (You)</span>}
                        </div>
                        <div className="text-xs text-muted-foreground truncate">{m.email}</div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {m.status === "active" ? (
                          <span className="hidden sm:inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[10px] font-semibold tracking-wider bg-success/10 text-success border-success/30">
                            <span className="h-1.5 w-1.5 rounded-full bg-current" /> ACTIVE
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[10px] font-semibold tracking-wider bg-queued/10 text-queued border-queued/30">
                            <span className="h-1.5 w-1.5 rounded-full bg-current" /> PENDING
                          </span>
                        )}
                        {m.status === "pending" && (
                          <button
                            onClick={() => handleResend(m.email)}
                            className="text-[11px] text-primary hover:underline hidden sm:inline-flex items-center gap-1"
                          >
                            <Mail className="h-3 w-3" /> Resend
                          </button>
                        )}
                      </div>

                      <div className="shrink-0">
                        <Select
                          value={m.role}
                          onValueChange={(v) => handleRoleChange(m.id, v as TeamRole)}
                          disabled={isCurrent}
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
                      </div>

                      <button
                        onClick={() => setConfirmRemoveId(m.id)}
                        disabled={isOwner || isCurrent}
                        className={cn(
                          "shrink-0 h-8 w-8 rounded-md grid place-items-center text-failed/80 hover:bg-failed/10 transition-base",
                          "opacity-0 group-hover:opacity-100",
                          (isOwner || isCurrent) && "opacity-0 pointer-events-none",
                        )}
                        aria-label="Remove member"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* Section 3 — projects */}
          <div className="section-card p-0 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-border/60">
              <div className="text-sm font-semibold">Projects</div>
              <Button variant="ghost" size="sm" onClick={() => setAssignOpen(true)}>
                <FolderPlus className="h-4 w-4" /> Assign project
              </Button>
            </div>

            {teamProjects.length === 0 ? (
              <div className="p-10 text-center">
                <div className="mx-auto h-12 w-12 rounded-full brand-soft-bg grid place-items-center mb-3">
                  <FolderPlus className="h-5 w-5 text-primary" />
                </div>
                <div className="text-sm font-semibold">No projects assigned</div>
                <div className="text-xs text-muted-foreground mt-1 mb-4">
                  Add projects so this team can build packages for them.
                </div>
                <Button variant="brand" size="sm" onClick={() => setAssignOpen(true)}>
                  <FolderPlus className="h-4 w-4" /> Assign project
                </Button>
              </div>
            ) : (
              <ul className="divide-y divide-border/60">
                {teamProjects.map((p) => (
                  <li
                    key={p.id}
                    className="group flex items-center gap-3 px-5 py-3 hover:bg-secondary/40 transition-base"
                  >
                    <span className={cn("h-3 w-3 rounded-full bg-gradient-to-br shrink-0", p.color)} />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold truncate">{p.name}</div>
                      <div className="text-[11px] text-muted-foreground truncate">{p.description}</div>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-secondary text-muted-foreground shrink-0">
                      {p.repoCount} repos
                    </span>
                    <span className="text-xs text-muted-foreground shrink-0 hidden sm:inline">
                      {p.lastDeployedAt}
                    </span>
                    <button
                      onClick={() => handleRemoveProject(p.id)}
                      className="text-xs text-failed opacity-0 group-hover:opacity-100 transition-base hover:underline shrink-0"
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Role permissions collapsible */}
          <div className="section-card p-0 overflow-hidden">
            <button
              onClick={() => setPermsOpen((o) => !o)}
              className="w-full flex items-center justify-between px-5 py-3.5 text-left hover:bg-secondary/40 transition-base"
            >
              <span className="text-sm font-semibold flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-primary" />
                Role permissions
              </span>
              <ChevronDown
                className={cn("h-4 w-4 text-muted-foreground transition-transform", permsOpen && "rotate-180")}
              />
            </button>
            {permsOpen && (
              <div className="px-5 pb-5 pt-1 border-t border-border/60">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 mt-4">
                  {(Object.keys(ROLE_META) as TeamRole[]).map((r) => {
                    const meta = ROLE_META[r];
                    return (
                      <div key={r} className="rounded-xl border border-border/70 p-4 bg-card hover:shadow-soft transition-base">
                        <div className={cn("h-8 w-8 rounded-lg bg-gradient-to-br shadow-soft mb-2", meta.color)} />
                        <div className="text-sm font-semibold">{meta.label}</div>
                        <div className="text-[11px] text-muted-foreground mt-1 leading-snug">{meta.desc}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <CreateTeamDialog open={createOpen} onOpenChange={setCreateOpen} onCreate={handleCreateTeam} />
      <InviteMemberDialog open={inviteOpen} onOpenChange={setInviteOpen} team={active} onInvite={handleInvite} />
      <AssignProjectDialog open={assignOpen} onOpenChange={setAssignOpen} team={active} onAssign={handleAssignProjects} />
    </AppShell>
  );
};

export default TeamPage;
