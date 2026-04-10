
import React, { Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import ErrorBoundary from "@/components/ErrorBoundary";
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
  Badges,
  Leaderboard,
  PublicProfile,
  Pricing,
  PaymentSuccess,
  PaymentCanceled,
  TaxReporting,
  SocialFeed,
  Privacy,
  Terms,
  Contact,
  Cookies,
  PropFirmHub,
  PropFirmEvaluationDetail,
  AiCoach,
} from "@/pages";

import { NotFound } from "@/pages/not-found";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { useFingerprint } from '@/hooks/useFingerprint';
import { PreferencesProvider } from '@/contexts/preferences-context';
import { FeatureFlagsProvider } from '@/contexts/feature-flags-context';
import { FeatureGate } from '@/components/guards/FeatureGate';
import { PageFiltersProvider } from '@/contexts/page-filters-context';
import { WebSocketProvider } from '@/providers/WebSocketProvider';
import PlanChangeListener from '@/components/subscription/PlanChangeListener';

function App() {
  useFingerprint();
  return (
    <ErrorBoundary>
      <div className="min-h-screen">
        <Suspense fallback={<LoadingFallback />}>
          <AuthProvider>
            <ThemeProvider>
              <PreferencesProvider>
                <FeatureFlagsProvider>
                <PageFiltersProvider>
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

                  {/* Protected routes — WebSocket is only initialised here, inside
                      AuthProvider, so the STOMP client is created only when the
                      user is authenticated and torn down on logout. */}
                  <Route
                    path="/"
                    element={
                      <WebSocketProvider>
                        <PlanChangeListener />
                        <ProtectedRoute />
                      </WebSocketProvider>
                    }
                  >
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/trades" element={<Trades />} />
                    <Route path="/daily-journal" element={<DailyJournal />} />
                    <Route path="/calendar" element={<Calendar />} />
                    <Route path="/playbook" element={<Playbook />} />
                    <Route path="/insights" element={<Insights />} />
                    <Route path="/performance" element={<Performance />} />
                    <Route path="/statistics" element={<Statistics />} />
                    <Route path="/watchlists" element={<Watchlists />} />
                    <Route path="/accounts" element={<Accounts />} />
                    <Route path="/account-management" element={<AccountManagement />} />
                    <Route path="/settings" element={<Settings />} />
                    <Route path="/profile" element={<Profile />} />
                    <Route path="/reports" element={<FeatureGate featureKey="reports" requiredPlan="STARTER"><Reports /></FeatureGate>} />
                    <Route path="/backtesting" element={<FeatureGate featureKey="backtesting" requiredPlan="PRO"><Backtesting /></FeatureGate>} />
                    <Route path="/trade-replay" element={<FeatureGate featureKey="trade_replay" requiredPlan="PRO"><TradeReplay /></FeatureGate>} />
                    <Route path="/administration" element={<Administration />} />
                    <Route path="/alerts" element={<FeatureGate featureKey="alerts" requiredPlan="STARTER"><Alerts /></FeatureGate>} />
                    <Route path="/risk-metrics" element={<RiskMetrics />} />
                    <Route path="/badges" element={<Badges />} />
                    <Route path="/leaderboard" element={<Leaderboard />} />
                    <Route path="/tax-reporting" element={<FeatureGate featureKey="tax_reporting" requiredPlan="PRO"><TaxReporting /></FeatureGate>} />
                    <Route path="/prop-firm" element={<FeatureGate featureKey="prop_firm" requiredPlan="STARTER"><PropFirmHub /></FeatureGate>} />
                    <Route path="/prop-firm/evaluation/:id" element={<FeatureGate featureKey="prop_firm" requiredPlan="STARTER"><PropFirmEvaluationDetail /></FeatureGate>} />
                    <Route path="/social/feed" element={<FeatureGate featureKey="market_feed" requiredPlan="STARTER"><SocialFeed /></FeatureGate>} />
                    <Route path="/ai-coach" element={<AiCoach />} />

                    {/* Redirect from /account to /profile */}
                    <Route path="/account" element={<Navigate to="/profile" replace />} />
                  </Route>

                  {/* Public routes — no auth required */}
                  <Route path="/payment/success" element={<PaymentSuccess />} />
                  <Route path="/payment/canceled" element={<PaymentCanceled />} />
                  <Route path="/pricing" element={<Pricing />} />
                  <Route path="/p/:username" element={<PublicProfile />} />
                  <Route path="/privacy" element={<Privacy />} />
                  <Route path="/terms" element={<Terms />} />
                  <Route path="/contact" element={<Contact />} />
                  <Route path="/cookies" element={<Cookies />} />

                  <Route path="*" element={<NotFound />} />
                </Routes>
                </PageFiltersProvider>
                </FeatureFlagsProvider>
              </PreferencesProvider>
            </ThemeProvider>
          </AuthProvider>
        </Suspense>
        <Toaster />
        <SonnerToaster position="top-right" richColors closeButton />
      </div>
    </ErrorBoundary>
  );
}

export default App;
