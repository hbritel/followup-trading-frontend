import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import DashboardLayout from '@/components/layout/DashboardLayout';
import PageTransition from '@/components/ui/page-transition';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  User,
  Lock,
  Monitor,
  CreditCard,
  Key,
  Loader2,
  Camera,
  Trash2,
  Shield,
  CheckCircle,
  Clock,
  LogOut,
  Construction,
} from 'lucide-react';
import {
  useUserProfile,
  useUpdateProfile,
  useUploadAvatar,
  useDeleteAvatar,
  useUserPreferences,
  useUpdatePreferences,
  useChangePassword,
  useUserSessions,
  useRevokeSession,
} from '@/hooks/useUser';
import {
  useSubscription,
  usePlans,
  useCreatePortal,
} from '@/hooks/useSubscription';
import { getApiErrorMessage } from '@/services/apiClient';

// ── Helpers ───────────────────────────────────────────────────────────────────

function getInitials(fullName: string | null, username: string): string {
  if (fullName) {
    const parts = fullName.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return fullName.slice(0, 2).toUpperCase();
  }
  return username.slice(0, 2).toUpperCase();
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function fmtDateShort(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

// ── Skeleton helpers ──────────────────────────────────────────────────────────

const ProfileSkeleton = () => (
  <div className="space-y-6">
    <div className="glass-card rounded-2xl p-6 space-y-6">
      <div className="flex flex-col gap-6 sm:flex-row">
        <div className="flex flex-col items-center gap-4">
          <Skeleton className="h-24 w-24 rounded-full" />
          <Skeleton className="h-8 w-28 rounded-lg" />
        </div>
        <div className="flex-1 space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Skeleton className="h-10 w-full rounded-lg" />
            <Skeleton className="h-10 w-full rounded-lg" />
          </div>
          <Skeleton className="h-10 w-full rounded-lg" />
          <Skeleton className="h-10 w-full rounded-lg" />
        </div>
      </div>
      <Separator />
      <div className="space-y-3">
        <Skeleton className="h-5 w-32 rounded" />
        <Skeleton className="h-24 w-full rounded-lg" />
      </div>
      <Separator />
      <div className="space-y-3">
        <Skeleton className="h-5 w-40 rounded" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Skeleton className="h-10 w-full rounded-lg" />
          <Skeleton className="h-10 w-full rounded-lg" />
        </div>
      </div>
    </div>
  </div>
);

const SubscriptionSkeleton = () => (
  <div className="space-y-4">
    <div className="glass-card rounded-2xl p-6 space-y-4">
      <Skeleton className="h-6 w-48 rounded" />
      <Skeleton className="h-4 w-64 rounded" />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="glass-card rounded-xl p-4 space-y-2">
            <Skeleton className="h-4 w-20 rounded" />
            <Skeleton className="h-7 w-12 rounded" />
            <Skeleton className="h-3 w-16 rounded" />
          </div>
        ))}
      </div>
    </div>
  </div>
);

// ── Profile Tab ───────────────────────────────────────────────────────────────

