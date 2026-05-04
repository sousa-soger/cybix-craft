import { Bell, Github, GitlabIcon as Gitlab, Link2, Link2Off, LogOut, Moon, Search, Settings as SettingsIcon, Sun, User } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTheme } from "@/components/theme-provider";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { connectOAuth, disconnectOAuth, useProfile } from "@/lib/profile-store";
import { toast } from "@/hooks/use-toast";
import { QueueIndicator } from "@/components/queue-indicator";

interface TopbarProps {
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export const Topbar = ({ title, subtitle, actions }: TopbarProps) => {
  const { theme, toggle } = useTheme();
  const profile = useProfile();
  const navigate = useNavigate();

  const toggleProvider = (provider: "github" | "gitlab") => {
    if (profile[provider].connected) {
      disconnectOAuth(provider);
      toast({ title: `${provider === "github" ? "GitHub" : "GitLab"} disconnected` });
    } else {
      connectOAuth(provider);
      toast({ title: `${provider === "github" ? "GitHub" : "GitLab"} connected` });
    }
  };

  return (
    <header className="sticky top-0 z-30 border-b border-border/70 bg-background/70 backdrop-blur-xl">
      <div className="flex items-center gap-4 px-6 lg:px-8 h-16">
        <div className="flex-1 min-w-0">
          {title && (
            <div className="flex flex-col leading-tight">
              <h1 className="text-base font-semibold tracking-tight truncate">{title}</h1>
              {subtitle && (
                <p className="text-xs text-muted-foreground truncate">{subtitle}</p>
              )}
            </div>
          )}
        </div>

        <div className="hidden md:flex relative w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search projects, packages…"
            className="pl-9 bg-secondary/50 border-border/60 h-9"
          />
        </div>

        {actions}

        <QueueIndicator />

        <Button variant="ghost" size="icon" onClick={toggle} aria-label="Toggle theme">
          {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>

        <Button variant="ghost" size="icon" aria-label="Notifications" className="relative">
          <Bell className="h-4 w-4" />
          <span className="absolute top-2 right-2 h-1.5 w-1.5 rounded-full bg-failed" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              aria-label="Open profile menu"
              className="rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <Avatar className="h-9 w-9 ring-2 ring-border cursor-pointer hover:ring-primary/60 transition-colors">
                <AvatarFallback className="brand-gradient-bg text-[hsl(var(--on-brand))] text-xs font-semibold">
                  {profile.name.split(" ").map((n) => n[0]).slice(0, 2).join("")}
                </AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64">
            <DropdownMenuLabel>
              <div className="flex flex-col">
                <span className="text-sm font-semibold">{profile.name}</span>
                <span className="text-xs text-muted-foreground font-normal">{profile.email}</span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate("/profile")}>
              <User className="h-4 w-4" /> View profile
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Quick connect
            </DropdownMenuLabel>
            <DropdownMenuItem onClick={() => toggleProvider("github")}>
              <Github className="h-4 w-4" />
              <span className="flex-1">GitHub</span>
              {profile.github.connected ? (
                <span className="inline-flex items-center gap-1 text-[11px] text-success">
                  <Link2Off className="h-3 w-3" /> Disconnect
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                  <Link2 className="h-3 w-3" /> Connect
                </span>
              )}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => toggleProvider("gitlab")}>
              <Gitlab className="h-4 w-4" />
              <span className="flex-1">GitLab</span>
              {profile.gitlab.connected ? (
                <span className="inline-flex items-center gap-1 text-[11px] text-success">
                  <Link2Off className="h-3 w-3" /> Disconnect
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                  <Link2 className="h-3 w-3" /> Connect
                </span>
              )}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/settings">
                <SettingsIcon className="h-4 w-4" /> Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => {
                disconnectOAuth("github");
                disconnectOAuth("gitlab");
                toast({ title: "Logged out" });
                navigate("/");
              }}
              className="text-failed focus:text-failed"
            >
              <LogOut className="h-4 w-4" /> Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};
