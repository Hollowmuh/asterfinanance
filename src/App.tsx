import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "./components/layout/Layout";
import UserDashboard from "./pages/UserDashboard";
import Deposit from "./pages/Deposit";
import Index from "./pages/Index";
import PartnerDashboard from "./pages/PartnerDashboard";
import { UserSettings } from "@/components/users/UserSettings";
import { PartnerList } from "./components/users/PartnerList";
import { PartnerSettings } from "@/components/partners/PartnerSettings";
import { InvestmentManager } from "./components/partners/partnerinvestment";
import { UserMatchList } from "./components/partners/UserMatchList";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <div className="w-screen overflow-x-hidden"> {/* Prevent horizontal overflow */}
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            {/* User Routes */}
            <Route path="/user/*" element={<Layout userType="user" />}>
              <Route path="dashboard" element={<UserDashboard />} />
              <Route path="partner-list" element={<PartnerList />} />
              <Route path="deposit" element={<Deposit />} />
              <Route path="settings" element={<UserSettings />} />
            </Route>

            {/* Partner Routes */}
            <Route path="/partner/*" element={<Layout userType="partner" />}>
              <Route path="investments" element={<InvestmentManager />} />
              <Route path="dashboard" element={<PartnerDashboard />} />
              <Route path="user-List" element={<UserMatchList />} />
              <Route path="settings" element={<PartnerSettings />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </div>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;