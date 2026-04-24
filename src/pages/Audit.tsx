import { AppShell } from "@/components/app-shell";
import { EnvBadge } from "@/components/badges";
import { CheckCircle2, ShieldAlert, UserCog, XCircle, PackagePlus, Rocket } from "lucide-react";
import { cn } from "@/lib/utils";

interface AuditEntry {
  id: string;
  type: "package" | "deploy" | "failure" | "role";
  message: string;
  meta?: string;
  env?: "DEV" | "QA" | "PROD";
  user: string;
  when: string;
}

const entries: AuditEntry[] = [
  { id: "a1", type: "deploy", message: "Deployed pkg-001 to atlas-prod-eu-1", env: "PROD", user: "Demir A.", when: "1h ago" },
  { id: "a2", type: "package", message: "Created package PROD-atlas-web-v4.1.3-to-v4.2.0", env: "PROD", user: "Demir A.", when: "2h ago" },
  { id: "a3", type: "failure", message: "Deployment d-398 failed on helios-prod-eu-1", env: "PROD", user: "Ayşe T.", when: "Yesterday" },
  { id: "a4", type: "role", message: "Changed role of Mert O. → Package Creator", user: "Selin K.", when: "Yesterday" },
  { id: "a5", type: "deploy", message: "Deployed pkg-003 to atlas-dev-1", env: "DEV", user: "Mert O.", when: "Yesterday" },
  { id: "a6", type: "package", message: "Created package QA-helios-api-main", env: "QA", user: "Selin K.", when: "12m ago" },
];

const iconFor = (t: AuditEntry["type"]) => {
  switch (t) {
    case "package": return { icon: <PackagePlus className="h-4 w-4" />, tone: "bg-running/10 text-running" };
    case "deploy": return { icon: <Rocket className="h-4 w-4" />, tone: "bg-success/10 text-success" };
    case "failure": return { icon: <XCircle className="h-4 w-4" />, tone: "bg-failed/10 text-failed" };
    case "role": return { icon: <UserCog className="h-4 w-4" />, tone: "bg-queued/10 text-queued" };
  }
};

const Audit = () => (
  <AppShell title="Audit Logs" subtitle="A complete trail of every meaningful action.">
    <div className="section-card p-0 overflow-hidden">
      <ul className="divide-y divide-border/60">
        {entries.map((e) => {
          const { icon, tone } = iconFor(e.type);
          return (
            <li key={e.id} className="flex items-center gap-4 p-4 hover:bg-secondary/40 transition-base">
              <div className={cn("h-9 w-9 rounded-lg flex items-center justify-center shrink-0", tone)}>
                {icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{e.message}</div>
                <div className="text-xs text-muted-foreground">{e.user} · {e.when}</div>
              </div>
              {e.env && <EnvBadge env={e.env} />}
            </li>
          );
        })}
      </ul>
    </div>
    <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
      <ShieldAlert className="h-3.5 w-3.5" />
      Logs are append-only and retained for 90 days.
      <CheckCircle2 className="h-3.5 w-3.5 text-success ml-auto" />
      Tamper-evident
    </div>
  </AppShell>
);

export default Audit;
