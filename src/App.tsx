
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import Home from "./pages/Home";
import Trades from "./pages/Trades";
import Calendar from "./pages/Calendar";
import Performance from "./pages/Performance";
import Statistics from "./pages/Statistics";
import Reports from "./pages/Reports";
import Accounts from "./pages/Accounts";
import Watchlists from "./pages/Watchlists";
import Activity from "./pages/Activity";
import Settings from "./pages/Settings";
import AccountManagement from "./pages/AccountManagement";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/trades" element={<Trades />} />
          <Route path="/calendar" element={<Calendar />} />
          <Route path="/performance" element={<Performance />} />
          <Route path="/statistics" element={<Statistics />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/accounts" element={<Accounts />} />
          <Route path="/watchlists" element={<Watchlists />} />
          <Route path="/activity" element={<Activity />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/account" element={<AccountManagement />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
