import { useState } from "react";
import { Github, GitlabIcon as Gitlab, KeyRound, Link2, Link2Off, ShieldCheck, Trash2 } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  connectOAuth,
  disconnectOAuth,
  removePAT,
  setPAT,
  useProfile,
  type Provider,
} from "@/lib/profile-store";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const providerMeta: Record<Provider, { label: string; icon: React.ElementType; help: string; patUrl: string }> = {
  github: {
    label: "GitHub",
    icon: Github,
    help: "Personal Access Tokens (classic or fine-grained) with repo + workflow scopes.",
    patUrl: "https://github.com/settings/tokens",
  },
  gitlab: {
    label: "GitLab",
    icon: Gitlab,
    help: "Personal Access Tokens with api, read_repository and write_repository scopes.",
    patUrl: "https://gitlab.com/-/user_settings/personal_access_tokens",
  },
};

const ProviderCard = ({ provider }: { provider: Provider }) => {
  const profile = useProfile();
  const conn = profile[provider];
  const meta = providerMeta[provider];
  const Icon = meta.icon;
  const [token, setToken] = useState("");
  const [label, setLabel] = useState("");

  const handleSavePAT = () => {
    if (!token.trim()) {
      toast({ title: "Token required", variant: "destructive" });
      return;
    }
    setPAT(provider, token.trim(), label.trim() || undefined);
    setToken("");
    setLabel("");
    toast({ title: `${meta.label} token saved` });
  };

  return (
    <section className="section-card p-6 space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-lg brand-soft-bg flex items-center justify-center text-primary">
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold">{meta.label}</h3>
            <p className="text-xs text-muted-foreground">{meta.help}</p>
          </div>
        </div>
        <span
          className={cn(
            "text-[11px] font-medium px-2 py-0.5 rounded-md border",
            conn.connected
              ? "bg-success/10 text-success border-success/30"
              : "bg-secondary text-muted-foreground border-border",
          )}
        >
          {conn.connected ? "Connected" : "Not connected"}
        </span>
      </div>

      {/* OAuth */}
      <div className="rounded-lg border border-border/60 p-4 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-sm font-medium flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-primary" /> OAuth connection
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {conn.connected
                ? `Signed in as @${conn.username}${conn.oauthConnectedAt ? " · " + new Date(conn.oauthConnectedAt).toLocaleDateString() : ""}`
                : "Authorize once with your account to enable repository sync."}
            </p>
          </div>
          {conn.connected ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                disconnectOAuth(provider);
                toast({ title: `${meta.label} disconnected` });
              }}
            >
              <Link2Off className="h-4 w-4" /> Disconnect
            </Button>
          ) : (
            <Button
              variant="brand"
              size="sm"
              onClick={() => {
                connectOAuth(provider);
                toast({ title: `${meta.label} connected` });
              }}
            >
              <Link2 className="h-4 w-4" /> Connect
            </Button>
          )}
        </div>
      </div>

      {/* PAT */}
      <div className="rounded-lg border border-border/60 p-4 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-sm font-medium flex items-center gap-2">
              <KeyRound className="h-4 w-4 text-primary" /> Personal Access Token
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Used for CLI / server flows.{" "}
              <a
                href={meta.patUrl}
                target="_blank"
                rel="noreferrer"
                className="underline underline-offset-2 hover:text-foreground"
              >
                Create one →
              </a>
            </p>
          </div>
          {conn.pat && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                removePAT(provider);
                toast({ title: `${meta.label} token removed` });
              }}
            >
              <Trash2 className="h-4 w-4" /> Remove
            </Button>
          )}
        </div>

        {conn.pat ? (
          <div className="rounded-md bg-secondary/50 px-3 py-2 text-xs font-mono flex items-center justify-between gap-3">
            <span className="truncate">{conn.patLabel ? `${conn.patLabel} · ` : ""}{conn.pat}</span>
            <span className="text-muted-foreground">
              Updated {conn.patUpdatedAt ? new Date(conn.patUpdatedAt).toLocaleDateString() : "—"}
            </span>
          </div>
        ) : null}

        <div className="grid grid-cols-1 sm:grid-cols-[1fr_2fr_auto] gap-2">
          <div className="space-y-1">
            <Label htmlFor={`${provider}-label`} className="text-xs">Label</Label>
            <Input
              id={`${provider}-label`}
              placeholder="ci-token"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor={`${provider}-token`} className="text-xs">Token</Label>
            <Input
              id={`${provider}-token`}
              type="password"
              placeholder={provider === "github" ? "ghp_..." : "glpat-..."}
              value={token}
              onChange={(e) => setToken(e.target.value)}
            />
          </div>
          <div className="flex items-end">
            <Button variant="brand" size="sm" onClick={handleSavePAT} className="w-full">
              Save token
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

const Profile = () => {
  const profile = useProfile();

  return (
    <AppShell
      title="Profile"
      subtitle="Manage your account and Git provider credentials."
    >
      <div className="max-w-4xl space-y-5">
        <section className="section-card p-6">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-full brand-gradient-bg text-[hsl(var(--on-brand))] flex items-center justify-center text-lg font-semibold">
              {profile.name.split(" ").map((n) => n[0]).slice(0, 2).join("")}
            </div>
            <div>
              <h2 className="text-base font-semibold">{profile.name}</h2>
              <p className="text-sm text-muted-foreground">{profile.email}</p>
            </div>
          </div>
        </section>

        <ProviderCard provider="github" />
        <ProviderCard provider="gitlab" />
      </div>
    </AppShell>
  );
};

export default Profile;
