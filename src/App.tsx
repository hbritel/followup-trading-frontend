
import React, { Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/components/providers/auth-provider";
import { ThemeProvider } from "@/components/providers/theme-provider";
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
  Administration,
  Profile,
  Alerts,
  RiskMetrics,
  HomePage,
} from "@/pages";

import { NotFound } from "@/pages/not-found";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { useFingerprint } from '@/hooks/useFingerprint';
import { PreferencesProvider } from '@/contexts/preferences-context';

function App() {
  useFingerprint();
  return (
    <div className="min-h-screen">
      <Suspense fallback={<LoadingFallback />}>
        <AuthProvider>
          <ThemeProvider>
            <PreferencesProvider>
              <Routes>
                {/* Make the homepage the root route */}
                <Route path="/" element={<HomePage />} />
                <Route path="/auth" element={<Index />} />

                {/* Auth routes with correct paths */}
                <Route path="/auth/login" element={<Login />} />
                <Route path="/auth/signup" element={<Signup />} />
                <Route path="/auth/reset-password" element={<ResetPassword />} />
                <Route path="/auth/mfa" element={<MFA />} />
                <Route path="/auth/mfa-setup" element={<MFASetup />} />
                <Route path="/auth/trusted-devices" element={<TrustedDevices />} />

                {/* Protected routes */}
                <Route path="/" element={<ProtectedRoute />}>
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
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/reports" element={<Reports />} />
                  <Route path="/backtesting" element={<Backtesting />} />
                  <Route path="/trade-replay" element={<TradeReplay />} />
                  <Route path="/administration" element={<Administration />} />
                  <Route path="/alerts" element={<Alerts />} />
                  <Route path="/risk-metrics" element={<RiskMetrics />} />

                  {/* Redirect from /account to /profile */}
                  <Route path="/account" element={<Navigate to="/profile" replace />} />
                </Route>

                <Route path="*" element={<NotFound />} />
              </Routes>
            </PreferencesProvider>
          </ThemeProvider>
        </AuthProvider>
      </Suspense>
      <Toaster />
    </div>
  );
}

export default App;
