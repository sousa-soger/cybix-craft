import { useMemo, useState } from "react";
import {
  Plus,
  FolderKanban,
  GitBranch,
  Github,
  GitlabIcon as Gitlab,
  HardDrive,
  Server,
  Pencil,
  Trash2,
  Users,
  Search,
  X,
  Rocket,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  projects as initialProjects,
  repositories,
  teams,
  type Project,
  type RepoProvider,
} from "@/lib/mock-data";
import { ProjectDialog } from "@/components/project-dialog";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const providerIcon = (p: RepoProvider) => {
  switch (p) {
    case "github": return <Github className="h-3.5 w-3.5" />;
    case "gitlab": return <Gitlab className="h-3.5 w-3.5" />;
    case "company-server": return <Server className="h-3.5 w-3.5" />;
    case "local-pc": return <HardDrive className="h-3.5 w-3.5" />;
  }
};

const Projects = () => {
  const [list, setList] = useState<Project[]>(initialProjects);
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Project | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (!query.trim()) return list;
    const q = query.toLowerCase();
    return list.filter(
      (p) => p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q),
    );
  }, [list, query]);

  const selected = selectedId ? list.find((p) => p.id === selectedId) : null;
  const selectedRepos = selected ? repositories.filter((r) => r.projectId === selected.id) : [];
  const selectedTeams = selected ? teams.filter((t) => t.projectIds.includes(selected.id)) : [];

  const openCreate = () => {
    setEditing(null);
    setDialogOpen(true);
  };
  const openEdit = (p: Project) => {
    setEditing(p);
    setDialogOpen(true);
  };

  const handleSubmit = (data: { name: string; description: string; color: string }) => {
    if (editing) {
      setList((prev) =>
        prev.map((p) => (p.id === editing.id ? { ...p, ...data } : p)),
      );
      toast.success("Project updated", { description: data.name });
    } else {
      const id = `p-${Date.now()}`;
      setList((prev) => [
        ...prev,
        { id, ...data, repoCount: 0, lastDeployedAt: "—" },
      ]);
      toast.success("Project created", { description: data.name });
    }
  };

  const handleDelete = () => {
    if (!deleteId) return;
    const p = list.find((x) => x.id === deleteId);
    setList((prev) => prev.filter((x) => x.id !== deleteId));
    if (selectedId === deleteId) setSelectedId(null);
    toast.success("Project deleted", { description: p?.name });
    setDeleteId(null);
  };

  return (
    <AppShell
      title="Projects and Repositories"
      subtitle="Create and organize projects, see their repositories and the teams behind them."
      actions={
        <Button variant="brand" size="sm" onClick={openCreate}>
          <Plus className="h-4 w-4" /> New Project
        </Button>
      }
    >
      {/* Search */}
      <div className="mb-5 relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search projects…"
          className="pl-9"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {/* Empty state */}
      {filtered.length === 0 && (
        <div className="section-card p-10 text-center">
          <div className="mx-auto h-12 w-12 rounded-xl brand-soft-bg flex items-center justify-center mb-3">
            <FolderKanban className="h-5 w-5 text-primary" />
          </div>
          <div className="text-sm font-semibold">No projects found</div>
          <p className="text-xs text-muted-foreground mt-1">
            {query ? "Try a different search." : "Create your first project to start grouping repositories."}
          </p>
          {!query && (
            <Button variant="brand" size="sm" className="mt-4" onClick={openCreate}>
              <Plus className="h-4 w-4" /> New Project
            </Button>
          )}
        </div>
      )}

      {/* Grid (with inline accordion expand) */}
      {filtered.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((p) => {
            const projectRepos = repositories.filter((r) => r.projectId === p.id);
            const projectTeams = teams.filter((t) => t.projectIds.includes(p.id));
            const repoCount = projectRepos.length;
            const teamCount = projectTeams.length;
            const active = selectedId === p.id;
            return (
              <FragmentRow key={p.id}>
                <button
                  onClick={() => setSelectedId(active ? null : p.id)}
                  className={cn(
                    "section-card p-5 text-left group cursor-pointer relative overflow-hidden transition-base",
                    active && "ring-2 ring-primary shadow-soft",
                  )}
                >
                  <div
                    className={cn(
                      "absolute -top-12 -right-12 h-32 w-32 rounded-full bg-gradient-to-br opacity-20 blur-2xl pointer-events-none",
                      p.color,
                    )}
                  />
                  <div className="flex items-start justify-between gap-3 mb-3 relative">
                    <div
                      className={cn(
                        "h-10 w-10 rounded-lg bg-gradient-to-br shadow-soft flex items-center justify-center",
                        p.color,
                      )}
                    >
                      <FolderKanban className="h-4 w-4 on-brand" />
                    </div>
                    <div
                      className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-base"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => openEdit(p)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-failed hover:text-failed"
                        onClick={() => setDeleteId(p.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                  <div className="text-sm font-semibold relative">{p.name}</div>
                  <div className="text-xs text-muted-foreground mt-1 line-clamp-2 relative min-h-[32px]">
                    {p.description || "No description."}
                  </div>
                  <div className="mt-3 flex items-center gap-3 text-[11px] text-muted-foreground relative">
                    <span className="inline-flex items-center gap-1">
                      <GitBranch className="h-3 w-3" /> {repoCount} repos
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Users className="h-3 w-3" /> {teamCount} teams
                    </span>
                    <span className="ml-auto">{p.lastDeployedAt}</span>
                  </div>
                </button>

                {active && (
                  <section className="col-span-full section-card p-0 overflow-hidden animate-accordion-down">
                    <header className="flex items-start justify-between gap-4 p-5 border-b border-border/60 brand-soft-bg">
                      <div className="flex items-start gap-3 min-w-0">
                        <div
                          className={cn(
                            "h-12 w-12 rounded-xl bg-gradient-to-br shadow-soft flex items-center justify-center shrink-0",
                            p.color,
                          )}
                        >
                          <FolderKanban className="h-5 w-5 on-brand" />
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-base font-semibold truncate">{p.name}</h3>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {p.description || "No description."}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => openEdit(p)}>
                          <Pencil className="h-3.5 w-3.5" /> Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => setSelectedId(null)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </header>

                    <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-border/60">
                      {/* Repositories */}
                      <div className="p-5">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-sm font-semibold inline-flex items-center gap-2">
                            <GitBranch className="h-4 w-4 text-primary" /> Connected repositories
                          </h4>
                          <span className="text-[11px] text-muted-foreground">{projectRepos.length}</span>
                        </div>
                        {projectRepos.length === 0 ? (
                          <p className="text-xs text-muted-foreground py-6 text-center">
                            No repositories connected to this project yet.
                          </p>
                        ) : (
                          <ul className="space-y-2">
                            {projectRepos.map((r) => (
                              <li
                                key={r.id}
                                className="flex items-center gap-3 rounded-lg border border-border/60 p-3 hover:shadow-soft transition-base"
                              >
                                <div className="h-8 w-8 rounded-md brand-soft-bg flex items-center justify-center text-primary shrink-0">
                                  {providerIcon(r.provider)}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="text-xs font-semibold font-mono truncate">{r.name}</div>
                                  <div className="text-[11px] text-muted-foreground">
                                    {r.branches.length} branches · {r.tags.length} tags · default {r.defaultBranch}
                                  </div>
                                </div>
                                <span
                                  className={cn(
                                    "text-[10px] font-medium px-2 py-0.5 rounded-md border",
                                    r.status === "connected" && "bg-success/10 text-success border-success/30",
                                    r.status === "expired" && "bg-queued/10 text-queued border-queued/30",
                                    r.status === "needs-auth" && "bg-failed/10 text-failed border-failed/30",
                                  )}
                                >
                                  {r.status === "connected" ? "Connected" : r.status === "expired" ? "Expired" : "Needs auth"}
                                </span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>

                      {/* Teams */}
                      <div className="p-5">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-sm font-semibold inline-flex items-center gap-2">
                            <Users className="h-4 w-4 text-primary" /> Teams involved
                          </h4>
                          <span className="text-[11px] text-muted-foreground">{projectTeams.length}</span>
                        </div>
                        {projectTeams.length === 0 ? (
                          <p className="text-xs text-muted-foreground py-6 text-center">
                            No teams have been assigned to this project.
                          </p>
                        ) : (
                          <ul className="space-y-2">
                            {projectTeams.map((t) => (
                              <li
                                key={t.id}
                                className="flex items-center gap-3 rounded-lg border border-border/60 p-3 hover:shadow-soft transition-base"
                              >
                                <div
                                  className={cn(
                                    "h-9 w-9 rounded-lg bg-gradient-to-br shadow-soft flex items-center justify-center text-[11px] font-semibold on-brand shrink-0",
                                    t.avatarColor,
                                  )}
                                >
                                  {t.name.split(" ").map((w) => w[0]).join("").slice(0, 2)}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="text-xs font-semibold truncate">{t.name}</div>
                                  <div className="text-[11px] text-muted-foreground">
                                    {t.members.length} members · {t.projectIds.length} projects
                                  </div>
                                </div>
                                <span className="text-[11px] text-muted-foreground inline-flex items-center gap-1">
                                  <Rocket className="h-3 w-3" /> active
                                </span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>
                  </section>
                )}
              </FragmentRow>
            );
          })}
        </div>
      )}

      <ProjectDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        project={editing}
        onSubmit={handleSubmit}
      />

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this project?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the project from the workspace. Connected repositories and packages will keep
              their history but will no longer be grouped under it.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-failed text-failed-foreground hover:bg-failed/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppShell>
  );
};

export default Projects;
