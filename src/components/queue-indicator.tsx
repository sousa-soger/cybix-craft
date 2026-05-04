import { Link } from "react-router-dom";
import { CheckCircle2, Loader2, Package as PackageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Progress } from "@/components/ui/progress";
import { QueueList } from "@/components/queue-list";
import { useQueue } from "@/lib/package-queue";
import { useQueueBump } from "@/lib/use-queue-bump";
import { cn } from "@/lib/utils";

export const QueueIndicator = () => {
  const jobs = useQueue();
  const bump = useQueueBump();
  if (jobs.length === 0) return null;

  const active = jobs.filter((j) => j.status === "queued" || j.status === "running");
  const completed = jobs.filter((j) => j.status === "success").length;
  const failed = jobs.filter((j) => j.status === "failed" || j.status === "cancelled").length;
  const total = jobs.length;
  const running = active.find((j) => j.status === "running");
  const overallPct = Math.round(
    ((completed + (running ? running.progress / 100 : 0)) / total) * 100,
  );
  const allDone = active.length === 0;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "h-9 gap-2 rounded-full border border-border/60 bg-secondary/50 pl-2.5 pr-3 transition-all",
            running && "border-primary/40 brand-soft-bg",
            allDone && "border-success/40 bg-success/10",
            bump && "ring-2 ring-primary/50 scale-105 shadow-soft",
          )}
          aria-label="Package queue"
        >
          {allDone ? (
            <CheckCircle2 className="h-3.5 w-3.5 text-success" />
          ) : running ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
          ) : (
            <PackageIcon className="h-3.5 w-3.5 text-muted-foreground" />
          )}
          <span className="text-xs font-semibold tabular-nums">
            {completed}/{total}
          </span>
          <span className="text-[11px] text-muted-foreground">done</span>
          {running && (
            <span className="ml-1 tabular-nums text-[11px] text-primary font-semibold">
              · {Math.floor(running.progress)}%
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[400px] p-3 max-h-[75vh] overflow-y-auto">
        <div className="px-1 mb-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Package queue
            </span>
            <Link to="/create?view=queue" className="text-[11px] text-primary hover:underline font-medium">
              Open queue →
            </Link>
          </div>
          <div className="flex items-center justify-between text-[11px] mb-1.5">
            <span className="text-muted-foreground">
              <span className="font-semibold text-success">{completed}</span> completed ·{" "}
              <span className="font-semibold text-primary">{active.length}</span> active
              {failed > 0 && (
                <>
                  {" "}· <span className="font-semibold text-failed">{failed}</span> failed
                </>
              )}
            </span>
            <span className="font-semibold tabular-nums">{overallPct}%</span>
          </div>
          <Progress value={overallPct} className="h-1.5" />
        </div>
        <QueueList compact />
      </PopoverContent>
    </Popover>
  );
};
