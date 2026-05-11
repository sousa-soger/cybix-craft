import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ChevronDown,
  ChevronsDownUp,
  ChevronsUpDown,
  Download,
  GitBranch,
  PackagePlus,
  Rocket,
  Search,
  Users,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EnvBadge, StatusBadge } from "@/components/badges";
import { cn } from "@/lib/utils";
import { packages, repositories, type PackageItem } from "@/lib/mock-data";

const initialsFor = (name: string) =>
  name
    .split(/\s+/)
    .map((s) => s[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

const Packages = () => {
  const [query, setQuery] = useState("");
  const [repoFilter, setRepoFilter] = useState<string>("all");
  const [creatorFilter, setCreatorFilter] = useState<string>("all");
  const [openMap, setOpenMap] = useState<Record<string, boolean>>({});

  const creators = useMemo(
    () => Array.from(new Set(packages.map((p) => p.createdBy))).sort(),
    [],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return packages.filter((p) => {
      if (repoFilter !== "all" && p.repositoryId !== repoFilter) return false;
      if (creatorFilter !== "all" && p.createdBy !== creatorFilter) return false;
      if (!q) return true;
      const repo = repositories.find((r) => r.id === p.repositoryId);
      return (
        p.name.toLowerCase().includes(q) ||
        p.createdBy.toLowerCase().includes(q) ||
        (repo?.name.toLowerCase().includes(q) ?? false)
      );
    });
  }, [query, repoFilter, creatorFilter]);

  const grouped = useMemo(() => {
    const map = new Map<string, PackageItem[]>();
    for (const p of filtered) {
      const arr = map.get(p.repositoryId) ?? [];
      arr.push(p);
      map.set(p.repositoryId, arr);
    }
    return repositories
      .filter((r) => map.has(r.id))
      .map((r) => ({ repo: r, items: map.get(r.id)! }));
  }, [filtered]);

  return (
    <AppShell
      title="Packages"
      subtitle="Browse update bundles grouped by repository, across every contributor."
      actions={
        <Link to="/create">
          <Button variant="brand" size="sm">
            <PackagePlus className="h-4 w-4" /> New Package
          </Button>
        </Link>
      }
    >
      <div className="flex flex-col md:flex-row md:items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search packages, repos, creators…"
            className="pl-9 bg-card"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <Select value={repoFilter} onValueChange={setRepoFilter}>
            <SelectTrigger className="w-[200px] bg-card">
              <GitBranch className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
              <SelectValue placeholder="Repository" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All repositories</SelectItem>
              {repositories.map((r) => (
                <SelectItem key={r.id} value={r.id}>
                  {r.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={creatorFilter} onValueChange={setCreatorFilter}>
            <SelectTrigger className="w-[180px] bg-card">
              <Users className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
              <SelectValue placeholder="Created by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All creators</SelectItem>
              {creators.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {grouped.length === 0 ? (
        <div className="section-card p-10 text-center text-sm text-muted-foreground">
          No packages match the current filters.
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs text-muted-foreground">
              {grouped.length} {grouped.length === 1 ? "repository" : "repositories"} ·{" "}
              {filtered.length} {filtered.length === 1 ? "package" : "packages"}
            </div>
            {(() => {
              const allOpen = grouped.every(({ repo }) => openMap[repo.id] ?? true);
              return (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    const next: Record<string, boolean> = {};
                    for (const { repo } of grouped) next[repo.id] = !allOpen;
                    setOpenMap((prev) => ({ ...prev, ...next }));
                  }}
                >
                  {allOpen ? (
                    <>
                      <ChevronsDownUp className="h-3.5 w-3.5" /> Collapse all
                    </>
                  ) : (
                    <>
                      <ChevronsUpDown className="h-3.5 w-3.5" /> Expand all
                    </>
                  )}
                </Button>
              );
            })()}
          </div>
          <div className="space-y-3">
            {grouped.map(({ repo, items }) => (
              <RepoGroup
                key={repo.id}
                repo={repo}
                items={items}
                open={openMap[repo.id] ?? true}
                onOpenChange={(o) =>
                  setOpenMap((prev) => ({ ...prev, [repo.id]: o }))
                }
              />
            ))}
          </div>
        </>
      )}
    </AppShell>
  );
};

const RepoGroup = ({
  repo,
  items,
  open,
  onOpenChange,
}: {
  repo: (typeof repositories)[number];
  items: PackageItem[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) => {
  const owner = repo.members.find((m) => m.id === repo.ownerId);
  const uniqueCreators = Array.from(new Set(items.map((i) => i.createdBy)));

  return (
    <Collapsible
      open={open}
      onOpenChange={setOpen}
      className="section-card overflow-hidden p-0"
    >
      <CollapsibleTrigger className="w-full">
        <div className="flex items-center justify-between gap-3 px-5 py-3 bg-secondary/40 hover:bg-secondary/60 transition-base">
          <div className="flex items-center gap-3 min-w-0">
            <ChevronDown
              className={cn(
                "h-4 w-4 text-muted-foreground transition-transform",
                !open && "-rotate-90",
              )}
            />
            <GitBranch className="h-4 w-4 text-primary shrink-0" />
            <div className="min-w-0 text-left">
              <div className="font-mono text-sm truncate">{repo.name}</div>
              <div className="text-[11px] text-muted-foreground truncate">
                {owner ? `Owner · ${owner.name}` : "No owner"} ·{" "}
                {uniqueCreators.length}{" "}
                {uniqueCreators.length === 1 ? "contributor" : "contributors"}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <div className="hidden sm:flex -space-x-2">
              {uniqueCreators.slice(0, 4).map((name) => (
                <Avatar
                  key={name}
                  className="h-6 w-6 border-2 border-card"
                  title={name}
                >
                  <AvatarFallback className="text-[10px]">
                    {initialsFor(name)}
                  </AvatarFallback>
                </Avatar>
              ))}
            </div>
            <Badge variant="secondary" className="rounded-full">
              {items.length}
            </Badge>
          </div>
        </div>
      </CollapsibleTrigger>

      <CollapsibleContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-background text-xs uppercase tracking-wider text-muted-foreground border-t border-border/60">
              <tr>
                <th className="text-left font-medium px-5 py-2.5">Package</th>
                <th className="text-left font-medium px-5 py-2.5">Versions</th>
                <th className="text-left font-medium px-5 py-2.5">Env</th>
                <th className="text-left font-medium px-5 py-2.5">Size</th>
                <th className="text-left font-medium px-5 py-2.5">Status</th>
                <th className="text-left font-medium px-5 py-2.5">Created by</th>
                <th className="text-right font-medium px-5 py-2.5">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {items.map((p) => (
                <tr
                  key={p.id}
                  className="hover:bg-secondary/40 transition-base"
                >
                  <td className="px-5 py-3">
                    <div className="font-mono text-[11px] text-foreground/80 max-w-xs truncate">
                      {p.name}
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      {p.createdAt}
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <div className="font-mono text-xs">
                      {p.baseVersion}{" "}
                      <span className="text-muted-foreground">→</span>{" "}
                      {p.targetVersion}
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <EnvBadge env={p.environment} />
                  </td>
                  <td className="px-5 py-3 tabular-nums text-xs">
                    {p.sizeMB > 0 ? `${p.sizeMB} MB` : "—"}
                  </td>
                  <td className="px-5 py-3">
                    <StatusBadge status={p.status} />
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="text-[10px]">
                          {initialsFor(p.createdBy)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-xs truncate">{p.createdBy}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={p.status !== "success"}
                      >
                        <Download className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="sm"
                        variant="soft"
                        disabled={p.status !== "success"}
                      >
                        <Rocket className="h-3.5 w-3.5" /> Deploy
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};

export default Packages;
