import { useState, useRef, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
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
  Eye,
  EyeOff,
  Globe,
  Smartphone,
  Laptop,
  Info,
} from 'lucide-react';
import { cn } from '@/lib/utils';
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
  useRevokeAllOtherSessions,
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

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return fmtDateShort(iso);
}

// Detect device type from user agent
function getDeviceIcon(userAgent: string | null) {
  if (!userAgent) return <Globe className="h-4 w-4" />;
  const ua = userAgent.toLowerCase();
  if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
    return <Smartphone className="h-4 w-4" />;
  }
  return <Laptop className="h-4 w-4" />;
}

// Parse user agent to friendly name
function parseUserAgent(userAgent: string | null): string {
  if (!userAgent) return 'Unknown device';
  // Extract browser name
  if (userAgent.includes('Firefox')) return 'Firefox';
  if (userAgent.includes('Edg/')) return 'Edge';
  if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) return 'Chrome';
  if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) return 'Safari';
  if (userAgent.includes('PostmanRuntime')) return 'Postman';
  // Truncate long user agents
  return userAgent.length > 40 ? userAgent.slice(0, 40) + '...' : userAgent;
}

// ── Skeleton helpers ──────────────────────────────────────────────────────────

const ProfileSkeleton = () => (
  <div className="space-y-6">
    <div className="rounded-xl border bg-card p-6 space-y-6 shadow-sm">
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
    </div>
  </div>
);

