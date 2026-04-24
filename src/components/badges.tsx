import { cn } from "@/lib/utils";
import type { Environment } from "@/lib/mock-data";

interface EnvBadgeProps {
  env: Environment;
  className?: string;
}

const styles: Record<Environment, string> = {
  DEV: "bg-running/10 text-running border-running/30",
  QA: "bg-queued/10 text-queued border-queued/30",
  PROD: "bg-failed/10 text-failed border-failed/30",
};

export const EnvBadge = ({ env, className }: EnvBadgeProps) => (
  <span
    className={cn(
      "inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[10px] font-semibold tracking-wider",
      styles[env],
      className,
    )}
  >
    <span className="h-1.5 w-1.5 rounded-full bg-current" />
    {env}
  </span>
);

type Status = "success" | "running" | "queued" | "failed" | "cancelled";

interface StatusBadgeProps {
  status: Status;
  className?: string;
  label?: string;
}

const statusStyles: Record<Status, string> = {
  success: "bg-success/12 text-success border-success/30",
  running: "bg-running/12 text-running border-running/30",
  queued: "bg-queued/12 text-queued border-queued/30",
  failed: "bg-failed/12 text-failed border-failed/30",
  cancelled: "bg-inactive/15 text-inactive border-inactive/30",
};

const statusLabel: Record<Status, string> = {
  success: "Success",
  running: "Running",
  queued: "Queued",
  failed: "Failed",
  cancelled: "Cancelled",
};

export const StatusBadge = ({ status, className, label }: StatusBadgeProps) => (
  <span
    className={cn(
      "inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-medium",
      statusStyles[status],
      className,
    )}
  >
    <span
      className={cn(
        "h-1.5 w-1.5 rounded-full bg-current",
        status === "running" && "animate-pulse-soft",
      )}
    />
    {label ?? statusLabel[status]}
  </span>
);
