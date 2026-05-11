import { useState } from "react";
import { Github, GitlabIcon as Gitlab, HardDrive, Server, Check, Loader2, ShieldCheck, KeyRound, ArrowLeft, Workflow, KeySquare, Upload } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { type RepoProvider } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface ConnectRepositoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type Step = "provider" | "auth" | "details" | "verifying" | "done";

interface ProviderMeta {
  id: RepoProvider;
  name: string;
  description: string;
  icon: React.ReactNode;
  authMethod: "oauth" | "token" | "ssh" | "path";
  authLabel: string;
}

const PROVIDERS: ProviderMeta[] = [
  {
    id: "github",
    name: "GitHub",
    description: "Connect a public or private GitHub repository via OAuth.",
    icon: <Github className="h-5 w-5" />,
    authMethod: "oauth",
    authLabel: "OAuth (recommended) or Personal Access Token",
  },
  {
    id: "gitlab",
    name: "GitLab",
    description: "Connect a GitLab.com or self-hosted GitLab repository.",
    icon: <Gitlab className="h-5 w-5" />,
    authMethod: "token",
    authLabel: "Project Access Token",
  },
  {
    id: "company-server",
    name: "Company Server",
    description: "Connect a self-hosted Git server over SSH.",
    icon: <Server className="h-5 w-5" />,
    authMethod: "ssh",
    authLabel: "SSH key + host",
  },
  {
    id: "local-pc",
    name: "Local PC",
    description: "Index a local repository folder via the Cybix agent.",
    icon: <HardDrive className="h-5 w-5" />,
    authMethod: "path",
    authLabel: "Local agent + folder path",
  },
];

