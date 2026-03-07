import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { InactivityProvider } from "@/hooks/useInactivityTimer";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import AdminPanel from "./pages/AdminPanel";
import SimulationPage from "./pages/SimulationPage";
import EvaluationsPage from "./pages/EvaluationsPage";
import StudentLedger from "./pages/StudentLedger";
import LegajosPage from "./pages/LegajosPage";
import CertificateView from "./pages/CertificateView";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          {/* InactivityProvider va dentro de BrowserRouter para poder usar useLocation */}
          <InactivityProvider>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/admin" element={<AdminPanel />} />
              <Route path="/simulation/:courseId" element={<SimulationPage />} />
              <Route path="/evaluations" element={<EvaluationsPage />} />
              <Route path="/student-ledger/:userId" element={<StudentLedger />} />
              <Route path="/legajos" element={<LegajosPage />} />
              <Route path="/certificate/:instanceId" element={<CertificateView />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </InactivityProvider>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
