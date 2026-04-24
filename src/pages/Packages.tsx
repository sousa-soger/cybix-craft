import { Link } from "react-router-dom";
import { Download, PackagePlus, Rocket, Search } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EnvBadge, StatusBadge } from "@/components/badges";
import { packages, projects, repositories } from "@/lib/mock-data";

const Packages = () => (
  <AppShell
    title="Packages"
    subtitle="Update and rollback bundles across all your projects."
    actions={
      <Link to="/create">
        <Button variant="brand" size="sm">
          <PackagePlus className="h-4 w-4" /> New Package
        </Button>
      </Link>
    }
  >
    <div className="flex items-center justify-between gap-3 mb-4">
      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search packages…" className="pl-9 bg-card" />
      </div>
    </div>

    <div className="section-card p-0 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-secondary/50 text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="text-left font-medium px-5 py-3">Package</th>
              <th className="text-left font-medium px-5 py-3">Project</th>
              <th className="text-left font-medium px-5 py-3">Versions</th>
              <th className="text-left font-medium px-5 py-3">Env</th>
              <th className="text-left font-medium px-5 py-3">Size</th>
              <th className="text-left font-medium px-5 py-3">Status</th>
              <th className="text-left font-medium px-5 py-3">Created</th>
              <th className="text-right font-medium px-5 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {packages.map((p) => {
              const project = projects.find((pr) => pr.id === p.projectId);
              const repo = repositories.find((r) => r.id === p.repositoryId);
              return (
                <tr key={p.id} className="hover:bg-secondary/40 transition-base">
                  <td className="px-5 py-3">
                    <div className="font-mono text-[11px] text-foreground/80 max-w-xs truncate">{p.name}</div>
                    <div className="text-[11px] text-muted-foreground">{repo?.name}</div>
                  </td>
                  <td className="px-5 py-3">{project?.name}</td>
                  <td className="px-5 py-3">
                    <div className="font-mono text-xs">
                      {p.baseVersion} <span className="text-muted-foreground">→</span> {p.targetVersion}
                    </div>
                  </td>
                  <td className="px-5 py-3"><EnvBadge env={p.environment} /></td>
                  <td className="px-5 py-3 tabular-nums text-xs">
                    {p.sizeMB > 0 ? `${p.sizeMB} MB` : "—"}
                  </td>
                  <td className="px-5 py-3"><StatusBadge status={p.status} /></td>
                  <td className="px-5 py-3 text-xs text-muted-foreground">{p.createdAt}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Button size="sm" variant="ghost" disabled={p.status !== "success"}>
                        <Download className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="sm" variant="soft" disabled={p.status !== "success"}>
                        <Rocket className="h-3.5 w-3.5" /> Deploy
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  </AppShell>
);

export default Packages;
