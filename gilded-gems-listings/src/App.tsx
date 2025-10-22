import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import PropertyDetail from "./pages/PropertyDetail";
import PropertyDetailEnhanced from "./pages/PropertyDetailEnhanced";
import Admin from "./pages/Admin";
import AdminEdit from "./pages/AdminEdit";
import AdminPropertyDetail from "./pages/AdminPropertyDetail";
import InterestForm from "./pages/InterestForm";
import UploadDocuments from "./pages/UploadDocuments";
import AgentPackage from "./pages/AgentPackage";
import TenantPropertyView from "./pages/TenantPropertyView";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/admin/edit/:id" element={<AdminEdit />} />
          <Route path="/admin/view/:id" element={<AdminPropertyDetail />} />
          <Route path="/interest-form" element={<InterestForm />} />
          <Route path="/upload-documents" element={<UploadDocuments />} />
          <Route path="/agent-package/:id" element={<AgentPackage />} />
          <Route path="/tenant/property/:id" element={<TenantPropertyView />} />
          <Route path="/property/sky-tower-penthouse" element={<PropertyDetailEnhanced />} />
          <Route path="/property/:id" element={<PropertyDetail />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
