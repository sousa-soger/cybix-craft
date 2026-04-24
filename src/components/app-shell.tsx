import { Sidebar } from "@/components/sidebar";
import { Topbar } from "@/components/topbar";

interface AppShellProps {
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}

export const AppShell = ({ title, subtitle, actions, children }: AppShellProps) => {
  return (
    <div className="flex min-h-screen w-full bg-gradient-surface">
      <Sidebar />
      <div className="flex-1 min-w-0 flex flex-col">
        <Topbar title={title} subtitle={subtitle} actions={actions} />
        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 lg:py-8 animate-fade-in">
          {children}
        </main>
      </div>
    </div>
  );
};
