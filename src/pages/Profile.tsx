import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import DashboardLayout from '@/components/layout/DashboardLayout';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/auth-context';
import { usePreferences } from '@/contexts/preferences-context';
import { userService } from '@/services/user.service';
import { useActivity } from '@/hooks/useActivity';
import { formatDistanceToNow } from 'date-fns';
import type { ActivityCategory, ActivityItemDto, UserPreferencesDto } from '@/types/dto';
import {
  ArrowRightLeft,
  LogIn,
  Link2,
  Settings,
  Inbox,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Activity tab sub-components
// ---------------------------------------------------------------------------

const CATEGORY_FILTER_KEYS: { labelKey: string; value: string }[] = [
  { labelKey: 'common.all', value: 'all' },
  { labelKey: 'profile.categoryTrades', value: 'trade' },
  { labelKey: 'profile.categoryLogins', value: 'login' },
  { labelKey: 'profile.categoryBroker', value: 'broker' },
  { labelKey: 'common.settings', value: 'setting' },
];

/** Returns the Tailwind border-color class for the category left-accent. */
const categoryBorderClass = (category: ActivityCategory): string => {
  switch (category) {
    case 'trade':
      return 'border-green-500';
    case 'login':
      return 'border-primary';
    case 'broker':
      return 'border-purple-500';
    case 'setting':
      return 'border-orange-500';
    default:
      return 'border-muted-foreground';
  }
};

/** Returns a lucide-react icon component for the given category. */
const CategoryIcon = ({ category }: { category: ActivityCategory }) => {
  const className = 'h-4 w-4 shrink-0 text-muted-foreground';
  switch (category) {
    case 'trade':
      return <ArrowRightLeft className={className} />;
    case 'login':
      return <LogIn className={className} />;
    case 'broker':
      return <Link2 className={className} />;
    case 'setting':
      return <Settings className={className} />;
    default:
      return <Inbox className={className} />;
  }
};

/** Single activity entry. */
const ActivityEntry = ({ item }: { item: ActivityItemDto }) => {
  const relativeTime = formatDistanceToNow(new Date(item.timestamp), { addSuffix: true });

  return (
    <div className={`border-l-4 ${categoryBorderClass(item.category)} pl-4 py-2`}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <CategoryIcon category={item.category} />
          <span className="font-medium truncate">{item.title}</span>
        </div>
        <Badge variant="outline" className="shrink-0 text-xs whitespace-nowrap">
          {relativeTime}
        </Badge>
      </div>
      {item.description && (
        <p className="text-sm text-muted-foreground mt-1 pl-6">{item.description}</p>
      )}
    </div>
  );
};

/** Skeleton placeholder shown while the activity list is loading. */
const ActivitySkeleton = () => (
  <div className="space-y-4">
    {Array.from({ length: 5 }).map((_, i) => (
      <div key={i} className="border-l-4 border-muted pl-4 py-2 space-y-2">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-5 w-20 rounded-full" />
        </div>
        <Skeleton className="h-3 w-64 ml-6" />
      </div>
    ))}
  </div>
);

/** Empty state when no activity items exist. */
const ActivityEmptyState = () => {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <Inbox className="h-12 w-12 text-muted-foreground/50 mb-4" />
      <h3 className="text-lg font-medium mb-1">{t('profile.noActivity')}</h3>
      <p className="text-sm text-muted-foreground max-w-sm">
        {t('profile.noActivityDescription')}
      </p>
    </div>
  );
};

