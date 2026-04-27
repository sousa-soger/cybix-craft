import { ShieldCheck, UserPlus } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

const roles = [
  { key: "owner", label: "Owner", desc: "Full control, billing, role configuration", color: "from-brand-rose to-brand-iris" },
  { key: "maintainer", label: "Maintainer", desc: "Configure projects, repositories and policies", color: "from-brand-iris to-brand-teal" },
  { key: "creator", label: "Package Creator", desc: "Create packages, cannot deploy to PROD", color: "from-brand-teal to-brand-iris" },
  { key: "deployer", label: "Deployer", desc: "Deploy approved packages to permitted environments", color: "from-brand-rose to-brand-teal" },
  { key: "viewer", label: "Viewer", desc: "Read-only access to packages and deployments", color: "from-brand-iris to-brand-rose" },
];

const members = [
  { name: "Demir A.", email: "demir@cybix.io", role: "Owner", initials: "DA" },
  { name: "Selin K.", email: "selin@cybix.io", role: "Maintainer", initials: "SK" },
  { name: "Mert O.", email: "mert@cybix.io", role: "Package Creator", initials: "MO" },
  { name: "Ayşe T.", email: "ayse@cybix.io", role: "Deployer", initials: "AT" },
  { name: "Kaan B.", email: "kaan@cybix.io", role: "Viewer", initials: "KB" },
];

const Team = () => (
  <AppShell
    title="Team & Roles"
    subtitle="Configure who can create, deploy, and one-click ship."
    actions={<Button variant="brand" size="sm"><UserPlus className="h-4 w-4" /> Invite member</Button>}
  >
    <section className="mb-6">
      <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
        <ShieldCheck className="h-4 w-4 text-primary" /> Roles
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {roles.map((r) => (
          <div key={r.key} className="section-card p-4">
            <div className={cn("h-8 w-8 rounded-lg bg-gradient-to-br shadow-soft mb-2", r.color)} />
            <div className="text-sm font-semibold">{r.label}</div>
            <div className="text-[11px] text-muted-foreground mt-1 leading-snug">{r.desc}</div>
          </div>
        ))}
      </div>
    </section>

    <section>
      <h3 className="text-sm font-semibold mb-3">Members</h3>
      <div className="section-card p-0 overflow-hidden">
        <ul className="divide-y divide-border/60">
          {members.map((m) => (
            <li key={m.email} className="flex items-center gap-4 p-4 hover:bg-secondary/40 transition-base">
              <Avatar className="h-10 w-10">
                <AvatarFallback className="brand-gradient-bg text-[hsl(var(--on-brand))] text-xs font-semibold">{m.initials}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium">{m.name}</div>
                <div className="text-xs text-muted-foreground">{m.email}</div>
              </div>
              <span className="text-xs font-medium px-2.5 py-1 rounded-md brand-soft-bg border border-border/60">
                {m.role}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  </AppShell>
);

export default Team;
