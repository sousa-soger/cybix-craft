import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  FileDiff,
  FileMinus,
  FilePlus2,
  FilePenLine,
  FolderOpen,
  Github,
  GitBranch as GitBranchIcon,
  GitlabIcon as Gitlab,
  HardDrive,
  Layers,
  Package as PackageIcon,
  Plus,
  Server as ServerIcon,
  ShieldAlert,
  Sparkles,
  Trash2,
  Upload,
  X,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Check, ChevronsUpDown, GitBranch, Tag } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { EnvBadge } from "@/components/badges";
import { cn } from "@/lib/utils";
import {
  mockChangeset,
  projects,
  repositories,
  type Environment,
  type RepoProvider,
  type Repository,
} from "@/lib/mock-data";
import { useToast } from "@/hooks/use-toast";
import { enqueueJob } from "@/lib/package-queue";

const providerIcon = (p: RepoProvider) => {
  switch (p) {
    case "github":
      return <Github className="h-3.5 w-3.5" />;
    case "gitlab":
      return <Gitlab className="h-3.5 w-3.5" />;
    case "company-server":
      return <ServerIcon className="h-3.5 w-3.5" />;
    case "local-pc":
      return <HardDrive className="h-3.5 w-3.5" />;
  }
};

const providerLabel: Record<RepoProvider, string> = {
  github: "GitHub",
  gitlab: "GitLab",
  "company-server": "Company server",
  "local-pc": "Local PC",
};

type SourceMode = "repo" | "gitless";

interface FolderDrop {
  name: string;
  fileCount: number;
  sizeMB: number;
}

interface RepoSelection {
  repoId: string;
  base: string;
  target: string;
}