/** Full Activity tab content with filters, list, and pagination. */
const ActivityTab = () => {
  const { t } = useTranslation();
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [page, setPage] = useState(0);
  const pageSize = 20;

  // Reset to first page when category filter changes
  useEffect(() => {
    setPage(0);
  }, [categoryFilter]);

  const { data, isLoading, isError } = useActivity(page, pageSize, categoryFilter);

  const totalPages = data?.totalPages ?? 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('profile.recentActivity')}</CardTitle>
        <CardDescription>{t('profile.recentActivityDescription')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Category filter buttons */}
        <div className="flex flex-wrap gap-2">
          {CATEGORY_FILTER_KEYS.map((f) => (
            <Button
              key={f.value}
              variant={categoryFilter === f.value ? 'default' : 'outline'}
              size="sm"
              onClick={() => setCategoryFilter(f.value)}
            >
              {t(f.labelKey)}
            </Button>
          ))}
        </div>

        {/* Content */}
        {isLoading ? (
          <ActivitySkeleton />
        ) : isError ? (
          <p className="text-sm text-destructive">
            {t('profile.activityLoadError')}
          </p>
        ) : !data || data.content.length === 0 ? (
          <ActivityEmptyState />
        ) : (
          <>
            <div className="space-y-4">
              {data.content.map((item) => (
                <ActivityEntry key={item.id} item={item} />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-2">
                <p className="text-sm text-muted-foreground">
                  {t('profile.showingActivities', {
                    from: page * pageSize + 1,
                    to: Math.min((page + 1) * pageSize, data.totalElements),
                    total: data.totalElements,
                  })}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page === 0}
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm tabular-nums">
                    {page + 1} / {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages - 1}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

// ---------------------------------------------------------------------------
// Shared select styling class (matches Personal Info tab selects)
// ---------------------------------------------------------------------------
const selectClass =
  'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50';

// ---------------------------------------------------------------------------
// Profile page
// ---------------------------------------------------------------------------

const Profile = () => {
  const { t } = useTranslation();
  const { user, refreshUserProfile } = useAuth();
  const { preferences, refreshPreferences } = usePreferences();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isSavingPrefs, setIsSavingPrefs] = useState(false);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Split fullName into first/last for the form
  const nameParts = (user?.fullName || '').split(' ');
  const initialFirstName = nameParts[0] || '';
  const initialLastName = nameParts.slice(1).join(' ') || '';

  const [firstName, setFirstName] = useState(initialFirstName);
  const [lastName, setLastName] = useState(initialLastName);
  const [phone, setPhone] = useState(user?.phone || '');
  const [tradingBio, setTradingBio] = useState(user?.tradingBio || '');
  const [experienceLevel, setExperienceLevel] = useState(preferences?.experienceLevel || '');
  const [yearsTrading, setYearsTrading] = useState(preferences?.yearsTrading || '');

  // Local state for the Preferences tab form
  const [prefState, setPrefState] = useState<Partial<UserPreferencesDto>>({});

  // Re-sync form when user data loads or changes
  useEffect(() => {
    if (user) {
      const parts = (user.fullName || '').split(' ');
      setFirstName(parts[0] || '');
      setLastName(parts.slice(1).join(' ') || '');
      setPhone(user.phone || '');
      setTradingBio(user.tradingBio || '');
    }
  }, [user]);

  // Re-sync form when preferences load or change
  useEffect(() => {
    if (preferences) {
      setExperienceLevel(preferences.experienceLevel || '');
      setYearsTrading(preferences.yearsTrading || '');
    }
  }, [preferences]);

  // Sync preferences tab local state when preferences load from context
  useEffect(() => {
    if (preferences) {
      setPrefState({ ...preferences });
    }
  }, [preferences]);

  // Helper to update a single preference field in local state
  const updatePref = <K extends keyof UserPreferencesDto>(key: K, value: UserPreferencesDto[K]) => {
    setPrefState((prev) => ({ ...prev, [key]: value }));
  };

  // Save handler for the Preferences tab
  const handleSavePreferences = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingPrefs(true);
    try {
      const { updatedAt, ...prefsToSave } = prefState as UserPreferencesDto;
      await userService.updateUserPreferences(prefsToSave);
      await refreshPreferences();
      toast({
        title: t('profile.preferencesSaved'),
        description: t('profile.preferencesSavedDescription'),
      });
    } catch {
      toast({
        title: t('profile.saveFailed'),
        description: t('profile.savePreferencesFailedDescription'),
        variant: 'destructive',
      });
    } finally {
      setIsSavingPrefs(false);
    }
  };

  const getInitials = () => {
    const f = firstName || user?.fullName?.charAt(0) || user?.username?.charAt(0) || '';
    const l = lastName?.charAt(0) || '';
    return (f.charAt(0) + l).toUpperCase() || '?';
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Client-side validation
    if (!file.type.startsWith('image/')) {
      toast({ title: t('profile.invalidFile'), description: t('profile.invalidFileDescription'), variant: 'destructive' });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: t('profile.fileTooLarge'), description: t('profile.fileTooLargeDescription'), variant: 'destructive' });
      return;
    }

    setIsUploadingAvatar(true);
    try {
      await userService.uploadAvatar(file);
      await refreshUserProfile();
      toast({ title: t('profile.avatarUpdated'), description: t('profile.avatarUpdatedDescription') });
    } catch {
      toast({ title: t('profile.uploadFailed'), description: t('profile.uploadFailedDescription'), variant: 'destructive' });
    } finally {
      setIsUploadingAvatar(false);
      // Reset file input so same file can be re-selected
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const fullName = [firstName.trim(), lastName.trim()].filter(Boolean).join(' ') || undefined;

      // Update profile fields
      await userService.updateProfile({
        fullName,
        phone: phone || undefined,
        tradingBio: tradingBio || undefined,
      });

      // Update experience preferences directly via API
      // (avoids stale closure in savePreferences when called right after setPreference)
      const currentPrefs = preferences || {};
      const { updatedAt, ...prefsToSave } = currentPrefs;
      await userService.updateUserPreferences({
        ...prefsToSave,
        experienceLevel: experienceLevel || undefined,
        yearsTrading: yearsTrading || undefined,
      });

      // Refresh both user profile and preferences context
      await Promise.all([refreshUserProfile(), refreshPreferences()]);

      toast({
        title: t('profile.profileUpdated'),
        description: t('profile.profileUpdatedDescription'),
      });
    } catch {
      toast({
        title: t('profile.updateFailed'),
        description: t('profile.updateFailedDescription'),
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DashboardLayout pageTitle={t('common.profile')}>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">{t('profile.myProfile')}</h1>
            <p className="text-muted-foreground">{t('profile.manageProfile')}</p>
          </div>
        </div>

        <Tabs defaultValue="info" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="info">{t('profile.personalInfo')}</TabsTrigger>
            <TabsTrigger value="activity">{t('profile.activity')}</TabsTrigger>
            <TabsTrigger value="preferences">{t('profile.preferences')}</TabsTrigger>
          </TabsList>

          <TabsContent value="info" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>{t('profile.personalInformation')}</CardTitle>
                <CardDescription>{t('profile.updatePersonalDetails')}</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="flex flex-col gap-6 sm:flex-row">
                    <div className="flex flex-col items-center gap-4">
                      <Avatar className="h-24 w-24">
                        <AvatarImage src={user?.profilePictureUrl || ''} />
                        <AvatarFallback className="text-xl">{getInitials()}</AvatarFallback>
                      </Avatar>
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
                        type="button"
                        onClick={handleAvatarClick}
                        disabled={isUploadingAvatar}
                      >
                        {isUploadingAvatar ? t('profile.uploading') : t('profile.changeAvatar')}
                      </Button>
                    </div>

                    <div className="flex-1 space-y-4">
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="first-name">{t('common.firstName')}</Label>
                          <Input
                            id="first-name"
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="last-name">{t('common.lastName')}</Label>
                          <Input
                            id="last-name"
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="display-name">{t('profile.displayName')}</Label>
                        <Input id="display-name" value={user?.username || ''} disabled />
                        <p className="text-sm text-muted-foreground">
                          {t('profile.displayNameHint')}
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="email">{t('common.email')}</Label>
                        <Input id="email" value={user?.email || ''} disabled />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="phone">{t('profile.phoneNumber')}</Label>
                        <Input
                          id="phone"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="+1 (555) 123-4567"
                        />
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">{t('profile.aboutMe')}</h3>
                    <div className="space-y-2">
                      <Label htmlFor="bio">{t('profile.tradingBio')}</Label>
                      <Textarea
                        id="bio"
                        placeholder={t('profile.tradingBioPlaceholder')}
                        value={tradingBio}
                        onChange={(e) => setTradingBio(e.target.value)}
                        className="min-h-24"
                      />
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">{t('profile.tradingExperience')}</h3>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="experience">{t('profile.experienceLevel')}</Label>
                        <select
                          id="experience"
                          className={selectClass}
                          value={experienceLevel}
                          onChange={(e) => setExperienceLevel(e.target.value)}
                        >
                          <option value="">{t('profile.selectLevel')}</option>
                          <option value="beginner">{t('profile.beginner')}</option>
                          <option value="intermediate">{t('profile.intermediate')}</option>
                          <option value="advanced">{t('profile.advanced')}</option>
                          <option value="professional">{t('profile.professional')}</option>
                        </select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="years-trading">{t('profile.yearsTrading')}</Label>
                        <select
                          id="years-trading"
                          className={selectClass}
                          value={yearsTrading}
                          onChange={(e) => setYearsTrading(e.target.value)}
                        >
                          <option value="">{t('profile.selectRange')}</option>
                          <option value="<1">{t('profile.lessThan1Year')}</option>
                          <option value="1-3">{t('profile.years1to3')}</option>
                          <option value="3-5">{t('profile.years3to5')}</option>
                          <option value="5-10">{t('profile.years5to10')}</option>
                          <option value=">10">{t('profile.moreThan10Years')}</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? t('profile.saving') : t('common.saveChanges')}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="activity" className="space-y-6">
            <ActivityTab />
          </TabsContent>

          <TabsContent value="preferences" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>{t('profile.userPreferences')}</CardTitle>
                <CardDescription>{t('profile.customizeExperience')}</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSavePreferences} className="space-y-6">
                  {/* ---- Section 1: Notifications ---- */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">{t('profile.notifications')}</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="pref-email-notifications">{t('profile.emailNotifications')}</Label>
                        <Switch
                          id="pref-email-notifications"
                          checked={!!prefState.emailNotificationsEnabled}
                          onCheckedChange={(val) => updatePref('emailNotificationsEnabled', val)}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="pref-mobile-push">{t('profile.pushNotificationsMobile')}</Label>
                        <Switch
                          id="pref-mobile-push"
                          checked={!!prefState.mobilePushNotificationsEnabled}
                          onCheckedChange={(val) => updatePref('mobilePushNotificationsEnabled', val)}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="pref-browser-push">{t('profile.browserNotifications')}</Label>
                        <Switch
                          id="pref-browser-push"
                          checked={!!prefState.browserPushNotificationsEnabled}
                          onCheckedChange={(val) => updatePref('browserPushNotificationsEnabled', val)}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="pref-price-alerts">{t('profile.priceAlerts')}</Label>
                        <Switch
                          id="pref-price-alerts"
                          checked={!!prefState.priceAlertsEnabled}
                          onCheckedChange={(val) => updatePref('priceAlertsEnabled', val)}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="pref-trade-confirmations">{t('profile.tradeConfirmations')}</Label>
                        <Switch
                          id="pref-trade-confirmations"
                          checked={!!prefState.tradeConfirmationsEnabled}
                          onCheckedChange={(val) => updatePref('tradeConfirmationsEnabled', val)}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="pref-news-alerts">{t('profile.newsAlerts')}</Label>
                        <Switch
                          id="pref-news-alerts"
                          checked={!!prefState.newsAlertsEnabled}
                          onCheckedChange={(val) => updatePref('newsAlertsEnabled', val)}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="pref-earnings">{t('profile.earningsAnnouncements')}</Label>
                        <Switch
                          id="pref-earnings"
                          checked={!!prefState.earningsAnnouncementsEnabled}
                          onCheckedChange={(val) => updatePref('earningsAnnouncementsEnabled', val)}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="pref-account-activity">{t('profile.accountActivity')}</Label>
                        <Switch
                          id="pref-account-activity"
                          checked={!!prefState.accountActivityNotificationsEnabled}
                          onCheckedChange={(val) => updatePref('accountActivityNotificationsEnabled', val)}
                        />
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* ---- Section 2: Trading Defaults ---- */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">{t('profile.tradingDefaults')}</h3>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="pref-default-currency">{t('profile.defaultCurrency')}</Label>
                        <select
                          id="pref-default-currency"
                          className={selectClass}
                          value={prefState.defaultCurrency || ''}
                          onChange={(e) => updatePref('defaultCurrency', e.target.value || null)}
                        >
                          <option value="">{t('profile.selectCurrency')}</option>
                          <option value="USD">{t('profile.currencyUSD')}</option>
                          <option value="EUR">{t('profile.currencyEUR')}</option>
                          <option value="GBP">{t('profile.currencyGBP')}</option>
                          <option value="JPY">{t('profile.currencyJPY')}</option>
                          <option value="CHF">{t('profile.currencyCHF')}</option>
                          <option value="AUD">{t('profile.currencyAUD')}</option>
                          <option value="CAD">{t('profile.currencyCAD')}</option>
                        </select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="pref-default-date-range">{t('profile.defaultDateRange')}</Label>
                        <select
                          id="pref-default-date-range"
                          className={selectClass}
                          value={prefState.defaultDateRange || ''}
                          onChange={(e) => updatePref('defaultDateRange', e.target.value || null)}
                        >
                          <option value="">{t('profile.selectRange')}</option>
                          <option value="1d">{t('profile.dateRange1d')}</option>
                          <option value="1w">{t('profile.dateRange1w')}</option>
                          <option value="1m">{t('profile.dateRange1m')}</option>
                          <option value="3m">{t('profile.dateRange3m')}</option>
                          <option value="ytd">{t('profile.dateRangeYtd')}</option>
                          <option value="1y">{t('profile.dateRange1y')}</option>
                          <option value="all">{t('common.allTime')}</option>
                        </select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="pref-report-frequency">{t('profile.reportFrequency')}</Label>
                        <select
                          id="pref-report-frequency"
                          className={selectClass}
                          value={prefState.performanceReportFrequency || ''}
                          onChange={(e) => updatePref('performanceReportFrequency', e.target.value || null)}
                        >
                          <option value="">{t('common.none')}</option>
                          <option value="DAILY">{t('profile.daily')}</option>
                          <option value="WEEKLY">{t('profile.weekly')}</option>
                          <option value="MONTHLY">{t('profile.monthly')}</option>
                        </select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="pref-date-format">{t('profile.dateFormat')}</Label>
                        <select
                          id="pref-date-format"
                          className={selectClass}
                          value={prefState.dateFormat || ''}
                          onChange={(e) => updatePref('dateFormat', e.target.value || null)}
                        >
                          <option value="">{t('profile.default')}</option>
                          <option value="MM/dd/yyyy">MM/DD/YYYY</option>
                          <option value="dd/MM/yyyy">DD/MM/YYYY</option>
                          <option value="yyyy-MM-dd">YYYY-MM-DD</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* ---- Section 3: Display Preferences ---- */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">{t('profile.displayPreferences')}</h3>
                    <div className="space-y-2">
                      <Label htmlFor="pref-font-size">{t('profile.fontSize')}</Label>
                      <select
                        id="pref-font-size"
                        className={selectClass}
                        value={prefState.fontSize || ''}
                        onChange={(e) => updatePref('fontSize', e.target.value || null)}
                      >
                        <option value="">{t('profile.default')}</option>
                        <option value="small">{t('profile.fontSmall')}</option>
                        <option value="medium">{t('profile.fontMedium')}</option>
                        <option value="large">{t('profile.fontLarge')}</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <Label>{t('profile.accentColor')}</Label>
                      <div className="flex flex-wrap gap-3">
                        {[
                          { value: 'blue', labelKey: 'profile.colorBlue', bg: 'bg-blue-500' },
                          { value: 'green', labelKey: 'profile.colorGreen', bg: 'bg-green-500' },
                          { value: 'purple', labelKey: 'profile.colorPurple', bg: 'bg-purple-500' },
                          { value: 'orange', labelKey: 'profile.colorOrange', bg: 'bg-orange-500' },
                          { value: 'red', labelKey: 'profile.colorRed', bg: 'bg-red-500' },
                        ].map((color) => (
                          <button
                            key={color.value}
                            type="button"
                            className={`flex items-center gap-2 rounded-md border px-3 py-2 text-sm transition-colors ${
                              (prefState.accentColor || 'blue') === color.value
                                ? 'border-primary bg-accent font-medium'
                                : 'border-input hover:bg-accent/50'
                            }`}
                            onClick={() => updatePref('accentColor', color.value)}
                          >
                            <span className={`inline-block h-4 w-4 rounded-full ${color.bg}`} />
                            {t(color.labelKey)}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* ---- Section 4: Chart Preferences ---- */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">{t('profile.chartPreferences')}</h3>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="pref-chart-style">{t('profile.defaultChartStyle')}</Label>
                        <select
                          id="pref-chart-style"
                          className={selectClass}
                          value={prefState.defaultChartStyle || ''}
                          onChange={(e) => updatePref('defaultChartStyle', e.target.value || null)}
                        >
                          <option value="">{t('profile.default')}</option>
                          <option value="candle">{t('profile.chartCandlestick')}</option>
                          <option value="bar">{t('profile.chartBar')}</option>
                          <option value="line">{t('profile.chartLine')}</option>
                          <option value="area">{t('profile.chartArea')}</option>
                        </select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="pref-chart-interval">{t('profile.defaultChartInterval')}</Label>
                        <select
                          id="pref-chart-interval"
                          className={selectClass}
                          value={prefState.defaultChartInterval || ''}
                          onChange={(e) => updatePref('defaultChartInterval', e.target.value || null)}
                        >
                          <option value="">{t('profile.default')}</option>
                          <option value="1">{t('profile.interval1min')}</option>
                          <option value="5">{t('profile.interval5min')}</option>
                          <option value="15">{t('profile.interval15min')}</option>
                          <option value="60">{t('profile.interval1hour')}</option>
                          <option value="D">{t('profile.intervalDaily')}</option>
                          <option value="W">{t('profile.intervalWeekly')}</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="pref-show-volume">{t('profile.showVolume')}</Label>
                        <Switch
                          id="pref-show-volume"
                          checked={!!prefState.showChartVolume}
                          onCheckedChange={(val) => updatePref('showChartVolume', val)}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="pref-extended-hours">{t('profile.showExtendedHours')}</Label>
                        <Switch
                          id="pref-extended-hours"
                          checked={!!prefState.showExtendedHours}
                          onCheckedChange={(val) => updatePref('showExtendedHours', val)}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button type="submit" disabled={isSavingPrefs}>
                      {isSavingPrefs ? t('profile.saving') : t('profile.savePreferences')}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default Profile;
