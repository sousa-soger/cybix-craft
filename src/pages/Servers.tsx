import { Plus, Server as ServerIcon } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { EnvBadge } from "@/components/badges";
import { servers } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

const Servers = () => (
  <AppShell
    title="Servers"
    subtitle="Deployment targets. Credentials are managed securely on the backend."
    actions={<Button variant="brand" size="sm"><Plus className="h-4 w-4" /> Add Server</Button>}
  >
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {servers.map((s) => (
        <div key={s.id} className="section-card p-5">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="h-10 w-10 rounded-lg brand-soft-bg flex items-center justify-center text-primary">
              <ServerIcon className="h-4 w-4" />
            </div>
            <span className={cn(
              "text-[11px] font-medium px-2 py-0.5 rounded-md border inline-flex items-center gap-1.5",
              s.status === "online" ? "bg-success/10 text-success border-success/30" : "bg-inactive/15 text-inactive border-inactive/30",
            )}>
              <span className={cn("h-1.5 w-1.5 rounded-full bg-current", s.status === "online" && "animate-pulse-soft")} />
              {s.status === "online" ? "Online" : "Offline"}
            </span>
          </div>
          <div className="flex items-center gap-2 mb-1">
            <div className="text-sm font-semibold">{s.name}</div>
            <EnvBadge env={s.environment} />
          </div>
          <div className="font-mono text-xs text-muted-foreground">{s.protocol} · {s.host}</div>
          <div className="font-mono text-[11px] text-muted-foreground mt-1 truncate">{s.path}</div>
        </div>
      ))}
    </div>
  </AppShell>
);

export default Servers;
