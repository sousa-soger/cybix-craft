import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { ListChecks, PackagePlus } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { CreatePackage } from "@/components/create-package";
import { QueueList } from "@/components/queue-list";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQueue } from "@/lib/package-queue";

const CreatePage = () => {
  const [params, setParams] = useSearchParams();
  const initial = params.get("view") === "queue" ? "queue" : "new";
  const [tab, setTab] = useState<string>(initial);
  const jobs = useQueue();
  const activeCount = jobs.filter((j) => j.status === "queued" || j.status === "running").length;

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
        <TabsList>
          <TabsTrigger value="new" className="gap-2">
            <PackagePlus className="h-3.5 w-3.5" /> New Package
          </TabsTrigger>
          <TabsTrigger value="queue" className="gap-2">
            <ListChecks className="h-3.5 w-3.5" /> Queue
            {jobs.length > 0 && (
              <span className="ml-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full brand-soft-bg px-1.5 text-[10px] font-semibold text-primary">
                {activeCount > 0 ? activeCount : jobs.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

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
