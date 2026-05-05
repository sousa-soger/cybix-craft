import { useMemo, useState } from "react";
import { Check, Mail, Users } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import {
  ROLE_META,
  BRAND_GRADIENT_OPTIONS,
  projects,
  type Team,
  type TeamRole,
  type TeamMember,
} from "@/lib/mock-data";

const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "team";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const parseEmails = (raw: string): string[] => {
  const tokens = raw.split(/[\s,;]+/).map((t) => t.trim()).filter(Boolean);
  return Array.from(new Set(tokens.filter((t) => EMAIL_RE.test(t))));
};

/* ---------- Role picker (shared) ---------- */
const RolePicker = ({ value, onChange }: { value: TeamRole; onChange: (r: TeamRole) => void }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
    {(Object.keys(ROLE_META) as TeamRole[]).map((r) => {
      const meta = ROLE_META[r];
      const selected = value === r;
      return (
        <button
          key={r}
          type="button"
          onClick={() => onChange(r)}
          className={cn(
            "text-left flex items-start gap-3 rounded-xl border p-3 transition-base",
            selected
              ? "brand-soft-bg border-primary/60 shadow-soft"
              : "border-border/70 hover:border-primary/40 bg-card",
          )}
        >
          <div className={cn("h-7 w-7 rounded-lg bg-gradient-to-br shrink-0 mt-0.5", meta.color)} />
          <div className="min-w-0">
            <div className="text-sm font-semibold">{meta.label}</div>
            <div className="text-[11px] text-muted-foreground leading-snug">{meta.desc}</div>
          </div>
        </button>
      );
    })}
  </div>
);

/* ---------- Invite Member (mass) ---------- */
interface InviteMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  team: Team;
  onInvite: (members: TeamMember[]) => void;
}

