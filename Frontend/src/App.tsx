import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { MainLayout } from "@/components/layout/MainLayout";
import { EntrepriseProvider } from "@/contexts/EntrepriseContext";
import { Loader2 } from "lucide-react";

// Pages
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Clients from "./pages/Clients";
import Clienttest from "./pages/Clienttest";
import ClientDetail from "./pages/ClientDetail";
import ClientVente from "./pages/ClientVente";
import DevisPage from "./pages/DevisPage";
import DevisDetail from "./pages/DevisDetail";
import DevisForm from "./pages/DevisForm";
import FacturesPage from "./pages/FacturesPage";
import FactureDetail from "./pages/FactureDetail";
import FactureForm from "./pages/FactureForm";
import Comptabilite from "./pages/Comptabilite";
import Configuration from "./pages/Configuration";
import NotFound from "./pages/NotFound";

// Client-scoped pages
import ClientDevisDetail from "./pages/clients/ClientDevisDetail";
import ClientFactureDetail from "./pages/clients/ClientFactureDetail";
import ClientDevisForm from "./pages/clients/ClientDevisForm";
import ClientFactureForm from "./pages/clients/ClientFactureForm";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false, // Ne pas refetch au focus
    },
  },
});

// Loading screen
const LoadingScreen = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="text-center space-y-4">
      <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
      <p className="text-muted-foreground">Chargement...</p>
    </div>
  </div>
);

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return <LoadingScreen />; // ← FIX : Afficher un loader au lieu de rediriger
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
};

const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return <LoadingScreen />; // ← FIX : Afficher un loader
  }
  
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return <>{children}</>;
};

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/" element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="comptabilite" element={<Comptabilite />} />
        
        {/* Module Clients */}
        <Route path="clients" element={<Clients />} />
        <Route path="clientstest" element={<Clienttest />} />
        <Route path="clients/:clientId" element={<ClientDetail />} />
        <Route path="clients/:clientId/vente" element={<ClientVente />} />
        
        {/* Routes devis dans contexte client */}
        <Route path="clients/:clientId/devis/nouveau" element={<ClientDevisForm />} />
        <Route path="clients/:clientId/devis/:devisId" element={<ClientDevisDetail />} />
        <Route path="clients/:clientId/devis/:devisId/edit" element={<ClientDevisForm />} />
        <Route path="clients/:clientId/devis/:devisId/facturer" element={<ClientFactureForm />} />
        
        {/* Routes factures dans contexte client */}
        <Route path="clients/:clientId/factures/:factureId" element={<ClientFactureDetail />} />
        <Route path="clients/:clientId/factures/:factureId/edit" element={<ClientFactureForm />} />
        
        {/* Module Devis - indépendant */}
        <Route path="devis" element={<DevisPage />} />
        <Route path="devis/nouveau" element={<DevisForm />} />
        <Route path="devis/:id" element={<DevisDetail />} />
        <Route path="devis/:id/edit" element={<DevisForm />} />
        <Route path="devis/:devisId/facturer" element={<FactureForm />} />
        
        {/* Module Factures - indépendant */}
        <Route path="factures" element={<FacturesPage />} />
        <Route path="factures/:id" element={<FactureDetail />} />
        <Route path="factures/:id/edit" element={<FactureForm />} />
        
        <Route path="configuration" element={<Configuration />} />
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <BrowserRouter> {/* ← FIX : Avant AuthProvider */}
        <AuthProvider>
          <EntrepriseProvider> {/* ← FIX : Après AuthProvider */}
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <AppRoutes />
            </TooltipProvider>
          </EntrepriseProvider>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;