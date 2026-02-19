import { useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import PinLock from "./pages/PinLock";
import Dashboard from "./pages/Dashboard";
import Patients from "./pages/Patients";
import PatientProfile from "./pages/PatientProfile";
import Agenda from "./pages/Agenda";
import Prescriptions from "./pages/Prescriptions";
import Certificates from "./pages/Certificates";
import OdontogramPage from "./pages/OdontogramPage";
import Financial from "./pages/Financial";
import Materials from "./pages/Materials";
import SettingsPage from "./pages/SettingsPage";
import AIAssistant from "./pages/AIAssistant";
import NotePad from "./pages/NotePad";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  const [unlocked, setUnlocked] = useState(() => {
    return sessionStorage.getItem("clinic-unlocked") === "true";
  });

  const handleUnlock = () => {
    sessionStorage.setItem("clinic-unlocked", "true");
    setUnlocked(true);
  };

  if (!unlocked) {
    return (
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <PinLock onUnlock={handleUnlock} />
        </TooltipProvider>
      </QueryClientProvider>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route element={<AppLayout />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/pacientes" element={<Patients />} />
              <Route path="/pacientes/:id" element={<PatientProfile />} />
              <Route path="/agenda" element={<Agenda />} />
              <Route path="/receituario" element={<Prescriptions />} />
              <Route path="/atestados" element={<Certificates />} />
              <Route path="/odontograma" element={<OdontogramPage />} />
              <Route path="/financeiro" element={<Financial />} />
              <Route path="/materiais" element={<Materials />} />
              <Route path="/assistente-ia" element={<AIAssistant />} />
              <Route path="/notas" element={<NotePad />} />
              <Route path="/configuracoes" element={<SettingsPage />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
