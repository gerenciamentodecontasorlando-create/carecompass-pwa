import { useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { useLocalDataMigration } from "@/hooks/useLocalDataMigration";
import { AppLayout } from "@/components/AppLayout";
import Auth from "./pages/Auth";
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
import AuditLog from "./pages/AuditLog";
import DataImport from "./pages/DataImport";
import NotFound from "./pages/NotFound";
import PinLock from "./pages/PinLock";

const queryClient = new QueryClient();

function AppRoutes() {
  const { user, loading } = useAuth();
  useLocalDataMigration();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Carregando...</div>
      </div>
    );
  }

  if (!user) {
    return <Auth />;
  }

  return (
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
          <Route path="/auditoria" element={<AuditLog />} />
          <Route path="/importar-dados" element={<DataImport />} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

const PIN_SESSION_KEY = "clinicapro-pin-unlocked";

const App = () => {
  const [pinUnlocked, setPinUnlocked] = useState(() => {
    return sessionStorage.getItem(PIN_SESSION_KEY) === "true";
  });

  const handleUnlock = () => {
    sessionStorage.setItem(PIN_SESSION_KEY, "true");
    setPinUnlocked(true);
  };

  if (!pinUnlocked) {
    return <PinLock onUnlock={handleUnlock} />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <AppRoutes />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