export const CreatePackage = () => {
  const { toast } = useToast();

  const [sourceMode, setSourceMode] = useState<SourceMode>("repo");

  // ===== Project + repo selections =====
  const [projectId, setProjectId] = useState<string>(projects[0]?.id ?? "");
  const project = projects.find((p) => p.id === projectId);

  const projectRepos: Repository[] = useMemo(
    () =>
      (project?.repositoryIds ?? [])
        .map((id) => repositories.find((r) => r.id === id))
        .filter((r): r is Repository => !!r),
    [project],
  );

  const [selections, setSelections] = useState<RepoSelection[]>([]);

  // When project changes, seed with first repo of project
  useEffect(() => {
    if (projectRepos.length === 0) {
      setSelections([]);
      return;
    }
    const first = projectRepos[0];
    setSelections([
      {
        repoId: first.id,
        base: first.tags[1] ?? first.tags[0] ?? first.branches[0] ?? "",
        target: first.tags[0] ?? first.branches[0] ?? "",
      },
    ]);
  }, [projectId]);

  const addableRepos = projectRepos.filter(
    (r) => !selections.some((s) => s.repoId === r.id),
  );

  const addRepo = (repoId: string) => {
    const r = repositories.find((x) => x.id === repoId);
    if (!r) return;
    setSelections((prev) => [
      ...prev,
      {
        repoId,
        base: r.tags[1] ?? r.tags[0] ?? r.branches[0] ?? "",
        target: r.tags[0] ?? r.branches[0] ?? "",
      },
    ]);
  };

  const removeRepo = (repoId: string) => {
    setSelections((prev) => prev.filter((s) => s.repoId !== repoId));
  };

  const patchSelection = (repoId: string, patch: Partial<RepoSelection>) => {
    setSelections((prev) =>
      prev.map((s) => (s.repoId === repoId ? { ...s, ...patch } : s)),
    );
  };

  // Gitless folder state
  const [baseFolder, setBaseFolder] = useState<FolderDrop | null>(null);
  const [targetFolder, setTargetFolder] = useState<FolderDrop | null>(null);

  const [environment, setEnvironment] = useState<Environment>("DEV");
  const [customName, setCustomName] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [outputFormat, setOutputFormat] = useState<"ZIP" | "TAR.GZ" | "BOTH">("ZIP");
  const [generateRollback, setGenerateRollback] = useState(true);
  const [confirmedProd, setConfirmedProd] = useState(false);

  // Per-selection validity
  const selectionHasIdentical = selections.some(
    (s) => s.base && s.target && s.base === s.target,
  );
  const selectionAllFilled =
    selections.length > 0 && selections.every((s) => s.base && s.target);

  const gitlessIdentical =
    !!baseFolder && !!targetFolder && baseFolder.name === targetFolder.name;

  const identical =
    sourceMode === "repo" ? selectionHasIdentical : gitlessIdentical;

  // Aggregated changeset across selected repos
  const changesets = useMemo(() => {
    if (sourceMode !== "repo") return [];
    return selections
      .map((s) => ({ sel: s, cs: mockChangeset(s.base, s.target) }))
      .filter((x) => x.cs);
  }, [sourceMode, selections]);

  const aggregatedChangeset = useMemo(() => {
    if (sourceMode === "repo") {
      if (changesets.length === 0) return null;
      return changesets.reduce(
        (acc, { cs }) => ({
          added: [...acc.added, ...(cs?.added ?? [])],
          modified: [...acc.modified, ...(cs?.modified ?? [])],
          deleted: [...acc.deleted, ...(cs?.deleted ?? [])],
          estimatedSizeMB: +(acc.estimatedSizeMB + (cs?.estimatedSizeMB ?? 0)).toFixed(1),
        }),
        { added: [] as string[], modified: [] as string[], deleted: [] as string[], estimatedSizeMB: 0 },
      );
    }
    if (baseFolder && targetFolder && !gitlessIdentical) {
      return mockChangeset(baseFolder.name, targetFolder.name);
    }
    return null;
  }, [sourceMode, changesets, baseFolder, targetFolder, gitlessIdentical]);

  const autoName = useMemo(() => {
    const sanitize = (s: string) => s.replace(/[^a-zA-Z0-9.-]/g, "-");
    const ts = new Date().toISOString().slice(0, 16).replace(/[-:T]/g, "").slice(0, 12);
    if (sourceMode === "repo") {
      if (!project || selections.length === 0 || !selectionAllFilled) return "";
      const projShort = sanitize(project.name.toLowerCase());
      if (selections.length === 1) {
        const s = selections[0];
        const r = repositories.find((x) => x.id === s.repoId);
        const rShort = r ? r.name.split("/").pop() ?? "repo" : "repo";
        return `${environment}-${projShort}-${sanitize(rShort)}-${sanitize(s.base)}-to-${sanitize(s.target)}-${ts}`;
      }
      return `${environment}-${projShort}-multi-${selections.length}repos-${ts}`;
    }
    if (!baseFolder || !targetFolder) return "";
    return `${environment}-gitless-${sanitize(baseFolder.name)}-to-${sanitize(targetFolder.name)}-${ts}`;
  }, [sourceMode, project, selections, selectionAllFilled, baseFolder, targetFolder, environment]);

  const finalName = customName.trim() || autoName;

  const canSubmit =
    sourceMode === "repo"
      ? !!project &&
        selections.length > 0 &&
        selectionAllFilled &&
        !selectionHasIdentical &&
        (environment !== "PROD" || confirmedProd)
      : !!baseFolder && !!targetFolder && !gitlessIdentical && (environment !== "PROD" || confirmedProd);

  const handleGenerate = () => {
    if (!canSubmit) return;
    if (sourceMode === "repo" && project) {
      selections.forEach((s, i) => {
        const r = repositories.find((x) => x.id === s.repoId);
        if (!r) return;
        const sanitize = (v: string) => v.replace(/[^a-zA-Z0-9.-]/g, "-");
        const repoShort = r.name.split("/").pop() ?? r.name;
        const perRepoName =
          selections.length === 1
            ? finalName
            : `${finalName}__${sanitize(repoShort)}`;
        enqueueJob({
          name: perRepoName,
          repoId: r.id,
          repoName: `${project.name} · ${r.name}`,
          environment,
          baseVersion: s.base,
          targetVersion: s.target,
          generateRollback,
          outputFormat,
        });
      });
      toast({
        title: selections.length > 1 ? `${selections.length} packages queued` : "Added to queue",
        description: `${project.name} — running in background.`,
      });
    } else if (sourceMode === "gitless" && baseFolder && targetFolder) {
      enqueueJob({
        name: finalName,
        repoId: "gitless",
        repoName: `Gitless · ${baseFolder.name} → ${targetFolder.name}`,
        environment,
        baseVersion: baseFolder.name,
        targetVersion: targetFolder.name,
        generateRollback,
        outputFormat,
      });
      toast({
        title: "Added to queue",
        description: `${finalName} — you can keep working while it builds.`,
      });
    }
    setCustomName("");
    setConfirmedProd(false);
  };

  // ============= FORM =============
  return (
    <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_360px] gap-6">
      {/* LEFT: Sections */}
      <div className="space-y-5">
        {/* SOURCE MODE TOGGLE */}
        <div className="section-card p-2">
          <div className="grid grid-cols-2 gap-1.5 rounded-lg bg-secondary/50 p-1">
            <button
              type="button"
              onClick={() => setSourceMode("repo")}
              className={cn(
                "flex items-center justify-center gap-2 rounded-md px-3 py-2.5 text-sm font-medium transition-all",
                sourceMode === "repo"
                  ? "bg-card shadow-soft text-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Layers className="h-4 w-4" />
              Project
            </button>
            <button
              type="button"
              onClick={() => setSourceMode("gitless")}
              className={cn(
                "flex items-center justify-center gap-2 rounded-md px-3 py-2.5 text-sm font-medium transition-all",
                sourceMode === "gitless"
                  ? "bg-card shadow-soft text-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <FolderOpen className="h-4 w-4" />
              Gitless folders
              <span className="ml-1 rounded-full brand-soft-bg px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                One-time
              </span>
            </button>
          </div>
          <p className="mt-2 px-2 pb-1 text-[11px] text-muted-foreground">
            {sourceMode === "repo"
              ? "Pick a project, then choose one or more repositories within it — package across repos in one go."
              : "Drag & drop two project folders — no git history needed. Great for one-off comparisons."}
          </p>
        </div>

        {sourceMode === "repo" && (
        <>
        {/* SECTION 1 — Project */}
        <SectionCard
          step={1}
          title="Project"
          subtitle="Choose the project to build a package for."
        >
          <div className="space-y-2">
            <Label>Project</Label>
            <Select value={projectId} onValueChange={setProjectId}>
              <SelectTrigger><SelectValue placeholder="Select project" /></SelectTrigger>
              <SelectContent>
                {projects.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    <span className="flex items-center gap-2">
                      <span className={cn("h-2.5 w-2.5 rounded-full bg-gradient-to-br", p.color)} />
                      {p.name}
                      <span className="text-[11px] text-muted-foreground">
                        · {p.repositoryIds.length} repo{p.repositoryIds.length === 1 ? "" : "s"}
                      </span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {project && (
            <div className="mt-4 flex items-start gap-3 rounded-xl border border-border/60 bg-secondary/30 p-3">
              <div className={cn("h-9 w-9 rounded-lg bg-gradient-to-br shrink-0", project.color)} />
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium">{project.name}</div>
                <p className="text-[11px] text-muted-foreground line-clamp-2">{project.description}</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {projectRepos.map((r) => (
                    <span key={r.id} className="inline-flex items-center gap-1 rounded-md bg-card border border-border/60 px-2 py-0.5 text-[11px]">
                      {providerIcon(r.provider)} {r.name.split("/").pop()}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </SectionCard>

        {/* SECTION 2 — Repositories & Versions */}
        <SectionCard
          step={2}
          title="Repositories & Versions"
          subtitle="Select repositories in this project and pick base/target for each. Cross-repo packaging supported."
        >
          {selections.length === 0 && (
            <div className="rounded-lg border border-dashed border-border/70 bg-secondary/30 p-4 text-sm text-muted-foreground text-center">
              No repositories selected. Add one below.
            </div>
          )}

          <div className="space-y-3">
            {selections.map((s) => {
              const r = repositories.find((x) => x.id === s.repoId);
              if (!r) return null;
              const cs = mockChangeset(s.base, s.target);
              const repoIdentical = s.base && s.target && s.base === s.target;
              return (
                <div key={s.repoId} className="rounded-xl border border-border/70 bg-card p-4">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="inline-flex h-7 w-7 items-center justify-center rounded-md brand-soft-bg text-primary">
                        {providerIcon(r.provider)}
                      </span>
                      <div className="min-w-0">
                        <div className="text-sm font-semibold truncate">{r.name}</div>
                        <div className="text-[11px] text-muted-foreground">
                          {providerLabel[r.provider]} · default · {r.defaultBranch}
                        </div>
                      </div>
                    </div>
                    {selections.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeRepo(s.repoId)}
                        className="rounded-md p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground transition-base"
                        aria-label="Remove repository"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-3 items-end">
                    <div className="space-y-2">
                      <Label className="text-xs">Base version</Label>
                      <VersionCombobox
                        value={s.base}
                        onChange={(v) => patchSelection(s.repoId, { base: v })}
                        tags={r.tags}
                        branches={r.branches}
                        placeholder="Select base"
                      />
                    </div>
                    <div className="hidden md:flex items-center justify-center pb-2">
                      <div className="h-8 w-8 rounded-full brand-soft-bg flex items-center justify-center">
                        <ArrowRight className="h-3.5 w-3.5 text-primary" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Target version</Label>
                      <VersionCombobox
                        value={s.target}
                        onChange={(v) => patchSelection(s.repoId, { target: v })}
                        tags={r.tags}
                        branches={r.branches}
                        placeholder="Select target"
                      />
                    </div>
                  </div>

                  {repoIdentical && (
                    <div className="mt-3 flex items-start gap-2 rounded-lg border border-failed/30 bg-failed/8 p-2.5 text-xs text-failed">
                      <ShieldAlert className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                      <span>Base and target are identical for this repository.</span>
                    </div>
                  )}

                  {cs && !repoIdentical && (
                    <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                      <span className="inline-flex items-center gap-1 rounded-md bg-success/10 text-success px-2 py-0.5">
                        <FilePlus2 className="h-3 w-3" /> {cs.added.length}
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-md bg-running/10 text-running px-2 py-0.5">
                        <FilePenLine className="h-3 w-3" /> {cs.modified.length}
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-md bg-failed/10 text-failed px-2 py-0.5">
                        <FileMinus className="h-3 w-3" /> {cs.deleted.length}
                      </span>
                      <span className="ml-auto">~{cs.estimatedSizeMB} MB</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {addableRepos.length > 0 && (
            <div className="mt-3">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="w-full">
                    <Plus className="h-4 w-4" /> Add another repository
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Search repositories..." />
                    <CommandList>
                      <CommandEmpty>No repositories left.</CommandEmpty>
                      <CommandGroup>
                        {addableRepos.map((r) => (
                          <CommandItem
                            key={r.id}
                            value={r.name}
                            onSelect={() => addRepo(r.id)}
                          >
                            {providerIcon(r.provider)}
                            <span className="ml-2 flex-1 truncate">{r.name}</span>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
          )}

          {aggregatedChangeset && selections.length > 1 && (
            <div className="mt-5 animate-fade-in">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Sparkles className="h-4 w-4 text-primary" />
                  Combined changes
                </div>
                <span className="text-xs text-muted-foreground">
                  ~{aggregatedChangeset.estimatedSizeMB} MB · {aggregatedChangeset.added.length + aggregatedChangeset.modified.length + aggregatedChangeset.deleted.length} files
                </span>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <ChangeStat icon={<FilePlus2 className="h-4 w-4" />} label="Added" value={aggregatedChangeset.added.length} tone="success" />
                <ChangeStat icon={<FilePenLine className="h-4 w-4" />} label="Modified" value={aggregatedChangeset.modified.length} tone="running" />
                <ChangeStat icon={<FileMinus className="h-4 w-4" />} label="Deleted" value={aggregatedChangeset.deleted.length} tone="failed" />
              </div>
            </div>
          )}
        </SectionCard>
        </>
        )}

        {sourceMode === "gitless" && (
          <SectionCard
            step={1}
            title="Project folders"
            subtitle="Drag & drop the base and target folders. We'll diff them locally — no git required."
          >
            <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-3 items-stretch">
              <FolderDropzone label="Base folder" hint="Older / current version" tone="base" value={baseFolder} onChange={setBaseFolder} />
              <div className="hidden md:flex items-center justify-center">
                <div className="h-9 w-9 rounded-full brand-soft-bg flex items-center justify-center">
                  <ArrowRight className="h-4 w-4 text-primary" />
                </div>
              </div>
              <FolderDropzone label="Target folder" hint="Newer version to ship" tone="target" value={targetFolder} onChange={setTargetFolder} />
            </div>

            {gitlessIdentical && (
              <div className="mt-4 flex items-start gap-2 rounded-lg border border-failed/30 bg-failed/8 p-3 text-sm text-failed">
                <ShieldAlert className="h-4 w-4 mt-0.5 shrink-0" />
                <span>Base and target folders cannot have the same name. Pick two different folders.</span>
              </div>
            )}

            {aggregatedChangeset && (
              <div className="mt-5 animate-fade-in">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Sparkles className="h-4 w-4 text-primary" />
                    Detected changes
                  </div>
                  <span className="text-xs text-muted-foreground">
                    ~{aggregatedChangeset.estimatedSizeMB} MB · {aggregatedChangeset.added.length + aggregatedChangeset.modified.length + aggregatedChangeset.deleted.length} files
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <ChangeStat icon={<FilePlus2 className="h-4 w-4" />} label="Added" value={aggregatedChangeset.added.length} tone="success" />
                  <ChangeStat icon={<FilePenLine className="h-4 w-4" />} label="Modified" value={aggregatedChangeset.modified.length} tone="running" />
                  <ChangeStat icon={<FileMinus className="h-4 w-4" />} label="Deleted" value={aggregatedChangeset.deleted.length} tone="failed" />
                </div>
              </div>
            )}
          </SectionCard>
        )}

        {/* SECTION 3 — Environment & Package */}
        <SectionCard
          step={sourceMode === "gitless" ? 2 : 3}
          title="Environment & Package Settings"
          subtitle="Where will this package be applied?"
        >
          <div className="grid grid-cols-3 gap-3">
            {(["DEV", "QA", "PROD"] as Environment[]).map((env) => {
              const active = environment === env;
              return (
                <button
                  key={env}
                  type="button"
                  onClick={() => { setEnvironment(env); setConfirmedProd(false); }}
                  className={cn(
                    "rounded-xl border p-4 text-left transition-base",
                    active
                      ? "border-primary/50 brand-soft-bg shadow-soft"
                      : "border-border hover:border-primary/30 hover:bg-secondary/40",
                  )}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <EnvBadge env={env} />
                    {active && <CheckCircle2 className="h-4 w-4 text-primary" />}
                  </div>
                  <div className="text-sm font-medium">
                    {env === "DEV" && "Development"}
                    {env === "QA" && "Quality assurance"}
                    {env === "PROD" && "Production"}
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-1">
                    {env === "DEV" && "Fast deploy, no confirmation"}
                    {env === "QA" && "Moderate confirmation"}
                    {env === "PROD" && "Confirmation required"}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="mt-5 space-y-2">
            <Label>Package name</Label>
            <Input
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              placeholder={autoName || "Auto-generated when versions are picked"}
              className="font-mono text-xs"
            />
            <p className="text-[11px] text-muted-foreground">
              Leave empty to use the auto-generated name. Multi-repo packages append the repo name per job.
            </p>
          </div>

          {environment === "PROD" && (
            <div className="mt-5 rounded-xl border border-failed/30 bg-failed/8 p-4">
              <div className="flex items-start gap-3">
                <ShieldAlert className="h-5 w-5 text-failed mt-0.5" />
                <div className="flex-1">
                  <div className="text-sm font-semibold text-failed">Production safety check</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    You're targeting <strong>PROD</strong>. Review the summary, then confirm to enable generation.
                  </p>
                  <div className="flex items-center gap-2 mt-3">
                    <Switch
                      checked={confirmedProd}
                      onCheckedChange={setConfirmedProd}
                      id="prod-confirm"
                    />
                    <Label htmlFor="prod-confirm" className="text-sm font-normal cursor-pointer">
                      I understand this affects production
                    </Label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Advanced */}
          <div className="mt-5">
            <button
              type="button"
              onClick={() => setShowAdvanced((s) => !s)}
              className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-base"
            >
              {showAdvanced ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              Advanced settings
            </button>
            {showAdvanced && (
              <div className="mt-4 space-y-4 rounded-xl border border-border/70 bg-secondary/30 p-4 animate-fade-in">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Output format</Label>
                    <Select value={outputFormat} onValueChange={(v) => setOutputFormat(v as typeof outputFormat)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ZIP">ZIP</SelectItem>
                        <SelectItem value="TAR.GZ">TAR.GZ</SelectItem>
                        <SelectItem value="BOTH">Both</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center justify-between rounded-lg border border-border/60 bg-card px-3 py-2">
                    <div>
                      <div className="text-sm font-medium">Generate rollback package</div>
                      <p className="text-[11px] text-muted-foreground">Creates a target → base reverse package</p>
                    </div>
                    <Switch checked={generateRollback} onCheckedChange={setGenerateRollback} />
                  </div>
                </div>
              </div>
            )}
          </div>
        </SectionCard>
      </div>

      {/* RIGHT: Live summary */}
      <aside className="xl:sticky xl:top-20 xl:self-start space-y-5">
        <div className="section-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <PackageIcon className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold">Live summary</h3>
          </div>

          <div className="space-y-3 text-sm">
            {sourceMode === "repo" ? (
              <>
                <SummaryRow
                  label="Project"
                  value={project?.name ?? "—"}
                  icon={project ? <span className={cn("h-2.5 w-2.5 rounded-full bg-gradient-to-br", project.color)} /> : undefined}
                />
                <SummaryRow
                  label="Repositories"
                  value={`${selections.length} selected`}
                />
                {selections.length > 0 && (
                  <div className="space-y-1.5 rounded-lg bg-secondary/40 p-2.5">
                    {selections.map((s) => {
                      const r = repositories.find((x) => x.id === s.repoId);
                      if (!r) return null;
                      return (
                        <div key={s.repoId} className="text-[11px]">
                          <div className="flex items-center gap-1.5 font-medium">
                            {providerIcon(r.provider)}
                            <span className="truncate">{r.name.split("/").pop()}</span>
                          </div>
                          <div className="font-mono text-muted-foreground pl-5 truncate">
                            {s.base || "—"} → {s.target || "—"}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            ) : (
              <>
                <SummaryRow
                  label="Source"
                  value="Gitless folders"
                  icon={<FolderOpen className="h-3.5 w-3.5" />}
                />
                <SummaryRow label="Base" value={baseFolder?.name || "—"} mono />
                <SummaryRow label="Target" value={targetFolder?.name || "—"} mono />
              </>
            )}
            <SummaryRow
              label="Environment"
              value={<EnvBadge env={environment} />}
            />
            <SummaryRow label="Rollback" value={generateRollback ? "Included" : "Skipped"} />
            <SummaryRow label="Format" value={outputFormat} />
          </div>

          <Separator className="my-4" />

          <div className="space-y-1.5">
            <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Package name</div>
            <div className="font-mono text-[11px] text-foreground/80 break-all leading-relaxed">
              {finalName || "—"}
            </div>
          </div>

          <Separator className="my-4" />

          {aggregatedChangeset ? (
            <div className="grid grid-cols-3 gap-2 mb-4">
              <MiniStat label="Added" value={aggregatedChangeset.added.length} tone="success" />
              <MiniStat label="Mod." value={aggregatedChangeset.modified.length} tone="running" />
              <MiniStat label="Del." value={aggregatedChangeset.deleted.length} tone="failed" />
            </div>
          ) : (
            <div className="text-xs text-muted-foreground mb-4 flex items-center gap-2">
              <FileDiff className="h-3.5 w-3.5" />
              Pick versions to see changes
            </div>
          )}

          <Button
            size="lg"
            variant="brand"
            className="w-full text-base font-semibold h-12"
            disabled={!canSubmit}
            onClick={handleGenerate}
          >
            <Zap className="h-4 w-4" />
            {sourceMode === "repo" && selections.length > 1
              ? `Generate ${selections.length} Packages`
              : "Generate Package"}
          </Button>
          {!canSubmit && environment === "PROD" && (
            <p className="text-[11px] text-muted-foreground mt-2 text-center">
              Confirm production safety to continue
            </p>
          )}
        </div>
      </aside>
    </div>
  );
};

// ============= Helpers =============

const SectionCard = ({
  step,
  title,
  subtitle,
  children,
}: {
  step: number;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) => (
  <section className="section-card">
    <div className="flex items-start gap-3 mb-5">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg brand-soft-bg text-sm font-semibold text-primary">
        {step}
      </div>
      <div>
        <h2 className="text-base font-semibold tracking-tight">{title}</h2>
        {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
      </div>
    </div>
    {children}
  </section>
);

const ChangeStat = ({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  tone: "success" | "running" | "failed";
}) => (
  <div
    className={cn(
      "rounded-xl border p-3.5",
      tone === "success" && "border-success/25 bg-success/8",
      tone === "running" && "border-running/25 bg-running/8",
      tone === "failed" && "border-failed/25 bg-failed/8",
    )}
  >
    <div
      className={cn(
        "flex items-center gap-2 text-xs font-medium",
        tone === "success" && "text-success",
        tone === "running" && "text-running",
        tone === "failed" && "text-failed",
      )}
    >
      {icon} {label}
    </div>
    <div className="mt-1.5 text-2xl font-semibold tabular-nums">{value}</div>
  </div>
);

const SummaryRow = ({
  label,
  value,
  mono,
  icon,
}: {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
  icon?: React.ReactNode;
}) => (
  <div className="flex items-center justify-between gap-3">
    <span className="text-xs text-muted-foreground">{label}</span>
    <span className={cn("text-sm font-medium flex items-center gap-1.5 max-w-[60%] truncate", mono && "font-mono text-xs")}>
      {icon}
      {value}
    </span>
  </div>
);

const MiniStat = ({ label, value, tone }: { label: string; value: number; tone: "success" | "running" | "failed" }) => (
  <div
    className={cn(
      "rounded-lg border px-2 py-2 text-center",
      tone === "success" && "border-success/25 bg-success/8 text-success",
      tone === "running" && "border-running/25 bg-running/8 text-running",
      tone === "failed" && "border-failed/25 bg-failed/8 text-failed",
    )}
  >
    <div className="text-base font-semibold tabular-nums">{value}</div>
    <div className="text-[10px] uppercase tracking-wider opacity-80">{label}</div>
  </div>
);

const VersionCombobox = ({
  value,
  onChange,
  tags,
  branches,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  tags: string[];
  branches: string[];
  placeholder: string;
}) => {
  const [open, setOpen] = useState(false);
  const isTag = tags.includes(value);
  const isBranch = branches.includes(value);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal"
        >
          <span className="flex items-center gap-2 truncate">
            {isTag && <Tag className="h-3.5 w-3.5 text-muted-foreground" />}
            {isBranch && <GitBranch className="h-3.5 w-3.5 text-muted-foreground" />}
            <span className={cn("truncate", !value && "text-muted-foreground")}>
              {value || placeholder}
            </span>
          </span>
          <ChevronsUpDown className="h-4 w-4 opacity-50 shrink-0" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command>
          <CommandInput placeholder="Search versions..." />
          <CommandList>
            <CommandEmpty>No version found.</CommandEmpty>
            {tags.length > 0 && (
              <CommandGroup heading="Tags">
                {tags.map((v) => (
                  <CommandItem
                    key={`tag-${v}`}
                    value={v}
                    onSelect={() => { onChange(v); setOpen(false); }}
                  >
                    <Tag className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
                    <span className="flex-1 truncate">{v}</span>
                    {value === v && <Check className="h-4 w-4" />}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
            {branches.length > 0 && (
              <CommandGroup heading="Branches">
                {branches.map((v) => (
                  <CommandItem
                    key={`branch-${v}`}
                    value={v}
                    onSelect={() => { onChange(v); setOpen(false); }}
                  >
                    <GitBranch className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
                    <span className="flex-1 truncate">{v}</span>
                    {value === v && <Check className="h-4 w-4" />}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

const FolderDropzone = ({
  label,
  hint,
  tone,
  value,
  onChange,
}: {
  label: string;
  hint: string;
  tone: "base" | "target";
  value: FolderDrop | null;
  onChange: (v: FolderDrop | null) => void;
}) => {
  const [dragOver, setDragOver] = useState(false);
  const inputId = `gitless-${tone}-${label.replace(/\s+/g, "-")}`;

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const arr = Array.from(files);
    const first = arr[0] as File & { webkitRelativePath?: string };
    let name = first.webkitRelativePath?.split("/")[0] ?? first.name;
    if (arr.length === 1 && /\.(zip|tar|gz|tgz)$/i.test(first.name)) {
      name = first.name;
    }
    const totalBytes = arr.reduce((acc, f) => acc + f.size, 0);
    onChange({
      name,
      fileCount: arr.length,
      sizeMB: +(totalBytes / (1024 * 1024)).toFixed(2),
    });
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-xs font-medium">{label}</Label>
        <span className="text-[10px] text-muted-foreground">{hint}</span>
      </div>

      {value ? (
        <div
          className={cn(
            "rounded-xl border p-4 transition-base animate-fade-in",
            tone === "base"
              ? "border-running/40 bg-running/8"
              : "border-success/40 bg-success/8",
          )}
        >
          <div className="flex items-start gap-3">
            <div
              className={cn(
                "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
                tone === "base" ? "bg-running/15 text-running" : "bg-success/15 text-success",
              )}
            >
              <FolderOpen className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold truncate" title={value.name}>
                {value.name}
              </div>
              <div className="mt-0.5 text-[11px] text-muted-foreground">
                {value.fileCount.toLocaleString()} file{value.fileCount === 1 ? "" : "s"} · {value.sizeMB} MB
              </div>
            </div>
            <button
              type="button"
              onClick={() => onChange(null)}
              className="rounded-md p-1 text-muted-foreground hover:bg-secondary hover:text-foreground transition-base"
              aria-label="Remove folder"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      ) : (
        <label
          htmlFor={inputId}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            handleFiles(e.dataTransfer.files);
          }}
          className={cn(
            "flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-6 text-center cursor-pointer transition-base min-h-[140px]",
            dragOver
              ? "border-primary bg-primary/5 scale-[1.01]"
              : "border-border/70 bg-secondary/30 hover:border-primary/40 hover:bg-secondary/50",
          )}
        >
          <div
            className={cn(
              "flex h-11 w-11 items-center justify-center rounded-lg transition-base",
              tone === "base" ? "bg-running/10 text-running" : "bg-success/10 text-success",
              dragOver && "scale-110",
            )}
          >
            <Upload className="h-5 w-5" />
          </div>
          <div className="text-sm font-medium">Drop {tone} folder or .zip</div>
          <div className="text-[11px] text-muted-foreground">or click to browse</div>
          <input
            id={inputId}
            type="file"
            className="hidden"
            multiple
            // @ts-expect-error - non-standard but supported by Chromium/Firefox
            webkitdirectory=""
            directory=""
            onChange={(e) => handleFiles(e.target.files)}
          />
        </label>
      )}
    </div>
  );
};
