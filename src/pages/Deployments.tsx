import { AppShell } from "@/components/app-shell";
import { EnvBadge, StatusBadge } from "@/components/badges";
import { deployments } from "@/lib/mock-data";

const Deployments = () => (
  <AppShell title="Deployments" subtitle="Live and historical deployment activity.">
    <div className="section-card p-0 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-secondary/50 text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="text-left font-medium px-5 py-3">Deployment</th>
              <th className="text-left font-medium px-5 py-3">Server</th>
              <th className="text-left font-medium px-5 py-3">Env</th>
              <th className="text-left font-medium px-5 py-3">Duration</th>
              <th className="text-left font-medium px-5 py-3">By</th>
              <th className="text-left font-medium px-5 py-3">Status</th>
              <th className="text-right font-medium px-5 py-3">When</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {deployments.map((d) => (
              <tr key={d.id} className="hover:bg-secondary/40 transition-base">
                <td className="px-5 py-3">
                  <div className="font-mono text-[11px] truncate max-w-xs">{d.packageName}</div>
                  <div className="text-[11px] text-muted-foreground">#{d.id}</div>
                </td>
                <td className="px-5 py-3">{d.serverName}</td>
                <td className="px-5 py-3"><EnvBadge env={d.environment} /></td>
                <td className="px-5 py-3 tabular-nums text-xs">{d.duration}</td>
                <td className="px-5 py-3 text-xs">{d.deployedBy}</td>
                <td className="px-5 py-3"><StatusBadge status={d.status} /></td>
                <td className="px-5 py-3 text-right text-xs text-muted-foreground">{d.deployedAt}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </AppShell>
);

export default Deployments;
