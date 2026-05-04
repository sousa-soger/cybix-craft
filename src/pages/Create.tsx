import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { ListChecks, PackagePlus } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { CreatePackage } from "@/components/create-package";
import { QueueList } from "@/components/queue-list";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQueue } from "@/lib/package-queue";
import { useQueueBump } from "@/lib/use-queue-bump";
import { cn } from "@/lib/utils";

const CreatePage = () => {
  const [params, setParams] = useSearchParams();
  const initial = params.get("view") === "queue" ? "queue" : "new";
  const [tab, setTab] = useState<string>(initial);
  const jobs = useQueue();
  const activeCount = jobs.filter((j) => j.status === "queued" || j.status === "running").length;
  const bump = useQueueBump(1600);

  useEffect(() => {
    const v = params.get("view");
    if (v === "queue" && tab !== "queue") setTab("queue");
    if (v === "new" && tab !== "new") setTab("new");
  }, [params]);

  const onTabChange = (v: string) => {
    setTab(v);
    const next = new URLSearchParams(params);
    if (v === "queue") next.set("view", "queue");
    else next.delete("view");
    setParams(next, { replace: true });
  };

  return (
    <AppShell
      title="Quick Create Package"
      subtitle="Generate update and rollback packages — queue runs in the background."
    >
      <Tabs value={tab} onValueChange={onTabChange} className="space-y-5">
        <div className="sticky top-16 z-20 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-3 bg-background/85 backdrop-blur-xl border-b border-border/60">
          <TabsList>
            <TabsTrigger value="new" className="gap-2">
              <PackagePlus className="h-3.5 w-3.5" /> New Package
            </TabsTrigger>
            <TabsTrigger value="queue" className="gap-2 relative">
              <ListChecks className="h-3.5 w-3.5" /> Queue
              {jobs.length > 0 && (
                <span
                  className={cn(
                    "ml-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full brand-soft-bg px-1.5 text-[10px] font-semibold text-primary transition-all",
                    bump && tab !== "queue" && "scale-125 ring-2 ring-primary/60 brand-gradient-bg text-[hsl(var(--on-brand))]",
                  )}
                >
                  {activeCount > 0 ? activeCount : jobs.length}
                </span>
              )}
              {bump && tab !== "queue" && (
                <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-primary animate-ping" />
              )}
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="new" className="mt-5">
          <CreatePackage />
        </TabsContent>
        <TabsContent value="queue" className="mt-5">
          <QueueList />
        </TabsContent>
      </Tabs>
    </AppShell>
  );
};

export default CreatePage;
