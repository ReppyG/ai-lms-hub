import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { CanvasProvider } from "@/contexts/CanvasContext";
import Dashboard from "./pages/Dashboard";
import Assignments from "./pages/Assignments";
import Calendar from "./pages/Calendar";
import AiTools from "./pages/AiTools";
import AgentDashboard from "./pages/AgentDashboard";
import Notes from "./pages/Notes";
import Chat from "./pages/Chat";
import Settings from "./pages/Settings";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <CanvasProvider>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/" element={<Dashboard />} />
            <Route path="/assignments" element={<Assignments />} />
            <Route path="/calendar" element={<Calendar />} />
            <Route path="/ai-tools" element={<AiTools />} />
            <Route path="/agent" element={<AgentDashboard />} />
            <Route path="/notes" element={<Notes />} />
            <Route path="/chat" element={<Chat />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </CanvasProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
