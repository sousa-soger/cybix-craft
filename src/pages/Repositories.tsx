import { useMemo, useState } from "react";
import {
  Plus,
  Github,
  GitlabIcon as Gitlab,
  HardDrive,
  Server,
  Search,
  LayoutGrid,
  List as ListIcon,
  GitBranch,
  Tag,
  Users,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ConnectRepositoryDialog } from "@/components/connect-repository-dialog";
import { RepositoryDetailsSheet } from "@/components/repository-details-sheet";
import {
  repositories as initialRepos,
  type Repository,
  type RepoProvider,
} from "@/lib/mock-data";
import { cn } from "@/lib/utils";

const providerIcon = (p: RepoProvider, cls = "h-4 w-4") => {
  switch (p) {
    case "github": return <Github className={cls} />;
    case "gitlab": return <Gitlab className={cls} />;
    case "company-server": return <Server className={cls} />;
    case "local-pc": return <HardDrive className={cls} />;
  }
};

const providerLabel: Record<RepoProvider, string> = {
  github: "GitHub",
  gitlab: "GitLab",
  "company-server": "Company server",
  "local-pc": "Local PC",
};

const StatusPill = ({ status }: { status: Repository["status"] }) => (
  <span
    className={cn(
      "inline-flex items-center gap-1.5 text-[10px] font-semibold px-2 py-0.5 rounded-md border whitespace-nowrap",
      status === "connected" && "bg-success/10 text-success border-success/30",
      status === "expired" && "bg-queued/10 text-queued border-queued/30",
      status === "needs-auth" && "bg-failed/10 text-failed border-failed/30",
    )}
  >
    <span className="h-1.5 w-1.5 rounded-full bg-current" />
    {status === "connected" ? "Connected" : status === "expired" ? "Expired" : "Needs auth"}
  </span>
);

