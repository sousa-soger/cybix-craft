import { Link } from "react-router-dom";
import { Loader2, Package as PackageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { QueueList } from "@/components/queue-list";
import { useQueue } from "@/lib/package-queue";
import { cn } from "@/lib/utils";

export const QueueIndicator = () => {
  const jobs = useQueue();
  const active = jobs.filter((j) => j.status === "queued" || j.status === "running");
  if (jobs.length === 0) return null;

  const running = active.find((j) => j.status === "running");
  const totalActive = active.length;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "h-9 gap-2 rounded-full border border-border/60 bg-secondary/50 px-3",
            running && "border-primary/40 brand-soft-bg",
          )}
          aria-label="Package queue"
        >
          {running ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
          ) : (
            <PackageIcon className="h-3.5 w-3.5 text-muted-foreground" />
          )}
          <span className="text-xs font-medium">
            {totalActive > 0 ? `${totalActive} in queue` : `${jobs.length} packages`}
          </span>
          {running && (
            <span className="tabular-nums text-[11px] text-primary font-semibold">
              {Math.floor(running.progress)}%
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[380px] p-3 max-h-[70vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-2 px-1">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Package queue
          </span>
          <Link to="/create?view=queue" className="text-[11px] text-primary hover:underline font-medium">
            Open
          </Link>
        </div>
        <QueueList compact />
      </PopoverContent>
    </Popover>
  );
};
