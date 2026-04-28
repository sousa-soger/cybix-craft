import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import Index from "./pages/Index.tsx";
import Projects from "./pages/Projects.tsx";
import Create from "./pages/Create.tsx";
import Packages from "./pages/Packages.tsx";
import Deployments from "./pages/Deployments.tsx";
import Repositories from "./pages/Repositories.tsx";
import Servers from "./pages/Servers.tsx";
import Team from "./pages/Team.tsx";
import Audit from "./pages/Audit.tsx";
import Settings from "./pages/Settings.tsx";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/create" element={<Create />} />
            <Route path="/packages" element={<Packages />} />
            <Route path="/deployments" element={<Deployments />} />
            <Route path="/repositories" element={<Repositories />} />
            <Route path="/servers" element={<Servers />} />
            <Route path="/team" element={<Team />} />
            <Route path="/audit" element={<Audit />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