const Repositories = () => {
  const [repos, setRepos] = useState<Repository[]>(initialRepos);
  const [query, setQuery] = useState("");
  const [view, setView] = useState<"card" | "list">("card");
  const [connectOpen, setConnectOpen] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (!query.trim()) return repos;
    const q = query.toLowerCase();
    return repos.filter(
      (r) => r.name.toLowerCase().includes(q) || r.url.toLowerCase().includes(q),
    );
  }, [repos, query]);

  const active = repos.find((r) => r.id === activeId) ?? null;

  const updateRepo = (id: string, patch: Partial<Repository>) =>
    setRepos((all) => all.map((r) => (r.id === id ? { ...r, ...patch } : r)));

  const removeRepo = (id: string) => {
    setRepos((all) => all.filter((r) => r.id !== id));
    setActiveId(null);
  };

  return (
    <AppShell
      title="Repositories"
      subtitle="GitHub, GitLab, company servers and local repositories."
      actions={
        <Button variant="brand" size="sm" onClick={() => setConnectOpen(true)}>
          <Plus className="h-4 w-4" /> Connect Repository
        </Button>
      }
    >
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <div className="relative flex-1 min-w-[220px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search repositories…"
            className="pl-9"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className="ml-auto inline-flex items-center rounded-lg border border-border/70 bg-card p-1 shadow-sm">
          <button
            onClick={() => setView("card")}
            className={cn(
              "px-2.5 py-1.5 rounded-md text-xs font-semibold inline-flex items-center gap-1.5 transition-base",
              view === "card" ? "brand-soft-bg text-foreground shadow-soft" : "text-muted-foreground hover:text-foreground",
            )}
            aria-label="Card view"
          >
            <LayoutGrid className="h-3.5 w-3.5" /> Cards
          </button>
          <button
            onClick={() => setView("list")}
            className={cn(
              "px-2.5 py-1.5 rounded-md text-xs font-semibold inline-flex items-center gap-1.5 transition-base",
              view === "list" ? "brand-soft-bg text-foreground shadow-soft" : "text-muted-foreground hover:text-foreground",
            )}
            aria-label="List view"
          >
            <ListIcon className="h-3.5 w-3.5" /> List
          </button>
        </div>
      </div>

      {filtered.length === 0 && (
        <div className="section-card p-12 text-center">
          <div className="mx-auto h-12 w-12 rounded-xl brand-soft-bg flex items-center justify-center mb-3">
            <GitBranch className="h-5 w-5 text-primary" />
          </div>
          <div className="text-sm font-semibold">No repositories found</div>
          <p className="text-xs text-muted-foreground mt-1">
            {query ? "Try a different search." : "Connect your first repository to get started."}
          </p>
          {!query && (
            <Button variant="brand" size="sm" className="mt-4" onClick={() => setConnectOpen(true)}>
              <Plus className="h-4 w-4" /> Connect Repository
            </Button>
          )}
        </div>
      )}

      {/* Card view */}
      {view === "card" && filtered.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((r) => (
            <button
              key={r.id}
              onClick={() => setActiveId(r.id)}
              className="section-card text-left p-5 group hover:border-primary/40 hover:shadow-soft transition-base relative overflow-hidden"
            >
              <div className="absolute -top-12 -right-12 h-32 w-32 rounded-full brand-gradient-bg opacity-10 blur-2xl pointer-events-none" />
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="h-10 w-10 rounded-lg brand-soft-bg flex items-center justify-center text-primary shrink-0">
                  {providerIcon(r.provider, "h-5 w-5")}
                </div>
                <StatusPill status={r.status} />
              </div>
              <div className="text-sm font-semibold font-mono truncate">{r.name}</div>
              <div className="text-[11px] text-muted-foreground mt-0.5">{providerLabel[r.provider]}</div>
              <div className="mt-3 flex flex-wrap items-center gap-1.5">
                <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-secondary/70 text-muted-foreground inline-flex items-center gap-1">
                  <GitBranch className="h-2.5 w-2.5" /> {r.branches.length} branches
                </span>
                <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-secondary/70 text-muted-foreground inline-flex items-center gap-1">
                  <Tag className="h-2.5 w-2.5" /> {r.tags.length} tags
                </span>
                <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-secondary/70 text-muted-foreground inline-flex items-center gap-1">
                  <Users className="h-2.5 w-2.5" /> {r.members.length}
                </span>
              </div>
              <div className="mt-3 text-[11px] text-muted-foreground">default · {r.defaultBranch}</div>
            </button>
          ))}
          {/* Add tile */}
          <button
            onClick={() => setConnectOpen(true)}
            className="rounded-2xl border border-dashed border-border/70 hover:border-primary/50 hover:bg-secondary/30 transition-base p-5 flex flex-col items-center justify-center gap-2 min-h-[180px]"
          >
            <div className="h-10 w-10 rounded-lg brand-soft-bg flex items-center justify-center text-primary">
              <Plus className="h-5 w-5" />
            </div>
            <div className="text-sm font-semibold">Connect Repository</div>
            <div className="text-[11px] text-muted-foreground">GitHub, GitLab, or custom server</div>
          </button>
        </div>
      )}

      {/* List view */}
      {view === "list" && filtered.length > 0 && (
        <div className="section-card p-0 overflow-hidden">
          <div className="grid grid-cols-[minmax(0,2fr)_minmax(0,1fr)_auto_auto_auto] gap-3 px-5 py-2.5 text-[10px] uppercase tracking-wider text-muted-foreground bg-secondary/40 border-b border-border/60 font-semibold">
            <div>Repository</div>
            <div className="hidden md:block">Provider</div>
            <div className="hidden md:block text-right">Branches</div>
            <div className="hidden md:block text-right">Members</div>
            <div className="text-right">Status</div>
          </div>
          <ul className="divide-y divide-border/60">
            {filtered.map((r) => (
              <li key={r.id}>
                <button
                  onClick={() => setActiveId(r.id)}
                  className="w-full grid grid-cols-[minmax(0,2fr)_minmax(0,1fr)_auto_auto_auto] gap-3 items-center px-5 py-3 hover:bg-secondary/40 transition-base text-left"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-9 w-9 rounded-md brand-soft-bg flex items-center justify-center text-primary shrink-0">
                      {providerIcon(r.provider)}
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-semibold font-mono truncate">{r.name}</div>
                      <div className="text-[11px] text-muted-foreground truncate">{r.url}</div>
                    </div>
                  </div>
                  <div className="hidden md:block text-xs text-muted-foreground">{providerLabel[r.provider]}</div>
                  <div className="hidden md:block text-xs text-muted-foreground tabular-nums text-right">{r.branches.length}</div>
                  <div className="hidden md:block text-xs text-muted-foreground tabular-nums text-right">{r.members.length}</div>
                  <div className="text-right"><StatusPill status={r.status} /></div>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <ConnectRepositoryDialog open={connectOpen} onOpenChange={setConnectOpen} />
      <RepositoryDetailsSheet
        repo={active}
        open={!!active}
        onOpenChange={(o) => !o && setActiveId(null)}
        onUpdate={updateRepo}
        onRemove={removeRepo}
      />
    </AppShell>
  );
};

export default Repositories;
