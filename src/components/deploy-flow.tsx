import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  CircleDot,
  Database,
  Download,
  FileDiff,
  FileMinus,
  FilePlus,
  FilePenLine,
  HardDrive,
  Loader2,
  Lock,
  PlayCircle,
  RefreshCw,
  Rocket,
  Search,
  Server as ServerIcon,
  ShieldAlert,
  Terminal,
  X,
  XCircle,
} from "lucide-react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { EnvBadge } from "@/components/badges";
import { cn } from "@/lib/utils";
import {
  servers as allServers,
  repositories,
  mockChangeset,
  type PackageItem,
  type Server,
  type Environment,
} from "@/lib/mock-data";

interface DeployFlowProps {
  pkg: PackageItem | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

type StepKey = "target" | "review" | "preflight" | "confirm" | "progress" | "result";

const STEPS: { key: StepKey; label: string }[] = [
  { key: "target", label: "Target Server" },
  { key: "review", label: "Review" },
  { key: "preflight", label: "Preflight" },
  { key: "confirm", label: "Confirm" },
  { key: "progress", label: "Progress" },
  { key: "result", label: "Result" },
];

const RISKY = [
  "vendor/",
  ".env",
  "storage/",
  "public/storage/",
  "bootstrap/cache/",
  "database/migrations/",
  "composer.lock",
];

const isRisky = (p: string) => RISKY.some((r) => p.includes(r));

export const DeployFlow = ({ pkg, open, onOpenChange }: DeployFlowProps) => {
  const [step, setStep] = useState<StepKey>("target");
  const [selectedServerId, setSelectedServerId] = useState<string | null>(null);
  const [confirmText, setConfirmText] = useState("");
  const [qaAck, setQaAck] = useState(false);
  const [options, setOptions] = useState({
    backup: true,
    maintenance: true,
    composer: true,
    migrate: true,
    cache: true,
    health: true,
  });

  // Reset every time we open with a new package
  useEffect(() => {
    if (open && pkg) {
      setStep("target");
      setConfirmText("");
      setQaAck(false);
      const preferred = allServers.find((s) => s.environment === pkg.environment);
      setSelectedServerId(preferred?.id ?? allServers[0]?.id ?? null);
    }
  }, [open, pkg?.id]);

  if (!pkg) return null;

  const repo = repositories.find((r) => r.id === pkg.repositoryId);
  const cs =
    mockChangeset(pkg.baseVersion, pkg.targetVersion) ?? {
      added: [],
      modified: [],
      deleted: [],
      estimatedSizeMB: 0,
    };
  const selectedServer = allServers.find((s) => s.id === selectedServerId) ?? null;
  const envMismatch =
    selectedServer && selectedServer.environment !== pkg.environment;

  const stepIdx = STEPS.findIndex((s) => s.key === step);
  const goNext = () => setStep(STEPS[Math.min(STEPS.length - 1, stepIdx + 1)].key);
  const goBack = () => setStep(STEPS[Math.max(0, stepIdx - 1)].key);

  // Confirm gating
  let canConfirm = true;
  if (pkg.environment === "QA") canConfirm = qaAck;
  if (pkg.environment === "PROD")
    canConfirm =
      confirmText.trim().length > 0 &&
      (confirmText.trim() === pkg.name ||
        confirmText.trim() === selectedServer?.name);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-none sm:w-[min(1200px,96vw)] p-0 flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="border-b border-border/60 px-6 py-4 bg-background/95 backdrop-blur">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                <Rocket className="h-3.5 w-3.5" />
                <span>Deploy package</span>
                <ChevronRight className="h-3 w-3" />
                <span>{repo?.name ?? "—"}</span>
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                <h2 className="text-base font-semibold font-mono truncate">
                  {pkg.name}
                </h2>
                <EnvBadge env={pkg.environment} />
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              className="shrink-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Package summary strip */}
          <div className="mt-4 grid grid-cols-2 md:grid-cols-5 gap-3 text-xs">
            <SummaryCell label="Base" value={pkg.baseVersion} mono />
            <SummaryCell label="Target" value={pkg.targetVersion} mono />
            <SummaryCell
              label="Added"
              value={`+${cs.added.length}`}
              tone="success"
            />
            <SummaryCell
              label="Modified"
              value={`~${cs.modified.length}`}
              tone="warn"
            />
            <SummaryCell
              label="Deleted"
              value={`-${cs.deleted.length}`}
              tone="danger"
            />
          </div>

          {/* Stepper */}
          <div className="mt-5 flex items-center gap-1 overflow-x-auto pb-1">
            {STEPS.map((s, i) => {
              const active = i === stepIdx;
              const done = i < stepIdx;
              return (
                <div key={s.key} className="flex items-center gap-1 shrink-0">
                  <div
                    className={cn(
                      "flex items-center gap-2 px-2.5 py-1 rounded-md border text-[11px] font-medium transition-colors",
                      active &&
                        "brand-soft-bg border-primary/40 text-primary",
                      done &&
                        !active &&
                        "bg-success/10 border-success/30 text-success",
                      !active &&
                        !done &&
                        "border-border/60 text-muted-foreground",
                    )}
                  >
                    <span
                      className={cn(
                        "h-4 w-4 rounded-full flex items-center justify-center text-[9px] font-bold",
                        active && "bg-primary text-[hsl(var(--on-brand))]",
                        done &&
                          !active &&
                          "bg-success text-[hsl(var(--background))]",
                        !active &&
                          !done &&
                          "bg-secondary text-muted-foreground",
                      )}
                    >
                      {done ? "✓" : i + 1}
                    </span>
                    {s.label}
                  </div>
                  {i < STEPS.length - 1 && (
                    <ChevronRight className="h-3 w-3 text-border" />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 animate-fade-in">
          {step === "target" && (
            <StepTarget
              pkg={pkg}
              selectedId={selectedServerId}
              onSelect={setSelectedServerId}
              envMismatch={!!envMismatch}
            />
          )}
          {step === "review" && <StepReview pkg={pkg} cs={cs} />}
          {step === "preflight" && <StepPreflight server={selectedServer} />}
          {step === "confirm" && (
            <StepConfirm
              pkg={pkg}
              server={selectedServer}
              options={options}
              setOptions={setOptions}
              qaAck={qaAck}
              setQaAck={setQaAck}
              confirmText={confirmText}
              setConfirmText={setConfirmText}
              canConfirm={canConfirm}
            />
          )}
          {step === "progress" && (
            <StepProgress
              pkg={pkg}
              server={selectedServer}
              onDone={() => setStep("result")}
            />
          )}
          {step === "result" && (
            <StepResult
              pkg={pkg}
              server={selectedServer}
              onAnother={() => onOpenChange(false)}
            />
          )}
        </div>

        {/* Footer */}
        {step !== "progress" && step !== "result" && (
          <div className="border-t border-border/60 px-6 py-3 flex items-center justify-between bg-background/95 backdrop-blur">
            <Button
              variant="ghost"
              size="sm"
              onClick={goBack}
              disabled={stepIdx === 0}
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Back
            </Button>
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-muted-foreground">
                Step {stepIdx + 1} of {STEPS.length}
              </span>
              {step === "confirm" ? (
                <Button
                  variant="brand"
                  size="sm"
                  disabled={!canConfirm}
                  onClick={goNext}
                >
                  <Rocket className="h-3.5 w-3.5" /> Deploy
                </Button>
              ) : (
                <Button
                  variant="brand"
                  size="sm"
                  onClick={goNext}
                  disabled={step === "target" && !selectedServerId}
                >
                  Continue <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};

// ============ Sub-components ============

const SummaryCell = ({
  label,
  value,
  mono,
  tone,
}: {
  label: string;
  value: string;
  mono?: boolean;
  tone?: "success" | "warn" | "danger";
}) => (
  <div className="rounded-md border border-border/60 bg-card/60 px-3 py-2">
    <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
      {label}
    </div>
    <div
      className={cn(
        "text-sm font-semibold mt-0.5",
        mono && "font-mono",
        tone === "success" && "text-success",
        tone === "warn" && "text-queued",
        tone === "danger" && "text-failed",
      )}
    >
      {value}
    </div>
  </div>
);

const StepTarget = ({
  pkg,
  selectedId,
  onSelect,
  envMismatch,
}: {
  pkg: PackageItem;
  selectedId: string | null;
  onSelect: (id: string) => void;
  envMismatch: boolean;
}) => {
  const sorted = useMemo(() => {
    return [...allServers].sort((a, b) => {
      const aMatch = a.environment === pkg.environment ? 0 : 1;
      const bMatch = b.environment === pkg.environment ? 0 : 1;
      return aMatch - bMatch;
    });
  }, [pkg.environment]);

  return (
    <div className="space-y-4">
      <SectionHeader
        icon={<ServerIcon className="h-4 w-4" />}
        title="Choose target server"
        desc={`Servers matching ${pkg.environment} are listed first and preselected.`}
      />
      {envMismatch && (
        <WarningBanner
          title="Environment mismatch"
          message={`You selected a server outside the package environment (${pkg.environment}). Proceed with care.`}
        />
      )}
      <div className="grid gap-2.5">
        {sorted.map((s) => (
          <ServerRow
            key={s.id}
            server={s}
            selected={selectedId === s.id}
            match={s.environment === pkg.environment}
            onClick={() => onSelect(s.id)}
          />
        ))}
      </div>
    </div>
  );
};

const ServerRow = ({
  server,
  selected,
  match,
  onClick,
}: {
  server: Server;
  selected: boolean;
  match: boolean;
  onClick: () => void;
}) => (
  <button
    type="button"
    onClick={onClick}
    className={cn(
      "w-full text-left rounded-lg border p-3.5 transition-all hover:shadow-soft",
      selected
        ? "border-primary/60 brand-soft-bg ring-1 ring-primary/30"
        : "border-border/60 bg-card/40 hover:border-border",
    )}
  >
    <div className="flex items-start gap-3">
      <div
        className={cn(
          "mt-0.5 h-4 w-4 rounded-full border-2 shrink-0 flex items-center justify-center",
          selected ? "border-primary bg-primary" : "border-border",
        )}
      >
        {selected && (
          <span className="h-1.5 w-1.5 rounded-full bg-[hsl(var(--on-brand))]" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <EnvBadge env={server.environment} />
          <span className="font-semibold text-sm">{server.name}</span>
          <span
            className={cn(
              "text-[10px] px-1.5 py-0.5 rounded-md border",
              server.status === "online"
                ? "border-success/30 text-success bg-success/10"
                : "border-failed/30 text-failed bg-failed/10",
            )}
          >
            <CircleDot className="h-2.5 w-2.5 inline mr-1" />
            {server.status}
          </span>
          {match && (
            <span className="text-[10px] text-primary font-medium">
              · matches package env
            </span>
          )}
        </div>
        <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-2 text-[11px] text-muted-foreground">
          <KV label="Host" value={server.host} />
          <KV label="SSH" value={`${server.user}@${server.host}:${server.port}`} />
          <KV label="Doc root" value={server.path} mono />
          <KV label="Last snapshot" value="14m ago" />
        </div>
      </div>
    </div>
  </button>
);

const KV = ({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) => (
  <div className="min-w-0">
    <div className="text-[9px] uppercase tracking-wider text-muted-foreground/80">
      {label}
    </div>
    <div
      className={cn(
        "truncate text-foreground/90",
        mono && "font-mono text-[11px]",
      )}
    >
      {value}
    </div>
  </div>
);

const SectionHeader = ({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  desc?: string;
}) => (
  <div className="flex items-start gap-2.5">
    <div className="h-7 w-7 rounded-md brand-soft-bg text-primary flex items-center justify-center shrink-0">
      {icon}
    </div>
    <div>
      <h3 className="text-sm font-semibold">{title}</h3>
      {desc && <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>}
    </div>
  </div>
);

const WarningBanner = ({
  title,
  message,
  tone = "warn",
}: {
  title: string;
  message: string;
  tone?: "warn" | "danger";
}) => (
  <div
    className={cn(
      "rounded-md border px-3 py-2.5 flex items-start gap-2.5",
      tone === "warn"
        ? "border-queued/40 bg-queued/10 text-queued"
        : "border-failed/40 bg-failed/10 text-failed",
    )}
  >
    <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
    <div className="min-w-0">
      <div className="text-xs font-semibold">{title}</div>
      <div className="text-[11px] text-foreground/80 mt-0.5">{message}</div>
    </div>
  </div>
);

const StepReview = ({
  pkg,
  cs,
}: {
  pkg: PackageItem;
  cs: ReturnType<typeof mockChangeset> extends infer T ? NonNullable<T> : never;
}) => {
  const [query, setQuery] = useState("");
  const all = useMemo(
    () => [
      ...cs.added.map((p) => ({ p, kind: "added" as const })),
      ...cs.modified.map((p) => ({ p, kind: "modified" as const })),
      ...cs.deleted.map((p) => ({ p, kind: "deleted" as const })),
    ],
    [cs],
  );
  const filtered = all.filter((x) =>
    x.p.toLowerCase().includes(query.trim().toLowerCase()),
  );

  const composerChanged = all.some((x) => x.p.includes("composer.lock"));
  const migrationsChanged = all.some((x) =>
    x.p.includes("database/migrations/"),
  );
  const storageChanged = all.some(
    (x) => x.p.includes("storage/") || x.p.includes("public/storage/"),
  );

  // synthetic risky paths for demo realism
  const synthetic = [
    "vendor/laravel/framework/src/Foundation/Application.php",
    "database/migrations/2025_06_10_120000_add_audit_table.php",
    "composer.lock",
  ];
  const enriched = [
    ...synthetic.map((p) => ({ p, kind: "modified" as const })),
    ...filtered,
  ];

  const groups: Record<"added" | "modified" | "deleted", typeof enriched> = {
    added: enriched.filter((x) => x.kind === "added"),
    modified: enriched.filter((x) => x.kind === "modified"),
    deleted: enriched.filter((x) => x.kind === "deleted"),
  };

  return (
    <div className="space-y-5">
      <SectionHeader
        icon={<FileDiff className="h-4 w-4" />}
        title="Review changes"
        desc="Inspect everything that will be applied to the target server."
      />

      <div className="grid grid-cols-3 gap-3">
        <StatCard
          tone="success"
          icon={<FilePlus className="h-4 w-4" />}
          label="Added"
          value={cs.added.length}
        />
        <StatCard
          tone="warn"
          icon={<FilePenLine className="h-4 w-4" />}
          label="Modified"
          value={cs.modified.length + synthetic.length}
        />
        <StatCard
          tone="danger"
          icon={<FileMinus className="h-4 w-4" />}
          label="Deleted"
          value={cs.deleted.length}
        />
      </div>

      <div className="grid gap-2">
        {composerChanged && (
          <WarningBanner
            title="Composer install required"
            message="composer.lock changed and vendor/ is in .ignore. Run composer install on the server after upload."
          />
        )}
        {migrationsChanged && (
          <WarningBanner
            title="Migrations detected"
            message="Files in database/migrations/ changed. php artisan migrate --force will be required."
          />
        )}
        {storageChanged && (
          <WarningBanner
            title="Storage files in package"
            tone="danger"
            message="Files in storage/ should usually NOT be deployed. Review carefully."
          />
        )}
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search changed paths…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-8 h-9"
          />
        </div>
        <Button variant="soft" size="sm">
          <Download className="h-3.5 w-3.5" /> update.zip
        </Button>
        <Button variant="soft" size="sm" disabled={!pkg.hasRollback}>
          <Download className="h-3.5 w-3.5" /> rollback.zip
        </Button>
        <Button variant="soft" size="sm">
          <Download className="h-3.5 w-3.5" /> version_changes.txt
        </Button>
      </div>

      <div className="space-y-4">
        {(["added", "modified", "deleted"] as const).map((k) => (
          <FileGroup key={k} kind={k} items={groups[k].map((x) => x.p)} />
        ))}
      </div>
    </div>
  );
};

const StatCard = ({
  tone,
  icon,
  label,
  value,
}: {
  tone: "success" | "warn" | "danger";
  icon: React.ReactNode;
  label: string;
  value: number;
}) => (
  <div
    className={cn(
      "rounded-lg border p-3 flex items-center gap-3",
      tone === "success" && "border-success/30 bg-success/10",
      tone === "warn" && "border-queued/30 bg-queued/10",
      tone === "danger" && "border-failed/30 bg-failed/10",
    )}
  >
    <div
      className={cn(
        "h-8 w-8 rounded-md flex items-center justify-center",
        tone === "success" && "bg-success/20 text-success",
        tone === "warn" && "bg-queued/20 text-queued",
        tone === "danger" && "bg-failed/20 text-failed",
      )}
    >
      {icon}
    </div>
    <div>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className="text-xl font-bold tabular-nums">{value}</div>
    </div>
  </div>
);

const FileGroup = ({
  kind,
  items,
}: {
  kind: "added" | "modified" | "deleted";
  items: string[];
}) => {
  const meta = {
    added: { icon: FilePlus, tone: "text-success", label: "Added" },
    modified: { icon: FilePenLine, tone: "text-queued", label: "Modified" },
    deleted: { icon: FileMinus, tone: "text-failed", label: "Deleted" },
  }[kind];
  const Icon = meta.icon;

  if (items.length === 0) return null;
  return (
    <div className="rounded-lg border border-border/60 bg-card/40 overflow-hidden">
      <div className="px-3 py-2 border-b border-border/60 flex items-center gap-2 text-xs font-semibold">
        <Icon className={cn("h-3.5 w-3.5", meta.tone)} />
        <span>{meta.label}</span>
        <span className="text-muted-foreground font-normal">({items.length})</span>
      </div>
      <ul className="divide-y divide-border/40 max-h-56 overflow-y-auto">
        {items.map((p, i) => {
          const risky = isRisky(p);
          return (
            <li
              key={`${kind}-${i}-${p}`}
              className={cn(
                "px-3 py-1.5 font-mono text-[11px] flex items-center justify-between gap-2",
                risky && "bg-failed/5",
              )}
            >
              <span className="truncate">{p}</span>
              {risky && (
                <span className="text-[10px] text-failed font-sans font-semibold flex items-center gap-1 shrink-0">
                  <ShieldAlert className="h-3 w-3" /> risky
                </span>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
};

const StepPreflight = ({ server }: { server: Server | null }) => {
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<Record<string, "pending" | "ok" | "warn" | "fail">>({});
  const [log, setLog] = useState<string[]>([
    `$ preflight ready — target ${server?.name ?? "—"}`,
  ]);

  const checks: { key: string; label: string; icon: React.ReactNode }[] = [
    { key: "ssh", label: "SSH reachable", icon: <Terminal className="h-3.5 w-3.5" /> },
    { key: "writable", label: "Document root writable", icon: <Lock className="h-3.5 w-3.5" /> },
    { key: "disk", label: "Sufficient disk space (>1GB free)", icon: <HardDrive className="h-3.5 w-3.5" /> },
    { key: "rollback", label: "Rollback package available", icon: <RefreshCw className="h-3.5 w-3.5" /> },
    { key: "backup", label: "Backup can be created", icon: <Database className="h-3.5 w-3.5" /> },
    { key: "health", label: "Health check URL configured", icon: <CheckCircle2 className="h-3.5 w-3.5" /> },
  ];

  const run = () => {
    setRunning(true);
    setResults({});
    setLog([`$ running preflight on ${server?.name}…`]);
    checks.forEach((c, i) => {
      setTimeout(() => {
        setResults((prev) => ({
          ...prev,
          [c.key]: c.key === "health" ? "warn" : "ok",
        }));
        setLog((prev) => [
          ...prev,
          `[${new Date().toLocaleTimeString()}] ✓ ${c.label}`,
        ]);
        if (i === checks.length - 1) setRunning(false);
      }, 350 * (i + 1));
    });
  };

  return (
    <div className="space-y-4">
      <SectionHeader
        icon={<PlayCircle className="h-4 w-4" />}
        title="Preflight checks"
        desc="Verify the target is ready before deploying."
      />

      <div className="flex items-center gap-2">
        <Button variant="brand" size="sm" onClick={run} disabled={running}>
          {running ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <PlayCircle className="h-3.5 w-3.5" />
          )}
          Run preflight
        </Button>
        <span className="text-[11px] text-muted-foreground">
          target: <span className="font-mono">{server?.name}</span>
        </span>
      </div>

      <div className="rounded-lg border border-border/60 overflow-hidden">
        {checks.map((c) => {
          const r = results[c.key] ?? "pending";
          return (
            <div
              key={c.key}
              className="flex items-center justify-between px-3 py-2.5 border-b border-border/40 last:border-b-0"
            >
              <div className="flex items-center gap-2.5 text-xs">
                <span className="text-muted-foreground">{c.icon}</span>
                <span>{c.label}</span>
              </div>
              <CheckStatus status={r} />
            </div>
          );
        })}
      </div>

      <LogPanel lines={log} />
    </div>
  );
};

const CheckStatus = ({
  status,
}: {
  status: "pending" | "ok" | "warn" | "fail";
}) => {
  const map = {
    pending: { icon: <CircleDot className="h-3.5 w-3.5" />, label: "pending", tone: "text-muted-foreground" },
    ok: { icon: <CheckCircle2 className="h-3.5 w-3.5" />, label: "passed", tone: "text-success" },
    warn: { icon: <AlertTriangle className="h-3.5 w-3.5" />, label: "warning", tone: "text-queued" },
    fail: { icon: <XCircle className="h-3.5 w-3.5" />, label: "failed", tone: "text-failed" },
  }[status];
  return (
    <span className={cn("flex items-center gap-1.5 text-[11px] font-medium", map.tone)}>
      {map.icon}
      {map.label}
    </span>
  );
};

const LogPanel = ({ lines }: { lines: string[] }) => {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.scrollTop = ref.current.scrollHeight;
  }, [lines]);
  return (
    <div className="rounded-lg border border-border/60 bg-[hsl(var(--background))] overflow-hidden">
      <div className="px-3 py-1.5 border-b border-border/60 flex items-center gap-2 text-[11px] font-medium text-muted-foreground">
        <Terminal className="h-3 w-3" /> Output log
      </div>
      <div
        ref={ref}
        className="p-3 font-mono text-[11px] max-h-56 overflow-y-auto space-y-0.5"
      >
        {lines.map((l, i) => (
          <div
            key={i}
            className={cn(
              "whitespace-pre-wrap",
              l.startsWith("$") && "text-primary",
              l.includes("✓") && "text-success",
              l.includes("✗") && "text-failed",
              !l.startsWith("$") &&
                !l.includes("✓") &&
                !l.includes("✗") &&
                "text-foreground/80",
            )}
          >
            {l}
          </div>
        ))}
      </div>
    </div>
  );
};

const StepConfirm = ({
  pkg,
  server,
  options,
  setOptions,
  qaAck,
  setQaAck,
  confirmText,
  setConfirmText,
  canConfirm,
}: {
  pkg: PackageItem;
  server: Server | null;
  options: Record<string, boolean>;
  setOptions: React.Dispatch<React.SetStateAction<any>>;
  qaAck: boolean;
  setQaAck: (v: boolean) => void;
  confirmText: string;
  setConfirmText: (v: string) => void;
  canConfirm: boolean;
}) => {
  const opts: { key: keyof typeof options; label: string; desc: string }[] = [
    { key: "backup", label: "Create backup before deploy", desc: "Snapshot current document root." },
    { key: "maintenance", label: "Enable maintenance mode", desc: "php artisan down during deploy." },
    { key: "composer", label: "Run composer install (if required)", desc: "Triggered when composer.lock changes." },
    { key: "migrate", label: "Run php artisan migrate --force", desc: "Apply pending migrations." },
    { key: "cache", label: "Cache clear / optimize", desc: "config:cache, route:cache, view:cache." },
    { key: "health", label: "Run health check after deploy", desc: "Verify configured health endpoint." },
  ];

  return (
    <div className="space-y-5">
      <SectionHeader
        icon={<ShieldAlert className="h-4 w-4" />}
        title="Confirm deployment"
        desc={`Final review — ${pkg.environment} deployment to ${server?.name ?? "—"}.`}
      />

      <div className="rounded-lg border border-border/60 bg-card/40 p-3 grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
        <KV label="Package" value={pkg.name} mono />
        <KV label="Target" value={server?.name ?? "—"} />
        <KV label="Environment" value={pkg.environment} />
        <KV label="Host" value={server?.host ?? "—"} />
        <KV label="Doc root" value={server?.path ?? "—"} mono />
        <KV label="Rollback" value={pkg.hasRollback ? "available" : "not available"} />
      </div>

      <div className="grid gap-2">
        {opts.map((o) => (
          <label
            key={o.key}
            className="flex items-start gap-3 rounded-md border border-border/60 bg-card/40 p-3 cursor-pointer hover:border-border"
          >
            <Checkbox
              checked={options[o.key]}
              onCheckedChange={(v) =>
                setOptions((prev: any) => ({ ...prev, [o.key]: !!v }))
              }
              className="mt-0.5"
            />
            <div className="min-w-0">
              <div className="text-xs font-medium">{o.label}</div>
              <div className="text-[11px] text-muted-foreground">{o.desc}</div>
            </div>
          </label>
        ))}
      </div>

      {pkg.environment === "QA" && (
        <label className="flex items-center gap-2 rounded-md border border-queued/40 bg-queued/10 p-3 cursor-pointer">
          <Checkbox
            checked={qaAck}
            onCheckedChange={(v) => setQaAck(!!v)}
          />
          <span className="text-xs">
            I have reviewed the QA changeset and confirm this deployment.
          </span>
        </label>
      )}

      {pkg.environment === "PROD" && (
        <div className="rounded-md border border-failed/40 bg-failed/10 p-3 space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-failed">
            <ShieldAlert className="h-4 w-4" /> Production confirmation
          </div>
          <p className="text-[11px] text-foreground/80">
            Type the <span className="font-mono">server name</span> (
            <span className="font-mono">{server?.name}</span>) or the
            <span className="font-mono"> package name</span> to enable deploy.
          </p>
          <Input
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder={server?.name ?? ""}
            className="h-9 font-mono text-xs"
          />
          {confirmText && !canConfirm && (
            <p className="text-[11px] text-failed">
              Text does not match expected value.
            </p>
          )}
        </div>
      )}
    </div>
  );
};

const DEPLOY_STEPS = [
  "Connecting to server",
  "Creating backup",
  "Uploading package",
  "Extracting package",
  "Applying files",
  "Running post-deploy commands",
  "Running health check",
  "Completed",
] as const;

const StepProgress = ({
  pkg,
  server,
  onDone,
}: {
  pkg: PackageItem;
  server: Server | null;
  onDone: () => void;
}) => {
  const [idx, setIdx] = useState(0);
  const [progress, setProgress] = useState(0);
  const [log, setLog] = useState<string[]>([
    `$ deploy ${pkg.name} → ${server?.name}`,
  ]);

  useEffect(() => {
    let p = 0;
    let i = 0;
    const tick = setInterval(() => {
      p += 3 + Math.random() * 5;
      setProgress(Math.min(100, p));
      const nextIdx = Math.min(
        DEPLOY_STEPS.length - 1,
        Math.floor((p / 100) * (DEPLOY_STEPS.length - 1)),
      );
      if (nextIdx !== i) {
        i = nextIdx;
        setIdx(i);
        setLog((prev) => [
          ...prev,
          `[${new Date().toLocaleTimeString()}] ✓ ${DEPLOY_STEPS[i - 1] ?? DEPLOY_STEPS[0]}`,
          `[${new Date().toLocaleTimeString()}] › ${DEPLOY_STEPS[i]}…`,
        ]);
      }
      if (p >= 100) {
        clearInterval(tick);
        setIdx(DEPLOY_STEPS.length - 1);
        setLog((prev) => [
          ...prev,
          `[${new Date().toLocaleTimeString()}] ✓ Completed in 1m 27s`,
        ]);
        setTimeout(onDone, 800);
      }
    }, 350);
    return () => clearInterval(tick);
  }, []);

  return (
    <div className="space-y-4">
      <SectionHeader
        icon={<Rocket className="h-4 w-4" />}
        title="Deployment in progress"
        desc="Destructive actions are disabled while the deployment runs."
      />

      <div className="rounded-lg border border-border/60 bg-card/40 p-3">
        <div className="flex items-center justify-between text-xs mb-2">
          <span className="font-medium">{DEPLOY_STEPS[idx]}</span>
          <span className="tabular-nums text-muted-foreground">
            {Math.floor(progress)}%
          </span>
        </div>
        <Progress value={progress} className="h-1.5" />
      </div>

      <div className="rounded-lg border border-border/60 overflow-hidden">
        {DEPLOY_STEPS.map((s, i) => {
          const state =
            i < idx ? "done" : i === idx ? "running" : "pending";
          return (
            <div
              key={s}
              className="flex items-center justify-between px-3 py-2.5 border-b border-border/40 last:border-b-0"
            >
              <div className="flex items-center gap-2.5 text-xs">
                <StepDot state={state} />
                <span
                  className={cn(
                    state === "done" && "text-foreground/80",
                    state === "pending" && "text-muted-foreground",
                    state === "running" && "font-medium",
                  )}
                >
                  {s}
                </span>
              </div>
              <span className="text-[10px] text-muted-foreground tabular-nums">
                {state === "done" && "done"}
                {state === "running" && "running…"}
                {state === "pending" && "pending"}
              </span>
            </div>
          );
        })}
      </div>

      <LogPanel lines={log} />

      <div className="flex justify-end">
        <Button variant="outline" size="sm" disabled>
          Cancel deploy (disabled while running)
        </Button>
      </div>
    </div>
  );
};

const StepDot = ({
  state,
}: {
  state: "pending" | "running" | "done" | "failed";
}) => {
  if (state === "done")
    return <CheckCircle2 className="h-3.5 w-3.5 text-success" />;
  if (state === "running")
    return <Loader2 className="h-3.5 w-3.5 text-primary animate-spin" />;
  if (state === "failed")
    return <XCircle className="h-3.5 w-3.5 text-failed" />;
  return <CircleDot className="h-3.5 w-3.5 text-muted-foreground/50" />;
};

const StepResult = ({
  pkg,
  server,
  onAnother,
}: {
  pkg: PackageItem;
  server: Server | null;
  onAnother: () => void;
}) => {
  // For demo always show success
  const success = true;
  return (
    <div className="space-y-5">
      <div
        className={cn(
          "rounded-lg border p-5 flex items-start gap-4",
          success
            ? "border-success/40 bg-success/10"
            : "border-failed/40 bg-failed/10",
        )}
      >
        <div
          className={cn(
            "h-10 w-10 rounded-full flex items-center justify-center shrink-0",
            success ? "bg-success/20 text-success" : "bg-failed/20 text-failed",
          )}
        >
          {success ? (
            <CheckCircle2 className="h-6 w-6" />
          ) : (
            <XCircle className="h-6 w-6" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-semibold">
            {success ? "Deployment successful" : "Deployment failed"}
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {success
              ? `Completed in 1m 27s · ${new Date().toLocaleString()}`
              : "Aborted during Applying files. Rollback is available."}
          </p>
          <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
            <KV label="Package" value={pkg.name} mono />
            <KV label="Server" value={server?.name ?? "—"} />
            <KV
              label="App URL"
              value={`https://${server?.name ?? "app"}.internal`}
            />
          </div>
        </div>
      </div>

      {success ? (
        <div className="flex flex-wrap gap-2">
          <Button variant="soft" size="sm">
            <Terminal className="h-3.5 w-3.5" /> View logs
          </Button>
          <Button
            variant="soft"
            size="sm"
            disabled={!pkg.hasRollback}
          >
            <Download className="h-3.5 w-3.5" /> Download rollback
          </Button>
          <Button variant="brand" size="sm" onClick={onAnother}>
            <Rocket className="h-3.5 w-3.5" /> Deploy another package
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="rounded-md border border-failed/30 bg-failed/5 p-3">
            <div className="text-xs font-semibold text-failed mb-1">
              Failed step: Applying files
            </div>
            <pre className="font-mono text-[11px] text-foreground/80 whitespace-pre-wrap">
{`tar: storage/app/.gitignore: Cannot open: Permission denied
exit code 1`}
            </pre>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="brand" size="sm">
              <RefreshCw className="h-3.5 w-3.5" /> Retry
            </Button>
            <Button variant="outline" size="sm">
              <RefreshCw className="h-3.5 w-3.5" /> Rollback
            </Button>
            <Button variant="soft" size="sm">
              <Terminal className="h-3.5 w-3.5" /> View logs
            </Button>
            <Button variant="ghost" size="sm">
              Mark as manually resolved
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