export const InviteMemberDialog = ({ open, onOpenChange, team, onInvite }: InviteMemberDialogProps) => {
  const [raw, setRaw] = useState("");
  const [role, setRole] = useState<TeamRole>(team.defaultRole);
  const [sent, setSent] = useState(false);

  const emails = useMemo(() => parseEmails(raw), [raw]);

  const reset = () => { setRaw(""); setRole(team.defaultRole); setSent(false); };
  const handleClose = (next: boolean) => {
    if (!next) setTimeout(reset, 200);
    onOpenChange(next);
  };

  const handleSend = () => {
    if (emails.length === 0) return;
    const members: TeamMember[] = emails.map((email, i) => ({
      id: `m-${Date.now()}-${i}`,
      name: email.split("@")[0],
      email,
      initials: email.slice(0, 2).toUpperCase(),
      role,
      status: "pending",
      joinedAt: "Pending",
    }));
    onInvite(members);
    setSent(true);
    toast.success(
      emails.length === 1 ? "Invite sent" : `${emails.length} invites sent`,
      { description: `Role: ${ROLE_META[role].label}` },
    );
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-xl p-0 overflow-hidden">
        <div className="brand-soft-bg px-6 py-5 border-b border-border/60">
          <DialogHeader>
            <DialogTitle className="text-xl">Invite to {team.name}</DialogTitle>
            <DialogDescription>
              Paste one or many emails — separated by commas, spaces, or new lines. Everyone gets the same starting role.
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="px-6 py-5 space-y-5 max-h-[60vh] overflow-y-auto">
          <div className="space-y-2">
            <Label>Email addresses</Label>
            <Textarea
              placeholder={"alice@company.com, bob@company.com\ncharlie@company.com"}
              value={raw}
              onChange={(e) => setRaw(e.target.value)}
              rows={4}
            />
            {emails.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {emails.map((e) => (
                  <span key={e} className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-secondary text-muted-foreground">
                    {e}
                  </span>
                ))}
              </div>
            )}
            <p className="text-[11px] text-muted-foreground">
              {emails.length} valid email{emails.length === 1 ? "" : "s"} detected.
            </p>
          </div>

          <div className="space-y-2">
            <Label>Starting role <span className="text-[11px] font-normal text-muted-foreground">(team default: {ROLE_META[team.defaultRole].label})</span></Label>
            <RolePicker value={role} onChange={setRole} />
            <p className="text-[11px] text-muted-foreground">
              You can override roles per-project later — different projects can use different roles for the same person.
            </p>
          </div>

          {sent && (
            <div className="flex items-center gap-2 rounded-lg border border-success/30 bg-success/10 text-success px-3 py-2 text-xs">
              <Check className="h-4 w-4" /> {emails.length} invite{emails.length === 1 ? "" : "s"} sent
            </div>
          )}
        </div>

        <DialogFooter className="px-6 py-4 border-t border-border/60 bg-muted/30 sm:justify-between gap-2">
          <span />
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => handleClose(false)}>
              {sent ? "Close" : "Cancel"}
            </Button>
            {!sent && (
              <Button variant="brand" size="sm" disabled={emails.length === 0} onClick={handleSend}>
                <Mail className="h-4 w-4" />
                {emails.length > 1 ? `Send ${emails.length} invites` : "Send invite"}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

/* ---------- Create Team ---------- */
interface CreateTeamDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (team: Team) => void;
}

export const CreateTeamDialog = ({ open, onOpenChange, onCreate }: CreateTeamDialogProps) => {
  const [name, setName] = useState("");
  const [color, setColor] = useState(BRAND_GRADIENT_OPTIONS[0].value);
  const [defaultRole, setDefaultRole] = useState<TeamRole>("creator");

  const slug = useMemo(() => slugify(name), [name]);

  const reset = () => { setName(""); setColor(BRAND_GRADIENT_OPTIONS[0].value); setDefaultRole("creator"); };
  const handleClose = (next: boolean) => {
    if (!next) setTimeout(reset, 200);
    onOpenChange(next);
  };

  const handleCreate = () => {
    if (!name) return;
    const team: Team = {
      id: `t-${Date.now()}`,
      name,
      slug,
      avatarColor: color,
      members: [],
      projectIds: [],
      defaultRole,
    };
    onCreate(team);
    toast.success("Team created", { description: `${name} · default role: ${ROLE_META[defaultRole].label}` });
    handleClose(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg p-0 overflow-hidden">
        <div className="brand-soft-bg px-6 py-5 border-b border-border/60">
          <DialogHeader>
            <DialogTitle className="text-xl">Create a new team</DialogTitle>
            <DialogDescription>Pick a starting role so mass invitations are one click.</DialogDescription>
          </DialogHeader>
        </div>

        <div className="px-6 py-5 space-y-5 max-h-[65vh] overflow-y-auto">
          <div className="space-y-2">
            <Label>Team name</Label>
            <Input
              placeholder="e.g. Atlas Squad"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
            <p className="text-xs text-muted-foreground">
              slug: <span className="font-mono">{slug}</span>
            </p>
          </div>

          <div className="space-y-2">
            <Label>Avatar color</Label>
            <div className="flex items-center gap-3">
              {BRAND_GRADIENT_OPTIONS.map((opt) => {
                const selected = color === opt.value;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setColor(opt.value)}
                    className={cn(
                      "h-10 w-10 rounded-full bg-gradient-to-br transition-base",
                      opt.value,
                      selected ? "ring-2 ring-primary ring-offset-2 ring-offset-background shadow-soft" : "opacity-80 hover:opacity-100",
                    )}
                    aria-label={`color ${opt.id}`}
                  />
                );
              })}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Users className="h-3.5 w-3.5 text-primary" />
              Default role for new members
            </Label>
            <RolePicker value={defaultRole} onChange={setDefaultRole} />
            <p className="text-[11px] text-muted-foreground">
              Used as the starting role when you mass-invite people. Per-project overrides still work.
            </p>
          </div>
        </div>

        <DialogFooter className="px-6 py-4 border-t border-border/60 bg-muted/30 sm:justify-end gap-2">
          <Button variant="outline" size="sm" onClick={() => handleClose(false)}>Cancel</Button>
          <Button variant="brand" size="sm" disabled={!name} onClick={handleCreate}>Create team</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

/* ---------- Assign Project ---------- */
interface AssignProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  team: Team;
  onAssign: (projectIds: string[]) => void;
}

export const AssignProjectDialog = ({ open, onOpenChange, team, onAssign }: AssignProjectDialogProps) => {
  const available = projects.filter((p) => !team.projectIds.includes(p.id));
  const [selected, setSelected] = useState<string[]>([]);

  const toggle = (id: string) => {
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  };

  const handleClose = (next: boolean) => {
    if (!next) setTimeout(() => setSelected([]), 200);
    onOpenChange(next);
  };

  const handleAssign = () => {
    if (selected.length === 0) return;
    onAssign(selected);
    toast.success("Projects assigned", { description: `${selected.length} project(s) added to ${team.name}.` });
    handleClose(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md p-0 overflow-hidden">
        <div className="brand-soft-bg px-6 py-5 border-b border-border/60">
          <DialogHeader>
            <DialogTitle className="text-xl">Assign projects to {team.name}</DialogTitle>
            <DialogDescription>Choose projects this team can build packages for.</DialogDescription>
          </DialogHeader>
        </div>

        <div className="px-6 py-4 max-h-[55vh] overflow-y-auto">
          {available.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              All projects are already assigned to this team.
            </p>
          ) : (
            <ul className="space-y-2">
              {available.map((p) => {
                const checked = selected.includes(p.id);
                return (
                  <li
                    key={p.id}
                    className={cn(
                      "flex items-center gap-3 rounded-xl border p-3 cursor-pointer transition-base",
                      checked ? "brand-soft-bg border-primary/60" : "border-border/70 hover:border-primary/40 bg-card",
                    )}
                    onClick={() => toggle(p.id)}
                  >
                    <Checkbox checked={checked} onCheckedChange={() => toggle(p.id)} />
                    <div className={cn("h-3 w-3 rounded-full bg-gradient-to-br", p.color)} />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold truncate">{p.name}</div>
                      <div className="text-[11px] text-muted-foreground">{p.repoCount} repositories</div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <DialogFooter className="px-6 py-4 border-t border-border/60 bg-muted/30 sm:justify-end gap-2">
          <Button variant="outline" size="sm" onClick={() => handleClose(false)}>Cancel</Button>
          <Button variant="brand" size="sm" disabled={selected.length === 0} onClick={handleAssign}>
            Assign {selected.length > 0 && `(${selected.length})`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
