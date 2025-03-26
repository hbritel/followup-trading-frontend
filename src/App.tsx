import React, { Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/components/providers/auth-provider";
import { LoadingFallback } from "@/components/loading-fallback";
import {
  Index,
  Login,
  Signup,
  ResetPassword,
  MFA,
  MFASetup,
} from "@/pages/auth";
import {
  Dashboard,
  Trades,
  DailyJournal,
  Calendar,
  Activity,
  Playbook,
  Insights,
  Performance,
  Statistics,
  Watchlists,
  Accounts,
  AccountManagement,
  Settings,
  TrustedDevices,
  Reports,
  Backtesting,
  TradeReplay,
} from "@/pages";
import { Administration } from "@/pages/Administration";
import { NotFound } from "@/pages/not-found";
import { ProtectedRoute } from "@/components/protected-route";

function App() {
  return (
    <div className="min-h-screen">
      <Suspense fallback={<LoadingFallback />}>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/mfa" element={<MFA />} />
            <Route path="/mfa-setup" element={<MFASetup />} />
            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/trades" element={<Trades />} />
              <Route path="/daily-journal" element={<DailyJournal />} />
              <Route path="/calendar" element={<Calendar />} />
              <Route path="/activity" element={<Activity />} />
              <Route path="/playbook" element={<Playbook />} />
              <Route path="/insights" element={<Insights />} />
              <Route path="/performance" element={<Performance />} />
              <Route path="/statistics" element={<Statistics />} />
              <Route path="/watchlists" element={<Watchlists />} />
              <Route path="/accounts" element={<Accounts />} />
              <Route path="/account-management" element={<AccountManagement />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/trusted-devices" element={<TrustedDevices />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/backtesting" element={<Backtesting />} />
              <Route path="/trade-replay" element={<TradeReplay />} />
              <Route path="/administration" element={<Administration />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </Suspense>
      <Toaster />
    </div>
  );
}

export default App;