const SubscriptionSkeleton = () => (
  <div className="space-y-4">
    <div className="rounded-xl border bg-card p-6 space-y-4 shadow-sm">
      <Skeleton className="h-6 w-48 rounded" />
      <Skeleton className="h-4 w-64 rounded" />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-lg border p-4 space-y-2">
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
  const revokeAllOthers = useRevokeAllOtherSessions();

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
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);

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

  const handleRevokeAllOthers = () => {
    revokeAllOthers.mutate(undefined, {
      onSuccess: (data) => toast.success(
        t('accountManagement.allSessionsRevoked', '{{count}} sessions revoked', { count: data.revoked }),
      ),
      onError: (err) => toast.error(getApiErrorMessage(err)),
    });
  };

  const isSavingProfile = updateProfile.isPending || updatePreferences.isPending;
  const otherSessionsCount = sessions?.filter(s => !s.isCurrentSession).length ?? 0;

  return (
    <div className="space-y-6">
      {/* ── Profile Information ───────────────────────────────────── */}
      <section className="rounded-xl border bg-card p-6 space-y-6 shadow-sm">
        <div>
          <h2 className="text-base font-semibold">{t('accountManagement.profileInformation')}</h2>
          <p className="text-sm text-muted-foreground mt-0.5">{t('accountManagement.profileInformationDescription')}</p>
        </div>

        <div className="flex flex-col gap-6 sm:flex-row">
          {/* Avatar */}
          <div className="flex flex-col items-center gap-3 sm:w-32">
            <div className="relative group">
              <Avatar className="h-24 w-24 ring-2 ring-border">
                <AvatarImage src={profile?.profilePictureUrl ?? undefined} />
                <AvatarFallback className="text-xl bg-primary/10 text-primary font-semibold">
                  {profile ? getInitials(profile.fullName, profile.username) : '??'}
                </AvatarFallback>
              </Avatar>
              {uploadAvatar.isPending && (
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
      </section>

      {/* ── Security ──────────────────────────────────────────── */}
      <section className="rounded-xl border bg-card p-6 space-y-6 shadow-sm">
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
              <div className="relative">
                <Input
                  id="current-password"
                  type={showCurrentPw ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  autoComplete="current-password"
                  className="pr-9"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPw(!showCurrentPw)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={showCurrentPw ? 'Hide password' : 'Show password'}
                >
                  {showCurrentPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-password">{t('accountManagement.newPassword', 'New Password')}</Label>
              <div className="relative">
                <Input
                  id="new-password"
                  type={showNewPw ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  autoComplete="new-password"
                  className="pr-9"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPw(!showNewPw)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={showNewPw ? 'Hide password' : 'Show password'}
                >
                  {showNewPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
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
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Monitor className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-sm font-medium">{t('accountManagement.activeSessions', 'Active Sessions')}</h3>
              {sessions && (
                <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                  {sessions.length}
                </Badge>
              )}
            </div>
            {otherSessionsCount > 0 && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1.5 text-destructive hover:text-destructive hover:bg-destructive/10 text-xs"
                    disabled={revokeAllOthers.isPending}
                  >
                    {revokeAllOthers.isPending ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <LogOut className="h-3.5 w-3.5" />
                    )}
                    {t('accountManagement.revokeAllOthers', 'Revoke all others')}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>{t('accountManagement.revokeAllOthersTitle', 'Revoke all other sessions?')}</AlertDialogTitle>
                    <AlertDialogDescription>
                      {t('accountManagement.revokeAllOthersDescription', 'This will log out all other devices ({{count}} sessions). Your current session will not be affected.', { count: otherSessionsCount })}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                    <AlertDialogAction
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      onClick={handleRevokeAllOthers}
                    >
                      {t('accountManagement.revokeAll', 'Revoke all')}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
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
                  className={cn(
                    'flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border p-3.5 transition-colors',
                    session.isCurrentSession
                      ? 'border-primary/30 bg-primary/5'
                      : 'border-border/50',
                  )}
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div className={cn(
                      'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg mt-0.5',
                      session.isCurrentSession
                        ? 'bg-primary/10 text-primary'
                        : 'bg-muted text-muted-foreground',
                    )}>
                      {getDeviceIcon(session.userAgent)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium">
                          {parseUserAgent(session.userAgent)}
                        </span>
                        {session.isCurrentSession && (
                          <Badge className="text-[10px] px-1.5 py-0 bg-primary/20 text-primary border-primary/30">
                            {t('accountManagement.currentSession', 'Current')}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                        {session.ipAddress && (
                          <span>{session.ipAddress}</span>
                        )}
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {timeAgo(session.lastUsedAt)}
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>
                              {t('accountManagement.lastActive', 'Last active')}: {fmtDate(session.lastUsedAt)}
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </div>
                  </div>

                  {!session.isCurrentSession && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="gap-1.5 text-destructive hover:text-destructive hover:bg-destructive/10 shrink-0 h-8"
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
      </section>
    </div>
  );
};

// ── Subscription Tab ──────────────────────────────────────────────────────────

const SubscriptionTab = () => {
  const { t } = useTranslation();
  const { data: subscription, isLoading: subLoading } = useSubscription();
  const { data: plans, isLoading: plansLoading } = usePlans();
  const createPortal = useCreatePortal();
  const [showPlans, setShowPlans] = useState(false);

  const isLoading = subLoading || plansLoading;

  if (isLoading) return <SubscriptionSkeleton />;

  const handleManageSubscription = () => {
    // If Stripe portal is available, redirect there; otherwise show plans inline
    createPortal.mutate(
      { returnUrl: window.location.href },
      {
        onError: () => {
          // Stripe not configured — show plans inline instead
          setShowPlans(true);
        },
      }
    );
  };

  const planDisplayName = subscription?.planDisplayName ?? subscription?.plan ?? 'Free';
  const isFree = (subscription?.plan ?? 'FREE') === 'FREE';
  const statusColor: Record<string, string> = {
    ACTIVE: 'text-emerald-500 border-emerald-500/30 bg-emerald-500/10',
    TRIALING: 'text-primary border-primary/30 bg-primary/10',
    PAST_DUE: 'text-amber-500 border-amber-500/30 bg-amber-500/10',
    CANCELED: 'text-destructive border-destructive/30 bg-destructive/10',
  };
  const badgeClass = statusColor[subscription?.status ?? 'ACTIVE'] ?? statusColor['ACTIVE'];

  // Usage metrics with info tooltips
  const usageMetrics = subscription?.usage ? [
    {
      label: t('accountManagement.connections', 'Connections'),
      info: t('accountManagement.connectionsInfo', 'Number of broker accounts you can connect simultaneously'),
      current: subscription.usage.connectionsUsed ?? 0,
      max: subscription.usage.connectionsMax ?? 0,
    },
    {
      label: t('accountManagement.trades', 'Trades'),
      info: t('accountManagement.tradesInfo', 'Total trades stored in your journal (imported + manual)'),
      current: subscription.usage.tradesUsed ?? 0,
      max: subscription.usage.tradesMax ?? 0,
    },
    {
      label: t('accountManagement.aiMessages', 'AI Messages'),
      info: t('accountManagement.aiMessagesInfo', 'AI-powered trade analysis messages available per day'),
      current: subscription.usage.aiMessagesToday ?? 0,
      max: subscription.usage.aiMessagesMax ?? 0,
      suffix: '/day',
    },
    {
      label: t('accountManagement.alerts', 'Alerts'),
      info: t('accountManagement.alertsInfo', 'Price alerts you can set across all your instruments'),
      current: subscription.usage.alertsUsed ?? 0,
      max: subscription.usage.alertsMax ?? 0,
    },
    {
      label: t('accountManagement.reports', 'Reports'),
      info: t('accountManagement.reportsInfo', 'PDF/CSV performance reports you can generate per month'),
      current: subscription.usage.reportsThisMonth ?? 0,
      max: subscription.usage.reportsMax ?? 0,
      suffix: '/mo',
    },
  ] : [];

  const fmtMax = (max: number) => {
    if (max <= 0) return '0';
    if (max >= 999999) return '\u221E';
    return max.toLocaleString();
  };

  return (
    <div className="space-y-6">
      {/* Current plan card */}
      <section className="rounded-xl border bg-card p-6 space-y-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-base font-semibold">
                {t('accountManagement.currentPlan')}: <span className="text-primary">{planDisplayName}</span>
              </h2>
              {subscription?.status && (
                <Badge variant="outline" className={cn('text-xs', badgeClass)}>
                  {subscription.status}
                </Badge>
              )}
              {subscription?.cancelAtPeriodEnd && (
                <Badge variant="outline" className="text-xs text-amber-500 border-amber-500/30 bg-amber-500/10">
                  {t('accountManagement.cancelAtPeriodEnd', 'Cancels at period end')}
                </Badge>
              )}
            </div>
            {subscription?.currentPeriodEnd && (
              <p className="text-sm text-muted-foreground mt-1.5">
                {subscription.cancelAtPeriodEnd
                  ? `${t('accountManagement.accessUntil', 'Access until')} ${fmtDateShort(subscription.currentPeriodEnd)}`
                  : t('accountManagement.planRenewsOn', { date: fmtDateShort(subscription.currentPeriodEnd) })}
              </p>
            )}
            {subscription?.billingInterval && subscription.billingInterval !== 'MONTHLY' && (
              <p className="text-xs text-muted-foreground mt-0.5">
                {t('accountManagement.billingInterval', 'Billing')}: {subscription.billingInterval.toLowerCase()}
              </p>
            )}
          </div>

          <div className="flex gap-2 shrink-0">
            {isFree ? (
              <Button
                onClick={() => setShowPlans(!showPlans)}
                className="gap-2"
              >
                <CreditCard className="h-4 w-4" />
                {showPlans
                  ? t('accountManagement.hidePlans', 'Hide Plans')
                  : t('accountManagement.upgradePlan', 'Upgrade Plan')}
              </Button>
            ) : (
              <Button
                variant="outline"
                onClick={handleManageSubscription}
                disabled={createPortal.isPending}
                className="gap-2"
              >
                {createPortal.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CreditCard className="h-4 w-4" />
                )}
                {t('accountManagement.manageSubscription', 'Manage Subscription')}
              </Button>
            )}
          </div>
        </div>

        {/* Usage stats with info tooltips */}
        {usageMetrics.length > 0 && (
          <>
            <Separator />
            <div>
              <h3 className="text-sm font-medium mb-3">{t('accountManagement.planLimits', 'Plan Limits')}</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                {usageMetrics.map(({ label, info, current, max, suffix }) => {
                  const pct = max > 0 && max < 999999 ? Math.min((current / max) * 100, 100) : 0;
                  const isNearLimit = pct >= 80;
                  const isOverLimit = current > max && max > 0 && max < 999999;
                  return (
                    <div key={label} className={cn(
                      'rounded-lg border p-3 space-y-2',
                      isOverLimit && 'border-destructive/30 bg-destructive/5',
                    )}>
                      <div className="flex items-center justify-between">
                        <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">{label}</p>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button type="button" className="text-muted-foreground/50 hover:text-muted-foreground transition-colors" aria-label={info}>
                                <Info className="h-3.5 w-3.5" />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="max-w-[200px] text-xs">
                              {info}
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                      <p className={cn(
                        'text-lg font-bold tabular-nums',
                        isOverLimit ? 'text-destructive' : isNearLimit ? 'text-amber-500' : '',
                      )}>
                        {current.toLocaleString()}
                        <span className="text-xs font-normal text-muted-foreground">
                          /{fmtMax(max)}{suffix ?? ''}
                        </span>
                      </p>
                      {max > 0 && max < 999999 && (
                        <div className="w-full h-1 rounded-full bg-muted overflow-hidden">
                          <div
                            className={cn(
                              'h-full rounded-full transition-all',
                              isOverLimit ? 'bg-destructive' : isNearLimit ? 'bg-amber-500' : 'bg-primary',
                            )}
                            style={{ width: `${Math.min(pct, 100)}%` }}
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
      </section>

      {/* Available plans — shown on demand */}
      {showPlans && plans && plans.length > 0 && (
        <section className="rounded-xl border bg-card p-6 space-y-4 shadow-sm animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold">{t('accountManagement.availablePlans', 'Available Plans')}</h2>
            <Button variant="ghost" size="sm" onClick={() => setShowPlans(false)} className="text-xs text-muted-foreground">
              {t('common.close', 'Close')}
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            {t('accountManagement.availablePlansDesc', 'Compare plans and choose the one that fits your trading needs. Upgrade or downgrade anytime.')}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {plans.map((plan) => {
              const isCurrent = plan.name === subscription?.plan;
              const isPopular = plan.name === 'PRO';
              const isElite = plan.name === 'ELITE';
              const isStarter = plan.name === 'STARTER';
              return (
                <div
                  key={plan.name}
                  className={cn(
                    'relative rounded-xl border p-5 space-y-3 transition-colors flex flex-col',
                    isCurrent
                      ? 'border-primary/40 bg-primary/5'
                      : isPopular
                        ? 'border-primary/20'
                        : isElite
                          ? 'border-amber-500/30'
                          : isStarter
                            ? 'border-blue-500/20'
                            : 'border-border/50 hover:border-border',
                  )}
                >
                  {isPopular && !isCurrent && (
                    <Badge className="absolute -top-2.5 left-1/2 -translate-x-1/2 text-[10px] bg-primary text-primary-foreground">
                      {t('accountManagement.popular', 'Popular')}
                    </Badge>
                  )}
                  {isStarter && !isCurrent && (
                    <Badge className="absolute -top-2.5 left-1/2 -translate-x-1/2 text-[10px] bg-blue-500 text-white">
                      {t('accountManagement.bestValue', 'Best Value')}
                    </Badge>
                  )}
                  <div className="flex items-center justify-between">
                    <p className={cn(
                      'font-semibold',
                      isElite && 'text-amber-500',
                      isStarter && 'text-blue-400',
                    )}>{plan.displayName}</p>
                    {isCurrent && (
                      <Badge className="text-[10px] bg-primary/20 text-primary border-primary/30">
                        {t('accountManagement.currentPlanLabel')}
                      </Badge>
                    )}
                  </div>
                  <div>
                    <span className="text-2xl font-bold tabular-nums">${plan.monthlyPriceUsd}</span>
                    <span className="text-sm text-muted-foreground">/{t('accountManagement.month')}</span>
                    {plan.annualMonthlyPriceUsd > 0 && plan.annualMonthlyPriceUsd < plan.monthlyPriceUsd && (
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        ${plan.annualMonthlyPriceUsd}/{t('accountManagement.month')} {t('accountManagement.billedAnnually', 'billed annually')}
                      </p>
                    )}
                  </div>
                  <ul className="space-y-1.5 flex-1">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2 text-xs text-muted-foreground">
                        <CheckCircle className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-auto pt-3">
                    {!isCurrent ? (
                      <Button
                        variant={isPopular ? 'default' : 'outline'}
                        size="sm"
                        className="w-full"
                        onClick={handleManageSubscription}
                        disabled={createPortal.isPending}
                      >
                        {Number(plan.monthlyPriceUsd) < Number(subscription?.monthlyPriceUsd ?? 0)
                          ? t('accountManagement.downgradeTo', 'Downgrade')
                          : t('accountManagement.upgradeTo', 'Upgrade')}
                      </Button>
                    ) : (
                      <div className="h-8" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
};

// ── API Access Tab ────────────────────────────────────────────────────────────

const ApiAccessTab = () => {
  const { t } = useTranslation();
  return (
    <div className="space-y-6">
      <section className="rounded-xl border bg-card p-6 space-y-5 shadow-sm">
        <div className="flex items-center gap-3">
          <h2 className="text-base font-semibold">{t('accountManagement.apiAccess')}</h2>
          <Badge variant="outline" className="gap-1.5 text-xs text-amber-500 border-amber-500/30 bg-amber-500/10">
            <Construction className="h-3 w-3" />
            {t('accountManagement.comingSoon', 'Coming Soon')}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">{t('accountManagement.apiAccessDescription')}</p>

        <div className="rounded-xl border border-dashed p-8 text-center space-y-3">
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
                <div className="h-1.5 w-1.5 rounded-full bg-primary/40 shrink-0" />
                {feature}
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
};

// ── Main Page ─────────────────────────────────────────────────────────────────

const AccountManagement = () => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') === 'subscription' ? 'subscription' : 'profile';

  return (
    <DashboardLayout pageTitle={t('pages.accountManagement')}>
      <PageTransition className="space-y-6">

        {/* Page Header */}
        <div>
          <h1 className="text-2xl font-bold">{t('pages.accountManagement')}</h1>
          <p className="text-sm text-muted-foreground">
            {t('accountManagement.pageDescription', 'Manage your profile, subscription, and security settings.')}
          </p>
        </div>

        <Tabs defaultValue={initialTab} className="space-y-6">
          <TabsList>
            <TabsTrigger value="profile" className="gap-2">
              <User className="h-4 w-4" />
              {t('common.profile')}
            </TabsTrigger>
            <TabsTrigger value="subscription" className="gap-2">
              <CreditCard className="h-4 w-4" />
              {t('accountManagement.subscription')}
            </TabsTrigger>
            {/* TODO: Re-enable API Access tab when API key management is implemented */}
            {/* <TabsTrigger value="api" className="gap-2">
              <Key className="h-4 w-4" />
              {t('accountManagement.apiAccess')}
            </TabsTrigger> */}
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
