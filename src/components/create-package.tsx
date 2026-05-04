import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Download,
  FileDiff,
  FileMinus,
  FilePlus2,
  FilePenLine,
  Github,
  GitlabIcon as Gitlab,
  HardDrive,
  Loader2,
  Package as PackageIcon,
  Rocket,
  Server as ServerIcon,
  ShieldAlert,
  Sparkles,
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
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { EnvBadge } from "@/components/badges";
import { cn } from "@/lib/utils";
import {
  mockChangeset,
  projects,
  repositories,
  type Environment,
  type RepoProvider,
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

interface ProgressStage {
  key: string;
  label: string;
}
const STAGES: ProgressStage[] = [
  { key: "queued", label: "Queued" },
  { key: "downloading", label: "Downloading" },
  { key: "extracting", label: "Extracting" },
  { key: "comparing", label: "Comparing" },
  { key: "generating", label: "Generating packages" },
  { key: "compressing", label: "Compressing" },
];

type Phase = "form" | "progress" | "done";

export const CreatePackage = () => {
  const { toast } = useToast();

  const [projectId, setProjectId] = useState<string>(projects[0].id);
  const repos = useMemo(() => repositories.filter((r) => r.projectId === projectId), [projectId]);
  const [repoId, setRepoId] = useState<string>(repos[0]?.id ?? "");
  const repo = repos.find((r) => r.id === repoId);

  const versionOptions = useMemo(() => {
    if (!repo) return [] as string[];
    return [...repo.tags, ...repo.branches];
  }, [repo]);

  const [baseVersion, setBaseVersion] = useState<string>(repo?.tags[1] ?? "");
  const [targetVersion, setTargetVersion] = useState<string>(repo?.tags[0] ?? "");

  // Reset versions when repo changes
  useEffect(() => {
    setRepoId(repos[0]?.id ?? "");
  }, [projectId]);
  useEffect(() => {
    if (repo) {
      setBaseVersion(repo.tags[1] ?? repo.branches[0] ?? "");
      setTargetVersion(repo.tags[0] ?? repo.branches[0] ?? "");
    }
  }, [repoId]);

  const [environment, setEnvironment] = useState<Environment>("DEV");
  const [customName, setCustomName] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [outputFormat, setOutputFormat] = useState<"ZIP" | "TAR.GZ" | "BOTH">("ZIP");
  const [generateRollback, setGenerateRollback] = useState(true);
  const [confirmedProd, setConfirmedProd] = useState(false);

  const identical = baseVersion && targetVersion && baseVersion === targetVersion;
  const changeset = useMemo(
    () => (identical ? null : mockChangeset(baseVersion, targetVersion)),
    [baseVersion, targetVersion, identical],
  );

  const autoName = useMemo(() => {
    if (!repo || !baseVersion || !targetVersion) return "";
    const sanitize = (s: string) => s.replace(/[^a-zA-Z0-9.-]/g, "-");
    const ts = new Date().toISOString().slice(0, 16).replace(/[-:T]/g, "").slice(0, 12);
    const projShort = repo.name.split("/").pop() ?? "project";
    return `${environment}-${projShort}-${sanitize(baseVersion)}-to-${sanitize(targetVersion)}-${ts}`;
  }, [repo, baseVersion, targetVersion, environment]);

  const finalName = customName.trim() || autoName;

  // Progress simulation
  const [phase, setPhase] = useState<Phase>("form");
  const [stageIdx, setStageIdx] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (phase !== "progress") return;
    const id = setInterval(() => {
      setProgress((p) => {
        const next = p + 2 + Math.random() * 4;
        if (next >= 100) {
          clearInterval(id);
          setStageIdx(STAGES.length - 1);
          setTimeout(() => setPhase("done"), 400);
          return 100;
        }
        const idx = Math.min(STAGES.length - 1, Math.floor((next / 100) * STAGES.length));
        setStageIdx(idx);
        return next;
      });
    }, 220);
    return () => clearInterval(id);
  }, [phase]);

  const canSubmit =
    !!repo && !!baseVersion && !!targetVersion && !identical && (environment !== "PROD" || confirmedProd);

  const handleGenerate = () => {
    if (!canSubmit) return;
    setPhase("progress");
    setStageIdx(0);
    setProgress(0);
  };

  const handleCancel = () => {
    setPhase("form");
    setProgress(0);
    setStageIdx(0);
    toast({ title: "Cancelled", description: "Package generation was cancelled." });
  };

  const reset = () => {
    setPhase("form");
    setProgress(0);
    setStageIdx(0);
    setConfirmedProd(false);
  };

  // ============= PROGRESS PHASE =============
  if (phase === "progress") {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="section-card p-8 shadow-soft">
          <div className="flex items-start justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                <span className="text-sm font-semibold text-primary">Generating package</span>
              </div>
              <h2 className="text-xl font-semibold tracking-tight">{finalName}</h2>
              <p className="text-sm text-muted-foreground mt-1">
                {repo?.name} · <EnvBadge env={environment} className="ml-1" />
              </p>
            </div>
            <Button variant="ghost" size="sm" onClick={handleCancel}>
              <X className="h-4 w-4" /> Cancel
            </Button>
          </div>

          <div className="mb-6">
            <div className="flex items-center justify-between mb-2 text-sm">
              <span className="font-medium">{STAGES[stageIdx].label}…</span>
              <span className="tabular-nums text-muted-foreground">{Math.floor(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          <ol className="space-y-2.5">
            {STAGES.map((s, i) => {
              const done = i < stageIdx;
              const active = i === stageIdx;
              return (
                <li key={s.key} className="flex items-center gap-3 text-sm">
                  <span
                    className={cn(
                      "flex h-6 w-6 items-center justify-center rounded-full border text-[11px] font-semibold transition-base",
                      done && "bg-success text-success-foreground border-success",
                      active && "brand-gradient-bg text-[hsl(var(--on-brand))] border-transparent shadow-glow",
                      !done && !active && "border-border text-muted-foreground",
                    )}
                  >
                    {done ? <CheckCircle2 className="h-3.5 w-3.5" /> : i + 1}
                  </span>
                  <span
                    className={cn(
                      "transition-base",
                      active && "font-medium",
                      !done && !active && "text-muted-foreground",
                    )}
                  >
                    {s.label}
                  </span>
                  {active && <Loader2 className="h-3.5 w-3.5 animate-spin text-primary ml-1" />}
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    );
  }

  // ============= DONE PHASE =============
  if (phase === "done") {
    return (
      <div className="max-w-3xl mx-auto animate-fade-in">
        <div className="section-card p-8 text-center shadow-soft">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl brand-gradient-bg shadow-glow">
            <CheckCircle2 className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-2xl font-semibold tracking-tight">Package ready</h2>
          <p className="text-sm text-muted-foreground mt-2 break-all">{finalName}</p>

          <div className="grid grid-cols-3 gap-3 mt-6">
            <div className="rounded-xl bg-secondary/50 p-4">
              <div className="text-2xl font-semibold">{changeset?.estimatedSizeMB ?? "—"}<span className="text-sm font-normal text-muted-foreground"> MB</span></div>
              <div className="text-xs text-muted-foreground mt-1">Package size</div>
            </div>
            <div className="rounded-xl bg-secondary/50 p-4">
              <div className="text-2xl font-semibold">
                {(changeset?.added.length ?? 0) + (changeset?.modified.length ?? 0) + (changeset?.deleted.length ?? 0)}
              </div>
              <div className="text-xs text-muted-foreground mt-1">Files changed</div>
            </div>
            <div className="rounded-xl bg-secondary/50 p-4">
              <div className="text-2xl font-semibold">{generateRollback ? "Yes" : "No"}</div>
              <div className="text-xs text-muted-foreground mt-1">Rollback</div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 mt-7 justify-center">
            <Button variant="brand" size="lg">
              <Rocket className="h-4 w-4" /> Deploy Package
            </Button>
            <Button variant="outline" size="lg">
              <Download className="h-4 w-4" /> Download
            </Button>
            <Button variant="ghost" size="lg" onClick={reset}>
              View Details
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ============= FORM PHASE =============
  return (
    <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_360px] gap-6">
      {/* LEFT: Sections */}
      <div className="space-y-5">
        {/* SECTION 1 — Project & Repository */}
        <SectionCard
          step={1}
          title="Project & Repository"
          subtitle="Choose where this package comes from."
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Project</Label>
              <Select value={projectId} onValueChange={setProjectId}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Repository</Label>
              <Select value={repoId} onValueChange={setRepoId}>
                <SelectTrigger><SelectValue placeholder="Select repository" /></SelectTrigger>
                <SelectContent>
                  {repos.map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      <span className="flex items-center gap-2">
                        {providerIcon(r.provider)} {r.name}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          {repo && (
            <div className="flex flex-wrap items-center gap-2 mt-4 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5 rounded-md bg-secondary/60 px-2 py-1">
                {providerIcon(repo.provider)} {providerLabel[repo.provider]}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-md bg-secondary/60 px-2 py-1">
                default · {repo.defaultBranch}
              </span>
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-md px-2 py-1 border",
                  repo.status === "connected" && "border-success/30 text-success bg-success/10",
                  repo.status === "expired" && "border-queued/30 text-queued bg-queued/10",
                  repo.status === "needs-auth" && "border-failed/30 text-failed bg-failed/10",
                )}
              >
                <span className="h-1.5 w-1.5 rounded-full bg-current" />
                {repo.status === "connected" ? "Connected" : repo.status === "expired" ? "Expired" : "Needs authentication"}
              </span>
            </div>
          )}
        </SectionCard>

        {/* SECTION 2 — Version Selection */}
        <SectionCard
          step={2}
          title="Version Selection"
          subtitle="Pick a base and target. We'll detect changes immediately."
        >
          <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-3 items-end">
            <div className="space-y-2">
              <Label>Base version</Label>
              <Select value={baseVersion} onValueChange={setBaseVersion}>
                <SelectTrigger><SelectValue placeholder="Select base" /></SelectTrigger>
                <SelectContent>
                  {versionOptions.map((v) => (
                    <SelectItem key={`base-${v}`} value={v}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-[11px] text-muted-foreground">Suggested: last deployed version</p>
            </div>

            <div className="hidden md:flex items-center justify-center pb-3">
              <div className="h-9 w-9 rounded-full brand-soft-bg flex items-center justify-center">
                <ArrowRight className="h-4 w-4 text-primary" />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Target version</Label>
              <Select value={targetVersion} onValueChange={setTargetVersion}>
                <SelectTrigger><SelectValue placeholder="Select target" /></SelectTrigger>
                <SelectContent>
                  {versionOptions.map((v) => (
                    <SelectItem key={`target-${v}`} value={v}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-[11px] text-muted-foreground">Suggested: latest tag</p>
            </div>
          </div>

          {identical && (
            <div className="mt-4 flex items-start gap-2 rounded-lg border border-failed/30 bg-failed/8 p-3 text-sm text-failed">
              <ShieldAlert className="h-4 w-4 mt-0.5 shrink-0" />
              <span>Base and target cannot be identical. Choose two different versions.</span>
            </div>
          )}

          {/* Live intelligence */}
          {changeset && (
            <div className="mt-5 animate-fade-in">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Sparkles className="h-4 w-4 text-primary" />
                  Detected changes
                </div>
                <span className="text-xs text-muted-foreground">
                  ~{changeset.estimatedSizeMB} MB · {changeset.added.length + changeset.modified.length + changeset.deleted.length} files
                </span>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <ChangeStat
                  icon={<FilePlus2 className="h-4 w-4" />}
                  label="Added"
                  value={changeset.added.length}
                  tone="success"
                />
                <ChangeStat
                  icon={<FilePenLine className="h-4 w-4" />}
                  label="Modified"
                  value={changeset.modified.length}
                  tone="running"
                />
                <ChangeStat
                  icon={<FileMinus className="h-4 w-4" />}
                  label="Deleted"
                  value={changeset.deleted.length}
                  tone="failed"
                />
              </div>
            </div>
          )}
        </SectionCard>

        {/* SECTION 3 — Environment & Package */}
        <SectionCard
          step={3}
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
              Leave empty to use the auto-generated name.
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
            <SummaryRow label="Project" value={projects.find((p) => p.id === projectId)?.name ?? "—"} />
            <SummaryRow
              label="Repository"
              value={repo?.name ?? "—"}
              icon={repo ? providerIcon(repo.provider) : undefined}
            />
            <SummaryRow label="Base" value={baseVersion || "—"} mono />
            <SummaryRow label="Target" value={targetVersion || "—"} mono />
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

          {changeset ? (
            <div className="grid grid-cols-3 gap-2 mb-4">
              <MiniStat label="Added" value={changeset.added.length} tone="success" />
              <MiniStat label="Mod." value={changeset.modified.length} tone="running" />
              <MiniStat label="Del." value={changeset.deleted.length} tone="failed" />
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
            Generate Package
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
