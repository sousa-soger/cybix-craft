import { useState } from "react";
import { Github, GitlabIcon as Gitlab, HardDrive, Plus, Server } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { repositories, projects, type RepoProvider } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import { ConnectRepositoryDialog } from "@/components/connect-repository-dialog";

const providerIcon = (p: RepoProvider) => {
  switch (p) {
    case "github": return <Github className="h-4 w-4" />;
    case "gitlab": return <Gitlab className="h-4 w-4" />;
    case "company-server": return <Server className="h-4 w-4" />;
    case "local-pc": return <HardDrive className="h-4 w-4" />;
  }
};

const Repositories = () => {
  const [open, setOpen] = useState(false);

  return (
    <AppShell
      title="Repositories"
      subtitle="GitHub, GitLab, company servers and local repositories."
      actions={
        <Button variant="brand" size="sm" onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4" /> Connect Repository
        </Button>
      }
    >
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {repositories.map((r) => {
          const project = projects.find((p) => p.id === r.projectId);
          return (
            <div key={r.id} className="section-card p-5">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="h-10 w-10 rounded-lg brand-soft-bg flex items-center justify-center text-primary">
                  {providerIcon(r.provider)}
                </div>
                <span
                  className={cn(
                    "text-[11px] font-medium px-2 py-0.5 rounded-md border",
                    r.status === "connected" && "bg-success/10 text-success border-success/30",
                    r.status === "expired" && "bg-queued/10 text-queued border-queued/30",
                    r.status === "needs-auth" && "bg-failed/10 text-failed border-failed/30",
                  )}
                >
                  {r.status === "connected" ? "Connected" : r.status === "expired" ? "Expired" : "Needs auth"}
                </span>
              </div>
              <div className="text-sm font-semibold truncate">{r.name}</div>
              <div className="text-xs text-muted-foreground">{project?.name}</div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-secondary text-muted-foreground">
                  {r.branches.length} branches
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-secondary text-muted-foreground">
                  {r.tags.length} tags
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-secondary text-muted-foreground">
                  default · {r.defaultBranch}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <ConnectRepositoryDialog open={open} onOpenChange={setOpen} />
    </AppShell>
  );
};

export default Repositories;