const ProfileTab = () => {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: profile, isLoading: profileLoading } = useUserProfile();
  const { data: prefs, isLoading: prefsLoading } = useUserPreferences();
  const updateProfile = useUpdateProfile();
  const uploadAvatar = useUploadAvatar();
  const deleteAvatar = useDeleteAvatar();
  const updatePreferences = useUpdatePreferences();
  const changePassword = useChangePassword();
  const { data: sessions, isLoading: sessionsLoading } = useUserSessions();
  const revokeSession = useRevokeSession();

  // Profile form state
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [tradingBio, setTradingBio] = useState('');

  // Experience state
  const [experienceLevel, setExperienceLevel] = useState('');
  const [yearsTrading, setYearsTrading] = useState('');

  // Password form state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Sync form state from loaded data
  useEffect(() => {
    if (profile) {
      setFullName(profile.fullName ?? '');
      setPhone(profile.phone ?? '');
      setTradingBio(profile.tradingBio ?? '');
    }
  }, [profile]);

  useEffect(() => {
    if (prefs) {
      setExperienceLevel(prefs.experienceLevel ?? '');
      setYearsTrading(prefs.yearsTrading ?? '');
    }
  }, [prefs]);

  const isLoading = profileLoading || prefsLoading;

  if (isLoading) return <ProfileSkeleton />;

  // Handlers
  const handleSaveProfile = () => {
    if (!fullName.trim()) {
      toast.error(t('accountManagement.fullNameRequired', 'Full name is required'));
      return;
    }
    updateProfile.mutate(
      { fullName: fullName.trim(), phone: phone.trim() || undefined, tradingBio: tradingBio.trim() || undefined },
      {
        onSuccess: () => {
          // Also save experience prefs if changed
          if (
            experienceLevel !== (prefs?.experienceLevel ?? '') ||
            yearsTrading !== (prefs?.yearsTrading ?? '')
          ) {
            updatePreferences.mutate(
              { experienceLevel: experienceLevel || undefined, yearsTrading: yearsTrading || undefined },
              {
                onSuccess: () => toast.success(t('accountManagement.profileSaved', 'Profile saved successfully')),
                onError: (err) => toast.error(getApiErrorMessage(err)),
              }
            );
          } else {
            toast.success(t('accountManagement.profileSaved', 'Profile saved successfully'));
          }
        },
        onError: (err) => toast.error(getApiErrorMessage(err)),
      }
    );
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    uploadAvatar.mutate(file, {
      onSuccess: () => toast.success(t('accountManagement.avatarUpdated', 'Avatar updated')),
      onError: (err) => toast.error(getApiErrorMessage(err)),
    });
    // Reset so the same file can be re-selected
    e.target.value = '';
  };

  const handleDeleteAvatar = () => {
    deleteAvatar.mutate(undefined, {
      onSuccess: () => toast.success(t('accountManagement.avatarRemoved', 'Avatar removed')),
      onError: (err) => toast.error(getApiErrorMessage(err)),
    });
  };

  const handleChangePassword = () => {
    if (!currentPassword || !newPassword) {
      toast.error(t('accountManagement.passwordFieldsRequired', 'Please fill in all password fields'));
      return;
    }
    if (newPassword.length < 8) {
      toast.error(t('accountManagement.passwordTooShort', 'New password must be at least 8 characters'));
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error(t('accountManagement.passwordMismatch', 'New passwords do not match'));
      return;
    }
    changePassword.mutate(
      { currentPassword, newPassword },
      {
        onSuccess: () => {
          toast.success(t('accountManagement.passwordChanged', 'Password changed successfully'));
          setCurrentPassword('');
          setNewPassword('');
          setConfirmPassword('');
        },
        onError: (err) => toast.error(getApiErrorMessage(err)),
      }
    );
  };

  const handleRevokeSession = (sessionId: string) => {
    revokeSession.mutate(sessionId, {
      onSuccess: () => toast.success(t('accountManagement.sessionRevoked', 'Session revoked')),
      onError: (err) => toast.error(getApiErrorMessage(err)),
    });
  };

  const isSavingProfile = updateProfile.isPending || updatePreferences.isPending;

  return (
    <div className="space-y-6">
      {/* Profile Information */}
      <div className="glass-card rounded-2xl p-6 space-y-6">
        <div>
          <h2 className="text-base font-semibold">{t('accountManagement.profileInformation')}</h2>
          <p className="text-sm text-muted-foreground mt-0.5">{t('accountManagement.profileInformationDescription')}</p>
        </div>

        <div className="flex flex-col gap-6 sm:flex-row">
          {/* Avatar section */}
          <div className="flex flex-col items-center gap-3 sm:w-32">
            <div className="relative group">
              <Avatar className="h-24 w-24 ring-2 ring-border">
                <AvatarImage src={profile?.profilePictureUrl ?? undefined} />
                <AvatarFallback className="text-xl bg-primary/10 text-primary font-semibold">
                  {profile ? getInitials(profile.fullName, profile.username) : '??'}
                </AvatarFallback>
              </Avatar>
              {(uploadAvatar.isPending) && (
                <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40">
                  <Loader2 className="h-5 w-5 animate-spin text-white" />
                </div>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
            />
            <Button
              variant="outline"
              size="sm"
              className="w-full gap-1.5"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadAvatar.isPending}
            >
              <Camera className="h-3.5 w-3.5" />
              {t('accountManagement.changeAvatar')}
            </Button>
            {profile?.profilePictureUrl && (
              <Button
                variant="ghost"
                size="sm"
                className="w-full gap-1.5 text-destructive hover:text-destructive"
                onClick={handleDeleteAvatar}
                disabled={deleteAvatar.isPending}
              >
                {deleteAvatar.isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Trash2 className="h-3.5 w-3.5" />
                )}
                {t('accountManagement.removeAvatar', 'Remove')}
              </Button>
            )}
          </div>

          {/* Fields */}
          <div className="flex-1 space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="fullName">{t('accountManagement.fullName', 'Full Name')}</Label>
                <Input
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Jane Doe"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="username">{t('common.username', 'Username')}</Label>
                <Input
                  id="username"
                  value={profile?.username ?? ''}
                  disabled
                  className="opacity-60"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">{t('common.email')}</Label>
              <Input
                id="email"
                value={profile?.email ?? ''}
                disabled
                className="opacity-60"
              />
              <p className="text-xs text-muted-foreground">{t('accountManagement.emailReadOnly', 'Email cannot be changed here.')}</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">{t('accountManagement.phoneNumber')}</Label>
              <Input
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 (555) 000-0000"
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* Trading Bio */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium">{t('accountManagement.accountBio')}</h3>
          <div className="space-y-2">
            <Label htmlFor="bio">{t('accountManagement.tradingBio')}</Label>
            <Textarea
              id="bio"
              placeholder={t('accountManagement.tradingBioPlaceholder')}
              value={tradingBio}
              onChange={(e) => setTradingBio(e.target.value)}
              className="min-h-24 resize-none"
            />
          </div>
        </div>

        <Separator />

        {/* Trading Experience */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium">{t('accountManagement.tradingExperience')}</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>{t('accountManagement.experienceLevel')}</Label>
              <Select value={experienceLevel} onValueChange={setExperienceLevel}>
                <SelectTrigger>
                  <SelectValue placeholder={t('accountManagement.selectExperience', 'Select level')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">{t('accountManagement.beginner')}</SelectItem>
                  <SelectItem value="intermediate">{t('accountManagement.intermediate')}</SelectItem>
                  <SelectItem value="advanced">{t('accountManagement.advanced')}</SelectItem>
                  <SelectItem value="professional">{t('accountManagement.professional')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{t('accountManagement.yearsTrading')}</Label>
              <Select value={yearsTrading} onValueChange={setYearsTrading}>
                <SelectTrigger>
                  <SelectValue placeholder={t('accountManagement.selectYears', 'Select years')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="<1">{t('accountManagement.lessThan1Year')}</SelectItem>
                  <SelectItem value="1-3">{t('accountManagement.oneToThreeYears')}</SelectItem>
                  <SelectItem value="3-5">{t('accountManagement.threeToFiveYears')}</SelectItem>
                  <SelectItem value="5-10">{t('accountManagement.fiveToTenYears')}</SelectItem>
                  <SelectItem value=">10">{t('accountManagement.moreThan10Years')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={handleSaveProfile} disabled={isSavingProfile} className="gap-2">
            {isSavingProfile && <Loader2 className="h-4 w-4 animate-spin" />}
            {t('common.saveChanges')}
          </Button>
        </div>
      </div>

      {/* Security Section */}
      <div className="glass-card rounded-2xl p-6 space-y-6">
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-primary" />
          <h2 className="text-base font-semibold">{t('accountManagement.security', 'Security')}</h2>
        </div>

        {/* Change Password */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Lock className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-medium">{t('accountManagement.changePassword', 'Change Password')}</h3>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="current-password">{t('accountManagement.currentPassword', 'Current Password')}</Label>
              <Input
                id="current-password"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                autoComplete="current-password"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-password">{t('accountManagement.newPassword', 'New Password')}</Label>
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                autoComplete="new-password"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">{t('accountManagement.confirmPassword', 'Confirm Password')}</Label>
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
              />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">{t('accountManagement.passwordMinLength', 'Minimum 8 characters.')}</p>

          <div className="flex justify-end">
            <Button
              variant="outline"
              onClick={handleChangePassword}
              disabled={changePassword.isPending}
              className="gap-2"
            >
              {changePassword.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              {t('accountManagement.updatePassword', 'Update Password')}
            </Button>
          </div>
        </div>

        <Separator />

        {/* Active Sessions */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Monitor className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-medium">{t('accountManagement.activeSessions', 'Active Sessions')}</h3>
          </div>

          {sessionsLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full rounded-xl" />
              ))}
            </div>
          ) : !sessions || sessions.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              {t('accountManagement.noSessions', 'No active sessions found.')}
            </p>
          ) : (
            <div className="space-y-2">
              {sessions.map((session) => (
                <div
                  key={session.id}
                  className={[
                    'flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border p-4 transition-colors',
                    session.isCurrentSession
                      ? 'border-primary/30 bg-primary/5'
                      : 'border-border/50 bg-white/[0.02]',
                  ].join(' ')}
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="flex-shrink-0 mt-0.5">
                      {session.isCurrentSession ? (
                        <CheckCircle className="h-4 w-4 text-primary" />
                      ) : (
                        <Clock className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium truncate max-w-[260px]">
                          {session.userAgent ?? t('accountManagement.unknownDevice', 'Unknown device')}
                        </span>
                        {session.isCurrentSession && (
                          <Badge className="text-xs px-1.5 py-0 bg-primary/20 text-primary border-primary/30">
                            {t('accountManagement.currentSession', 'Current')}
                          </Badge>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5 space-y-0.5">
                        {session.ipAddress && (
                          <p>{t('accountManagement.ipAddress', 'IP')}: {session.ipAddress}</p>
                        )}
                        <p>
                          {t('accountManagement.lastActive', 'Last active')}: {fmtDate(session.lastUsedAt)}
                        </p>
                        <p>
                          {t('accountManagement.sessionExpires', 'Expires')}: {fmtDateShort(session.expiresAt)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {!session.isCurrentSession && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="gap-1.5 text-destructive hover:text-destructive hover:bg-destructive/10 flex-shrink-0"
                      onClick={() => handleRevokeSession(session.id)}
                      disabled={revokeSession.isPending}
                    >
                      {revokeSession.isPending ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <LogOut className="h-3.5 w-3.5" />
                      )}
                      {t('accountManagement.revokeSession', 'Revoke')}
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ── Subscription Tab ──────────────────────────────────────────────────────────

const PLAN_FEATURES: Record<string, string[]> = {
  FREE: ['5 broker connections', '500 trades/month', '10 AI messages/day', '5 alerts', '2 reports/month'],
  PRO: ['Unlimited broker connections', 'Unlimited trades', '100 AI messages/day', 'Unlimited alerts', '20 reports/month'],
  ENTERPRISE: ['Everything in Pro', 'Priority support', 'Custom integrations', 'Team access'],
};

const SubscriptionTab = () => {
  const { t } = useTranslation();
  const { data: subscription, isLoading: subLoading } = useSubscription();
  const { data: plans, isLoading: plansLoading } = usePlans();
  const createPortal = useCreatePortal();

  const isLoading = subLoading || plansLoading;

  if (isLoading) return <SubscriptionSkeleton />;

  const handleManageSubscription = () => {
    createPortal.mutate(
      { returnUrl: window.location.href },
      {
        onError: (err) => toast.error(getApiErrorMessage(err)),
      }
    );
  };

  const planDisplayName = subscription?.plan ?? 'FREE';
  const statusColor: Record<string, string> = {
    ACTIVE: 'text-profit border-profit/30 bg-profit/10',
    TRIALING: 'text-primary border-primary/30 bg-primary/10',
    PAST_DUE: 'text-amber-400 border-amber-400/30 bg-amber-400/10',
    CANCELED: 'text-loss border-loss/30 bg-loss/10',
  };
  const badgeClass = statusColor[subscription?.status ?? 'ACTIVE'] ?? statusColor['ACTIVE'];

  return (
    <div className="space-y-6">
      {/* Current plan card */}
      <div className="glass-card rounded-2xl p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-base font-semibold">
                {t('accountManagement.currentPlan')}: <span className="text-gradient">{planDisplayName}</span>
              </h2>
              {subscription?.status && (
                <Badge variant="outline" className={`text-xs ${badgeClass}`}>
                  {subscription.status}
                </Badge>
              )}
              {subscription?.cancelAtPeriodEnd && (
                <Badge variant="outline" className="text-xs text-amber-400 border-amber-400/30 bg-amber-400/10">
                  {t('accountManagement.cancelAtPeriodEnd', 'Cancels at period end')}
                </Badge>
              )}
            </div>
            {subscription?.currentPeriodEnd && (
              <p className="text-sm text-muted-foreground mt-1.5">
                {subscription.cancelAtPeriodEnd
                  ? t('accountManagement.accessUntil', 'Access until')
                  : t('accountManagement.planRenewsOn', { date: fmtDateShort(subscription.currentPeriodEnd) })}
                {subscription.cancelAtPeriodEnd ? ` ${fmtDateShort(subscription.currentPeriodEnd)}` : ''}
              </p>
            )}
            {subscription?.billingInterval && (
              <p className="text-xs text-muted-foreground mt-0.5">
                {t('accountManagement.billingInterval', 'Billing')}: {subscription.billingInterval.toLowerCase()}
              </p>
            )}
          </div>

          <Button
            variant="outline"
            onClick={handleManageSubscription}
            disabled={createPortal.isPending}
            className="gap-2 flex-shrink-0"
          >
            {createPortal.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CreditCard className="h-4 w-4" />
            )}
            {t('accountManagement.manageSubscription', 'Manage Subscription')}
          </Button>
        </div>

        {/* Usage stats */}
        {subscription?.usage && (
          <>
            <Separator />
            <div>
              <h3 className="text-sm font-medium mb-3">{t('accountManagement.usageLimits', 'Usage')}</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                {[
                  {
                    label: t('accountManagement.connections', 'Connections'),
                    current: subscription.usage.connections.current,
                    max: subscription.usage.connections.max,
                  },
                  {
                    label: t('accountManagement.trades', 'Trades'),
                    current: subscription.usage.trades.current,
                    max: subscription.usage.trades.max,
                  },
                  {
                    label: t('accountManagement.aiMessages', 'AI Messages'),
                    current: subscription.usage.aiMessages.today,
                    max: subscription.usage.aiMessages.max,
                    suffix: '/day',
                  },
                  {
                    label: t('accountManagement.alerts', 'Alerts'),
                    current: subscription.usage.alerts.current,
                    max: subscription.usage.alerts.max,
                  },
                  {
                    label: t('accountManagement.reports', 'Reports'),
                    current: subscription.usage.reports.thisMonth,
                    max: subscription.usage.reports.max,
                    suffix: '/mo',
                  },
                ].map(({ label, current, max, suffix }) => {
                  const pct = max > 0 ? Math.min((current / max) * 100, 100) : 0;
                  const isNearLimit = pct >= 80;
                  return (
                    <div key={label} className="glass-card rounded-xl p-3 space-y-2">
                      <p className="label-caps text-muted-foreground text-xs">{label}</p>
                      <p className={`text-lg font-bold tabular-nums ${isNearLimit ? 'text-amber-400' : ''}`}>
                        {current.toLocaleString()}
                        <span className="text-xs font-normal text-muted-foreground">
                          /{max === -1 ? '∞' : max.toLocaleString()}{suffix ?? ''}
                        </span>
                      </p>
                      {max > 0 && (
                        <div className="w-full h-1 rounded-full bg-border/50 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${isNearLimit ? 'bg-amber-400' : 'bg-primary'}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Available plans */}
      {plans && plans.length > 0 && (
        <div className="glass-card rounded-2xl p-6 space-y-4">
          <h2 className="text-base font-semibold">{t('accountManagement.availablePlans', 'Available Plans')}</h2>
          <p className="text-sm text-muted-foreground">
            {t('accountManagement.availablePlansDesc', 'Use "Manage Subscription" above to upgrade, downgrade, or cancel via the billing portal.')}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {plans.map((plan) => {
              const isCurrent = plan.name === subscription?.plan;
              const features = PLAN_FEATURES[plan.name] ?? plan.features;
              return (
                <div
                  key={plan.name}
                  className={[
                    'rounded-xl border p-4 space-y-3 transition-colors',
                    isCurrent
                      ? 'border-primary/40 bg-primary/5'
                      : 'border-border/50',
                  ].join(' ')}
                >
                  <div className="flex items-center justify-between">
                    <p className="font-semibold">{plan.displayName}</p>
                    {isCurrent && (
                      <Badge className="text-xs bg-primary/20 text-primary border-primary/30">
                        {t('accountManagement.currentPlanLabel')}
                      </Badge>
                    )}
                  </div>
                  <div>
                    <span className="text-2xl font-bold tabular-nums">${plan.monthlyPrice}</span>
                    <span className="text-sm text-muted-foreground">/{t('accountManagement.month')}</span>
                  </div>
                  <ul className="space-y-1.5">
                    {features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2 text-xs text-muted-foreground">
                        <CheckCircle className="h-3.5 w-3.5 text-primary flex-shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

// ── API Access Tab ────────────────────────────────────────────────────────────

const ApiAccessTab = () => {
  const { t } = useTranslation();
  return (
    <div className="space-y-6">
      <div className="glass-card rounded-2xl p-6 space-y-5">
        <div className="flex items-center gap-3">
          <h2 className="text-base font-semibold">{t('accountManagement.apiAccess')}</h2>
          <Badge variant="outline" className="gap-1.5 text-xs text-amber-400 border-amber-400/30 bg-amber-400/10">
            <Construction className="h-3 w-3" />
            {t('accountManagement.comingSoon', 'Coming Soon')}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">{t('accountManagement.apiAccessDescription')}</p>

        <div className="rounded-xl border border-dashed border-border/60 bg-white/[0.02] p-8 text-center space-y-3">
          <div className="flex justify-center">
            <div className="h-12 w-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
              <Key className="h-6 w-6 text-primary" />
            </div>
          </div>
          <p className="font-medium">{t('accountManagement.apiKeys')}</p>
          <p className="text-sm text-muted-foreground max-w-xs mx-auto">
            {t('accountManagement.apiKeysComingSoonDesc', 'API key management is not yet available. Check back soon for programmatic access to your trading data.')}
          </p>
        </div>

        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground">{t('accountManagement.plannedFeatures', 'Planned features')}</h3>
          <ul className="space-y-2">
            {[
              t('accountManagement.apiFeature1', 'Generate and revoke API keys'),
              t('accountManagement.apiFeature2', 'IP allowlist for API access'),
              t('accountManagement.apiFeature3', 'Per-key rate limits and scopes'),
              t('accountManagement.apiFeature4', 'Request logs and usage analytics'),
            ].map((feature) => (
              <li key={feature} className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="h-1.5 w-1.5 rounded-full bg-primary/40 flex-shrink-0" />
                {feature}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

// ── Main Page ─────────────────────────────────────────────────────────────────

const AccountManagement = () => {
  const { t } = useTranslation();

  return (
    <DashboardLayout pageTitle={t('pages.accountManagement')}>
      <PageTransition className="space-y-6">

        {/* Page Header */}
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
            <User className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gradient">{t('pages.accountManagement')}</h1>
            <p className="text-sm text-muted-foreground">
              {t('accountManagement.pageDescription', 'Manage your profile, subscription, and security settings.')}
            </p>
          </div>
        </div>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList>
            <TabsTrigger value="profile" className="gap-2">
              <User className="h-4 w-4" />
              {t('common.profile')}
            </TabsTrigger>
            <TabsTrigger value="subscription" className="gap-2">
              <CreditCard className="h-4 w-4" />
              {t('accountManagement.subscription')}
            </TabsTrigger>
            <TabsTrigger value="api" className="gap-2">
              <Key className="h-4 w-4" />
              {t('accountManagement.apiAccess')}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <ProfileTab />
          </TabsContent>

          <TabsContent value="subscription">
            <SubscriptionTab />
          </TabsContent>

          <TabsContent value="api">
            <ApiAccessTab />
          </TabsContent>
        </Tabs>

      </PageTransition>
    </DashboardLayout>
  );
};

export default AccountManagement;
