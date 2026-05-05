import { useMemo, useState } from "react";
import {
  Github,
  GitlabIcon as Gitlab,
  HardDrive,
  Server,
  KeyRound,
  ShieldCheck,
  Search,
  RefreshCw,
  Plus,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  repositories as initialRepos,
  projects,
  type RepoProvider,
  type RepoAuthMethod,
  type Repository,
} from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { ConnectRepositoryDialog } from "@/components/connect-repository-dialog";

const providerIcon = (p: RepoProvider) => {
  switch (p) {
    case "github": return <Github className="h-3.5 w-3.5" />;
    case "gitlab": return <Gitlab className="h-3.5 w-3.5" />;
    case "company-server": return <Server className="h-3.5 w-3.5" />;
    case "local-pc": return <HardDrive className="h-3.5 w-3.5" />;
  }
};

const AUTH_LABEL: Record<RepoAuthMethod, string> = {
  oauth: "OAuth",
  pat: "Personal Access Token",
  ssh: "SSH key",
  userpass: "User / Password",
};

export const RepositoriesAdminView = () => {
  const [repos, setRepos] = useState<Repository[]>(initialRepos);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [projectFilter, setProjectFilter] = useState<string>("all");
  const [connectOpen, setConnectOpen] = useState(false);

  const filtered = useMemo(() => {
    return repos.filter((r) => {
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      if (projectFilter !== "all" && r.projectId !== projectFilter) return false;
      if (query.trim()) {
        const q = query.toLowerCase();
        if (!r.name.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [repos, query, statusFilter, projectFilter]);

  const counts = useMemo(() => {
    return {
      total: repos.length,
      connected: repos.filter((r) => r.status === "connected").length,
      needsAttention: repos.filter((r) => r.status !== "connected").length,
    };
  }, [repos]);

  const handleAuthChange = (id: string, method: RepoAuthMethod) => {
    setRepos((all) => all.map((r) => (r.id === id ? { ...r, authMethod: method } : r)));
    toast.success("Auth method updated", { description: AUTH_LABEL[method] });
  };

  const handleVerify = (r: Repository) => {
    toast.success("Verifying credentials…", { description: r.name });
    window.setTimeout(() => {
      setRepos((all) =>
        all.map((x) => (x.id === r.id ? { ...x, status: "connected", lastVerifiedAt: "Just now" } : x)),
      );
      toast.success("Verified", { description: `${r.name} is connected.` });
    }, 900);
  };

  const handleDisconnect = (r: Repository) => {
    setRepos((all) => all.filter((x) => x.id !== r.id));
    toast.success("Repository disconnected", { description: r.name });
  };

  return (
    <>
      {/* Summary row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        <div className="section-card p-4">
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Total repos</div>
          <div className="text-xl font-bold mt-1">{counts.total}</div>
        </div>
        <div className="section-card p-4">
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Connected</div>
          <div className="text-xl font-bold mt-1 text-success">{counts.connected}</div>
        </div>
        <div className="section-card p-4">
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Need attention</div>
          <div className="text-xl font-bold mt-1 text-failed">{counts.needsAttention}</div>
        </div>
        <div className="section-card p-4 flex items-center justify-center">
          <Button variant="brand" size="sm" onClick={() => setConnectOpen(true)}>
            <Plus className="h-4 w-4" /> Connect repository
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div className="relative flex-1 min-w-[220px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search repositories…"
            className="pl-9"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <Select value={projectFilter} onValueChange={setProjectFilter}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="Project" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All projects</SelectItem>
            {projects.map((p) => (
              <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="connected">Connected</SelectItem>
            <SelectItem value="expired">Expired</SelectItem>
            <SelectItem value="needs-auth">Needs auth</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* List */}
      <div className="section-card overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-10 text-center">
            <div className="mx-auto h-12 w-12 rounded-xl brand-soft-bg flex items-center justify-center mb-3">
              <ShieldCheck className="h-5 w-5 text-primary" />
            </div>
            <div className="text-sm font-semibold">No repositories match your filters</div>
            <p className="text-xs text-muted-foreground mt-1">Adjust filters or connect a new repository.</p>
          </div>
        ) : (
          <ul className="divide-y divide-border/60">
            {filtered.map((r) => {
              const project = projects.find((p) => p.id === r.projectId);
              return (
                <li
                  key={r.id}
                  className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)_minmax(0,1.2fr)_auto] gap-3 items-center px-4 sm:px-5 py-3 hover:bg-secondary/40 transition-base"
                >
                  {/* Repo identity */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-9 w-9 rounded-md brand-soft-bg flex items-center justify-center text-primary shrink-0">
                      {providerIcon(r.provider)}
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-semibold font-mono truncate">{r.name}</div>
                      <div className="text-[11px] text-muted-foreground truncate">
                        {project?.name ?? "—"} · default {r.defaultBranch}
                      </div>
                    </div>
                  </div>

                  {/* Status */}
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "text-[10px] font-medium px-2 py-0.5 rounded-md border whitespace-nowrap",
                        r.status === "connected" && "bg-success/10 text-success border-success/30",
                        r.status === "expired" && "bg-queued/10 text-queued border-queued/30",
                        r.status === "needs-auth" && "bg-failed/10 text-failed border-failed/30",
                      )}
                    >
                      {r.status === "connected" ? "Connected" : r.status === "expired" ? "Expired" : "Needs auth"}
                    </span>
                    <span className="text-[11px] text-muted-foreground truncate">
                      verified {r.lastVerifiedAt}
                    </span>
                  </div>

                  {/* Auth method selector */}
                  <div className="flex items-center gap-2 min-w-0">
                    <KeyRound className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <Select
                      value={r.authMethod}
                      onValueChange={(v) => handleAuthChange(r.id, v as RepoAuthMethod)}
                    >
                      <SelectTrigger className="h-8 text-xs w-full max-w-[200px]"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {(Object.keys(AUTH_LABEL) as RepoAuthMethod[]).map((m) => (
                          <SelectItem key={m} value={m}>{AUTH_LABEL[m]}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 justify-end">
                    <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={() => handleVerify(r)}>
                      <RefreshCw className="h-3.5 w-3.5" /> Verify
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-failed hover:text-failed"
                      onClick={() => handleDisconnect(r)}
                      aria-label="Disconnect"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <ConnectRepositoryDialog open={connectOpen} onOpenChange={setConnectOpen} />
    </>
  );
};
