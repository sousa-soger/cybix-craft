import { useMemo, useState } from "react";
import { Check, Mail } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

/* ---------- Invite Member ---------- */
interface InviteMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  team: Team;
  onInvite: (member: TeamMember) => void;
}

export const InviteMemberDialog = ({ open, onOpenChange, team, onInvite }: InviteMemberDialogProps) => {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<TeamRole>("viewer");
  const [sent, setSent] = useState(false);

  const reset = () => { setEmail(""); setRole("viewer"); setSent(false); };
  const handleClose = (next: boolean) => {
    if (!next) setTimeout(reset, 200);
    onOpenChange(next);
  };

  const handleSend = () => {
    if (!email) return;
    const initials = email.slice(0, 2).toUpperCase();
    const member: TeamMember = {
      id: `m-${Date.now()}`,
      name: email.split("@")[0],
      email,
      initials,
      role,
      status: "pending",
      joinedAt: "Pending",
    };
    onInvite(member);
    setSent(true);
    toast.success("Invite sent", { description: `Invitation emailed to ${email}` });
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-xl p-0 overflow-hidden">
        <div className="brand-soft-bg px-6 py-5 border-b border-border/60">
          <DialogHeader>
            <DialogTitle className="text-xl">Invite to {team.name}</DialogTitle>
            <DialogDescription>
              They’ll receive an email with a link to join this team.
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="px-6 py-5 space-y-5 max-h-[60vh] overflow-y-auto">
          <div className="space-y-2">
            <Label>Email address</Label>
            <Input
              type="email"
              placeholder="colleague@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Role</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {(Object.keys(ROLE_META) as TeamRole[]).map((r) => {
                const meta = ROLE_META[r];
                const selected = role === r;
                return (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRole(r)}
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
          </div>

          {sent && (
            <div className="flex items-center gap-2 rounded-lg border border-success/30 bg-success/10 text-success px-3 py-2 text-xs">
              <Check className="h-4 w-4" /> Invite sent to <span className="font-mono">{email}</span>
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
              <Button variant="brand" size="sm" disabled={!email} onClick={handleSend}>
                <Mail className="h-4 w-4" /> Send invite
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

  const slug = useMemo(() => slugify(name), [name]);

  const reset = () => { setName(""); setColor(BRAND_GRADIENT_OPTIONS[0].value); };
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
    };
    onCreate(team);
    toast.success("Team created", { description: `${name} is ready.` });
    handleClose(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md p-0 overflow-hidden">
        <div className="brand-soft-bg px-6 py-5 border-b border-border/60">
          <DialogHeader>
            <DialogTitle className="text-xl">Create a new team</DialogTitle>
            <DialogDescription>Group members and projects under one roof.</DialogDescription>
          </DialogHeader>
        </div>

        <div className="px-6 py-5 space-y-5">
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
