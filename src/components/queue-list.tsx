import { CheckCircle2, Loader2, Package as PackageIcon, Trash2, X, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { EnvBadge } from "@/components/badges";
import { cn } from "@/lib/utils";
import {
  cancelJob,
  clearCompleted,
  QUEUE_STAGES,
  removeJob,
  useQueue,
  type QueueJob,
} from "@/lib/package-queue";

const statusMeta = (s: QueueJob["status"]) => {
  switch (s) {
    case "queued":
      return { label: "Queued", tone: "text-muted-foreground" };
    case "running":
      return { label: "Running", tone: "text-primary" };
    case "success":
      return { label: "Completed", tone: "text-success" };
    case "failed":
      return { label: "Failed", tone: "text-failed" };
    case "cancelled":
      return { label: "Cancelled", tone: "text-muted-foreground" };
  }
};

export const QueueList = ({ compact = false }: { compact?: boolean }) => {
  const jobs = useQueue();
  const hasCompleted = jobs.some((j) => ["success", "failed", "cancelled"].includes(j.status));

  if (jobs.length === 0) {
    return (
      <div className="section-card p-10 text-center text-sm text-muted-foreground">
        <PackageIcon className="h-8 w-8 mx-auto mb-3 opacity-50" />
        No packages in the queue. Switch to <span className="font-medium text-foreground">New Package</span> to add one.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {hasCompleted && !compact && (
        <div className="flex justify-end">
          <Button variant="ghost" size="sm" onClick={clearCompleted}>
            <Trash2 className="h-3.5 w-3.5" /> Clear completed
          </Button>
        </div>
      )}
      {jobs.map((job) => (
        <QueueItem key={job.id} job={job} compact={compact} />
      ))}
    </div>
  );
};

const QueueItem = ({ job, compact }: { job: QueueJob; compact: boolean }) => {
  const meta = statusMeta(job.status);
  const stageLabel = QUEUE_STAGES[job.stageIdx] ?? QUEUE_STAGES[0];
  const isActive = job.status === "queued" || job.status === "running";

  return (
    <div className={cn("section-card", compact ? "p-3" : "p-5")}>
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "h-9 w-9 shrink-0 rounded-lg flex items-center justify-center",
            job.status === "success" && "bg-success/15 text-success",
            job.status === "running" && "brand-soft-bg text-primary",
            job.status === "queued" && "bg-secondary text-muted-foreground",
            job.status === "failed" && "bg-failed/15 text-failed",
            job.status === "cancelled" && "bg-secondary text-muted-foreground",
          )}
        >
          {job.status === "success" && <CheckCircle2 className="h-4 w-4" />}
          {job.status === "running" && <Loader2 className="h-4 w-4 animate-spin" />}
          {job.status === "queued" && <PackageIcon className="h-4 w-4" />}
          {(job.status === "failed" || job.status === "cancelled") && <XCircle className="h-4 w-4" />}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className={cn("font-mono truncate", compact ? "text-[11px]" : "text-xs")}>
                {job.name}
              </div>
              <div className="flex items-center gap-2 mt-1 text-[11px] text-muted-foreground">
                <span className="truncate">{job.repoName}</span>
                <EnvBadge env={job.environment} />
                <span className={cn("font-medium", meta.tone)}>{meta.label}</span>
              </div>
            </div>
            {isActive ? (
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => cancelJob(job.id)}>
                <X className="h-3.5 w-3.5" />
              </Button>
            ) : (
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => removeJob(job.id)}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>

          {isActive && (
            <div className="mt-3">
              <div className="flex items-center justify-between mb-1.5 text-[11px]">
                <span className="font-medium">{stageLabel}…</span>
                <span className="tabular-nums text-muted-foreground">{Math.floor(job.progress)}%</span>
              </div>
              <Progress value={job.progress} className="h-1.5" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