export const ConnectRepositoryDialog = ({ open, onOpenChange }: ConnectRepositoryDialogProps) => {
  const [step, setStep] = useState<Step>("provider");
  const [provider, setProvider] = useState<ProviderMeta | null>(null);
  const [repoUrl, setRepoUrl] = useState("");
  const [defaultBranch, setDefaultBranch] = useState("main");
  const [token, setToken] = useState("");
  const [host, setHost] = useState("");
  const [localPath, setLocalPath] = useState("");
  const [localMethod, setLocalMethod] = useState<"agent" | "ssh" | "upload">("agent");

  const reset = () => {
    setStep("provider");
    setProvider(null);
    setRepoUrl("");
    setDefaultBranch("main");
    setToken("");
    setHost("");
    setLocalPath("");
  };

  const handleClose = (next: boolean) => {
    if (!next) setTimeout(reset, 200);
    onOpenChange(next);
  };

  const pickProvider = (p: ProviderMeta) => {
    setProvider(p);
    setStep("auth");
  };

  const handleVerify = () => {
    setStep("verifying");
    window.setTimeout(() => {
      setStep("done");
    }, 1600);
  };

  const handleFinish = () => {
    toast.success("Repository connected", {
      description: `${repoUrl || localPath || "New repository"} is now available.`,
    });
    handleClose(false);
  };

  const canSubmitDetails =
    !!defaultBranch &&
    (provider?.authMethod === "path"
      ? !!localPath
      : provider?.authMethod === "ssh"
      ? !!host && !!repoUrl
      : !!repoUrl);

  const canSubmitAuth =
    provider?.authMethod === "oauth"
      ? true
      : provider?.authMethod === "path"
      ? true
      : !!token || provider?.authMethod === "ssh";

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-xl p-0 overflow-hidden">
        <div className="brand-soft-bg px-6 py-5 border-b border-border/60">
          <DialogHeader>
            <DialogTitle className="text-xl">Connect Repository</DialogTitle>
            <DialogDescription>
              Cybix Deployer reads code only when you build a package. Credentials are stored encrypted.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 flex items-center gap-2">
            {(["provider", "auth", "details", "done"] as Step[]).map((s, i) => {
              const order = ["provider", "auth", "details", "done"];
              const currentIdx = order.indexOf(step === "verifying" ? "details" : step);
              const active = i <= currentIdx;
              return (
                <div key={s} className="flex items-center gap-2 flex-1">
                  <div
                    className={cn(
                      "h-1.5 flex-1 rounded-full transition-colors",
                      active ? "brand-gradient-bg" : "bg-border",
                    )}
                  />
                </div>
              );
            })}
          </div>
        </div>

        <div className="px-6 py-5 max-h-[60vh] overflow-y-auto">
          {step === "provider" && (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground mb-3">Pick a source for your repository.</p>
              {PROVIDERS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => pickProvider(p)}
                  className="w-full text-left flex items-center gap-3 rounded-xl border border-border/70 bg-card p-3 hover:shadow-soft hover:border-primary/40 transition-base"
                >
                  <div className="h-10 w-10 rounded-lg brand-soft-bg flex items-center justify-center text-primary shrink-0">
                    {p.icon}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold">{p.name}</div>
                    <div className="text-xs text-muted-foreground truncate">{p.description}</div>
                  </div>
                  <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                    {p.authMethod}
                  </div>
                </button>
              ))}
            </div>
          )}

          {step === "auth" && provider && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 rounded-xl brand-soft-bg p-3 border border-border/60">
                <div className="h-10 w-10 rounded-lg bg-card flex items-center justify-center text-primary">
                  {provider.icon}
                </div>
                <div className="flex-1">
                  <div className="text-sm font-semibold">{provider.name}</div>
                  <div className="text-xs text-muted-foreground">{provider.authLabel}</div>
                </div>
              </div>

              {provider.authMethod === "oauth" && (
                <RadioGroup defaultValue="oauth" className="space-y-2">
                  <label className="flex items-start gap-3 rounded-lg border border-border/70 p-3 cursor-pointer hover:border-primary/40">
                    <RadioGroupItem value="oauth" className="mt-1" />
                    <div className="flex-1">
                      <div className="text-sm font-medium flex items-center gap-2">
                        <ShieldCheck className="h-4 w-4 text-success" /> Sign in with GitHub
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Cybix will request <span className="font-mono">repo</span> read access. You can revoke any time.
                      </div>
                    </div>
                  </label>
                  <label className="flex items-start gap-3 rounded-lg border border-border/70 p-3 cursor-pointer hover:border-primary/40">
                    <RadioGroupItem value="pat" className="mt-1" />
                    <div className="flex-1 space-y-2">
                      <div className="text-sm font-medium flex items-center gap-2">
                        <KeyRound className="h-4 w-4 text-primary" /> Personal Access Token
                      </div>
                      <Input
                        type="password"
                        placeholder="ghp_••••••••••••"
                        value={token}
                        onChange={(e) => setToken(e.target.value)}
                      />
                    </div>
                  </label>
                </RadioGroup>
              )}

              {provider.authMethod === "token" && (
                <div className="space-y-2">
                  <Label>Project Access Token</Label>
                  <Input
                    type="password"
                    placeholder="glpat-••••••••••••"
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Required scopes: <span className="font-mono">read_repository</span>.
                  </p>
                </div>
              )}

              {provider.authMethod === "ssh" && (
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label>Host</Label>
                    <Input
                      placeholder="git.company.internal"
                      value={host}
                      onChange={(e) => setHost(e.target.value)}
                    />
                  </div>
                  <div className="rounded-lg border border-dashed border-border p-3 bg-secondary/40">
                    <p className="text-xs font-medium mb-1">Add deploy key</p>
                    <p className="text-[11px] text-muted-foreground mb-2">
                      Add the following public key to your repository's deploy keys.
                    </p>
                    <code className="block text-[10px] font-mono bg-background border border-border rounded p-2 break-all">
                      ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAI...cybix-deployer
                    </code>
                  </div>
                </div>
              )}

              {provider.authMethod === "path" && (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Choose how Cybix should connect to this local repository.
                  </p>
                  {(() => {
                    const opts = [
                      {
                        id: "agent" as const,
                        name: "Cybix Agent",
                        icon: <Workflow className="h-5 w-5" />,
                        description:
                          "Install our lightweight background app for automatic syncing of your local repository. Best for ongoing work where you want changes to be picked up without any extra steps.",
                      },
                      {
                        id: "ssh" as const,
                        name: "SSH Access",
                        icon: <KeySquare className="h-5 w-5" />,
                        description:
                          "Give the server SSH access to pull directly from your machine. Requires a reachable host and a deploy key. Great when your machine is always-on and reachable.",
                      },
                      {
                        id: "upload" as const,
                        name: "Upload Repository",
                        icon: <Upload className="h-5 w-5" />,
                        description:
                          "Upload a ZIP archive or Git bundle of your local repository. Best for one-off builds or when no agent or SSH access is available.",
                      },
                    ];
                    return (
                      <div className="sm:hidden space-y-2">
                        {opts.map((opt) => {
                          const active = localMethod === opt.id;
                          return (
                            <button
                              key={opt.id}
                              type="button"
                              onClick={() => setLocalMethod(opt.id)}
                              className={cn(
                                "w-full text-left rounded-xl border bg-card p-4 transition-all",
                                active ? "border-primary/60 brand-soft-bg" : "border-border/70",
                              )}
                            >
                              <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-lg brand-soft-bg text-primary flex items-center justify-center">
                                  {opt.icon}
                                </div>
                                <div className="text-sm font-semibold">{opt.name}</div>
                                {active && <Check className="ml-auto h-4 w-4 text-success" />}
                              </div>
                              <p className="mt-2 text-xs text-muted-foreground leading-relaxed">{opt.description}</p>
                            </button>
                          );
                        })}
                      </div>
                    );
                  })()}

                  {/* Desktop: hover expands card across full row width */}
                  <div className="hidden sm:block relative h-32">
                    {([
                      {
                        id: "agent" as const,
                        name: "Cybix Agent",
                        icon: <Workflow className="h-5 w-5" />,
                        description:
                          "Install our lightweight background app for automatic syncing of your local repository. Best for ongoing work where you want changes to be picked up without any extra steps.",
                      },
                      {
                        id: "ssh" as const,
                        name: "SSH Access",
                        icon: <KeySquare className="h-5 w-5" />,
                        description:
                          "Give the server SSH access to pull directly from your machine. Requires a reachable host and a deploy key. Great when your machine is always-on and reachable.",
                      },
                      {
                        id: "upload" as const,
                        name: "Upload Repository",
                        icon: <Upload className="h-5 w-5" />,
                        description:
                          "Upload a ZIP archive or Git bundle of your local repository. Best for one-off builds or when no agent or SSH access is available.",
                      },
                    ]).map((opt, i) => {
                      const active = localMethod === opt.id;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => setLocalMethod(opt.id)}
                          style={{
                            left: `calc(${i} * (33.3333% + 4px))`,
                            width: "calc(33.3333% - 8px)",
                          }}
                          className={cn(
                            "group absolute top-0 text-left rounded-xl border bg-card p-4 overflow-hidden",
                            "transition-[left,width,box-shadow,border-color,background-color,transform] duration-300 ease-out",
                            "hover:!left-0 hover:!w-full hover:z-20 hover:shadow-glow hover:border-primary/50 hover:-translate-y-0.5",
                            "focus-visible:!left-0 focus-visible:!w-full focus-visible:z-20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                            active
                              ? "z-10 border-primary/60 shadow-soft brand-soft-bg"
                              : "border-border/70 shadow-sm",
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={cn(
                                "h-10 w-10 rounded-lg flex items-center justify-center shrink-0 transition-colors",
                                active
                                  ? "brand-gradient-bg text-[hsl(var(--on-brand))]"
                                  : "brand-soft-bg text-primary group-hover:brand-gradient-bg group-hover:text-[hsl(var(--on-brand))]",
                              )}
                            >
                              {opt.icon}
                            </div>
                            <div className="text-sm font-semibold truncate">{opt.name}</div>
                            {active && (
                              <div className="ml-auto h-6 w-6 rounded-full bg-success/15 text-success flex items-center justify-center animate-scale-in shrink-0">
                                <Check className="h-3.5 w-3.5" />
                              </div>
                            )}
                          </div>
                          <div
                            className={cn(
                              "grid transition-all duration-300 ease-out",
                              "grid-rows-[0fr] opacity-0 mt-0",
                              "group-hover:grid-rows-[1fr] group-hover:opacity-100 group-hover:mt-3",
                              "group-focus-visible:grid-rows-[1fr] group-focus-visible:opacity-100 group-focus-visible:mt-3",
                            )}
                          >
                            <div className="overflow-hidden">
                              <p className="text-xs text-muted-foreground leading-relaxed">
                                {opt.description}
                              </p>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {step === "details" && provider && (
            <div className="space-y-4">

              {provider.authMethod === "path" ? (
                (localMethod === "upload" || localMethod === "agent") ? (
                  <div className="space-y-3">
                    <label
                      htmlFor="repo-drop-zone"
                      className="group relative flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-border/70 bg-secondary/30 px-6 py-10 text-center cursor-pointer transition-all hover:border-primary/60 hover:bg-secondary/50"
                    >
                      <div className="h-16 w-16 rounded-xl brand-soft-bg flex items-center justify-center text-primary transition-transform group-hover:scale-105">
                        <Upload className="h-8 w-8" />
                      </div>
                      <div className="space-y-1">
                        <div className="text-base font-semibold">Drag &amp; Drop your project</div>
                        <p className="text-xs text-muted-foreground max-w-sm">
                          Simply drop your project folder or archive file. Accepts both local directories and ZIP files.
                        </p>
                        <p className="text-xs text-muted-foreground">Supports automatic processing</p>
                      </div>
                      <input
                        id="repo-drop-zone"
                        type="file"
                        className="hidden"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) setLocalPath(f.name);
                        }}
                      />
                    </label>
                    {localPath && (
                      <p className="text-xs text-muted-foreground">
                        Selected: <span className="font-mono text-foreground">{localPath}</span>
                      </p>
                    )}
                    <div className="space-y-2">
                      <Label>Repository name</Label>
                      <Input
                        placeholder="e.g. my-project"
                        value={repoUrl}
                        onChange={(e) => setRepoUrl(e.target.value)}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label>Local folder path</Label>
                    <Input
                      placeholder="/Users/you/code/my-app"
                      value={localPath}
                      onChange={(e) => setLocalPath(e.target.value)}
                    />
                  </div>
                )
              ) : (
                <div className="space-y-2">
                  <Label>Repository URL</Label>
                  <Input
                    placeholder={
                      provider.id === "github"
                        ? "https://github.com/org/repo"
                        : provider.id === "gitlab"
                        ? "https://gitlab.com/group/repo"
                        : "git@git.company.internal:group/repo.git"
                    }
                    value={repoUrl}
                    onChange={(e) => setRepoUrl(e.target.value)}
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label>Default branch</Label>
                <Input
                  placeholder="main"
                  value={defaultBranch}
                  onChange={(e) => setDefaultBranch(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Used as the base when nothing is selected during package creation.
                </p>
              </div>
            </div>
          )}

          {step === "verifying" && (
            <div className="py-10 flex flex-col items-center justify-center gap-3 text-center">
              <Loader2 className="h-8 w-8 text-primary animate-spin" />
              <div className="text-sm font-medium">Verifying access…</div>
              <div className="text-xs text-muted-foreground">
                Authenticating, fetching branches and tags.
              </div>
            </div>
          )}

          {step === "done" && (
            <div className="py-8 flex flex-col items-center justify-center gap-3 text-center">
              <div className="h-12 w-12 rounded-full bg-success/15 text-success flex items-center justify-center">
                <Check className="h-6 w-6" />
              </div>
              <div className="text-base font-semibold">Repository connected</div>
              <div className="text-xs text-muted-foreground max-w-sm">
                Cybix discovered branches and tags. You can now build a package from this repository.
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="px-6 py-4 border-t border-border/60 bg-muted/30 sm:justify-between gap-2">
          {step !== "provider" && step !== "done" && step !== "verifying" ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setStep(step === "details" ? "auth" : "provider")}
            >
              <ArrowLeft className="h-4 w-4" /> Back
            </Button>
          ) : (
            <span />
          )}

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => handleClose(false)}>
              {step === "done" ? "Close" : "Cancel"}
            </Button>

            {step === "auth" && (
              <Button variant="brand" size="sm" disabled={!canSubmitAuth} onClick={() => setStep("details")}>
                Continue
              </Button>
            )}
            {step === "details" && (
              <Button variant="brand" size="sm" disabled={!canSubmitDetails} onClick={handleVerify}>
                Verify & connect
              </Button>
            )}
            {step === "done" && (
              <Button variant="brand" size="sm" onClick={handleFinish}>
                Done
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
