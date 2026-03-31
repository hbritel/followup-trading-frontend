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
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuth } from '@/contexts/auth-context';
import { usePreferences } from '@/contexts/preferences-context';
import { userService } from '@/services/user.service';
import type { UserPreferencesDto } from '@/types/dto';
import { Camera, Lock } from 'lucide-react';

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

        {/* ------------------------------------------------------------------ */}
        {/* Profile Header                                                      */}
        {/* ------------------------------------------------------------------ */}
        <Card className="glass-card rounded-2xl">
          <CardContent className="pt-6 pb-6">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
              {/* Avatar with camera overlay */}
              <div className="relative shrink-0 group">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={user?.profilePictureUrl || ''} />
                  <AvatarFallback className="text-2xl font-semibold">{getInitials()}</AvatarFallback>
                </Avatar>
                <button
                  type="button"
                  onClick={handleAvatarClick}
                  disabled={isUploadingAvatar}
                  className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity disabled:cursor-not-allowed"
                  aria-label={t('profile.changeAvatar')}
                >
                  <Camera className="h-5 w-5 text-white" />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarChange}
                />
              </div>

              {/* Name, username, email, member since */}
              <div className="flex flex-col items-center sm:items-start gap-1 min-w-0">
                <h1 className="text-2xl font-bold leading-tight truncate">
                  {[firstName, lastName].filter(Boolean).join(' ') || user?.fullName || user?.username || '—'}
                </h1>
                {user?.username && (
                  <Badge variant="secondary" className="w-fit text-sm font-normal">
                    @{user.username}
                  </Badge>
                )}
                {user?.email && (
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                )}
                {isUploadingAvatar && (
                  <p className="text-xs text-muted-foreground animate-pulse">{t('profile.uploading')}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ------------------------------------------------------------------ */}
        {/* Tabs                                                                */}
        {/* ------------------------------------------------------------------ */}
        <Tabs defaultValue="info" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="info">{t('profile.personalInfo')}</TabsTrigger>
            <TabsTrigger value="preferences">{t('profile.preferences')}</TabsTrigger>
          </TabsList>

          {/* ============================================================== */}
          {/* TAB: Personal Info                                               */}
          {/* ============================================================== */}
          <TabsContent value="info" className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-6">

              {/* Card 1 — Personal Details */}
              <Card className="glass-card rounded-2xl">
                <CardHeader>
                  <CardTitle>{t('profile.personalInformation')}</CardTitle>
                  <CardDescription>{t('profile.updatePersonalDetails')}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* First / Last name grid */}
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

                  {/* Phone */}
                  <div className="space-y-2">
                    <Label htmlFor="phone">{t('profile.phoneNumber')}</Label>
                    <Input
                      id="phone"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>

                  {/* Read-only: Display Name */}
                  <div className="space-y-2">
                    <Label htmlFor="display-name" className="flex items-center gap-1.5">
                      {t('profile.displayName')}
                      <Lock className="h-3 w-3 text-muted-foreground" />
                    </Label>
                    <Input
                      id="display-name"
                      value={user?.username || ''}
                      readOnly
                      className="bg-muted/50 cursor-default focus-visible:ring-0 focus-visible:ring-offset-0"
                    />
                    <p className="text-sm text-muted-foreground">
                      {t('profile.displayNameHint')}
                    </p>
                  </div>

                  {/* Read-only: Email */}
                  <div className="space-y-2">
                    <Label htmlFor="email" className="flex items-center gap-1.5">
                      {t('common.email')}
                      <Lock className="h-3 w-3 text-muted-foreground" />
                    </Label>
                    <Input
                      id="email"
                      value={user?.email || ''}
                      readOnly
                      className="bg-muted/50 cursor-default focus-visible:ring-0 focus-visible:ring-offset-0"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Card 2 — About & Experience */}
              <Card className="glass-card rounded-2xl">
                <CardHeader>
                  <CardTitle>{t('profile.aboutMe')}</CardTitle>
                  <CardDescription>{t('profile.tradingExperience')}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Trading bio */}
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

                  {/* Experience level + years trading */}
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="experience">{t('profile.experienceLevel')}</Label>
                      <Select
                        value={experienceLevel}
                        onValueChange={(val) => setExperienceLevel(val === '__none__' ? '' : val)}
                      >
                        <SelectTrigger id="experience">
                          <SelectValue placeholder={t('profile.selectLevel')} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__none__">{t('profile.selectLevel')}</SelectItem>
                          <SelectItem value="beginner">{t('profile.beginner')}</SelectItem>
                          <SelectItem value="intermediate">{t('profile.intermediate')}</SelectItem>
                          <SelectItem value="advanced">{t('profile.advanced')}</SelectItem>
                          <SelectItem value="professional">{t('profile.professional')}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="years-trading">{t('profile.yearsTrading')}</Label>
                      <Select
                        value={yearsTrading}
                        onValueChange={(val) => setYearsTrading(val === '__none__' ? '' : val)}
                      >
                        <SelectTrigger id="years-trading">
                          <SelectValue placeholder={t('profile.selectRange')} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__none__">{t('profile.selectRange')}</SelectItem>
                          <SelectItem value="<1">{t('profile.lessThan1Year')}</SelectItem>
                          <SelectItem value="1-3">{t('profile.years1to3')}</SelectItem>
                          <SelectItem value="3-5">{t('profile.years3to5')}</SelectItem>
                          <SelectItem value="5-10">{t('profile.years5to10')}</SelectItem>
                          <SelectItem value=">10">{t('profile.moreThan10Years')}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-end">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? t('profile.saving') : t('common.saveChanges')}
                </Button>
              </div>
            </form>
          </TabsContent>

          {/* ============================================================== */}
          {/* TAB: Preferences                                                 */}
          {/* ============================================================== */}
          <TabsContent value="preferences" className="space-y-6">
            <form onSubmit={handleSavePreferences} className="space-y-6">

              {/* Card 1 — Trading Defaults */}
              <Card className="glass-card rounded-2xl">
                <CardHeader>
                  <CardTitle>{t('profile.tradingDefaults')}</CardTitle>
                  <CardDescription>{t('profile.tradingDefaultsDesc', 'Default values applied across the platform')}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="pref-default-currency">{t('profile.defaultCurrency')}</Label>
                      <Select
                        value={prefState.defaultCurrency || '__none__'}
                        onValueChange={(val) => updatePref('defaultCurrency', val === '__none__' ? null : val)}
                      >
                        <SelectTrigger id="pref-default-currency">
                          <SelectValue placeholder={t('profile.selectCurrency')} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__none__">{t('profile.selectCurrency')}</SelectItem>
                          <SelectItem value="USD">{t('profile.currencyUSD')}</SelectItem>
                          <SelectItem value="EUR">{t('profile.currencyEUR')}</SelectItem>
                          <SelectItem value="GBP">{t('profile.currencyGBP')}</SelectItem>
                          <SelectItem value="JPY">{t('profile.currencyJPY')}</SelectItem>
                          <SelectItem value="CHF">{t('profile.currencyCHF')}</SelectItem>
                          <SelectItem value="AUD">{t('profile.currencyAUD')}</SelectItem>
                          <SelectItem value="CAD">{t('profile.currencyCAD')}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="pref-default-date-range">{t('profile.defaultDateRange')}</Label>
                      <Select
                        value={prefState.defaultDateRange || '__none__'}
                        onValueChange={(val) => updatePref('defaultDateRange', val === '__none__' ? null : val)}
                      >
                        <SelectTrigger id="pref-default-date-range">
                          <SelectValue placeholder={t('profile.selectRange')} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__none__">{t('profile.selectRange')}</SelectItem>
                          <SelectItem value="1d">{t('profile.dateRange1d')}</SelectItem>
                          <SelectItem value="1w">{t('profile.dateRange1w')}</SelectItem>
                          <SelectItem value="1m">{t('profile.dateRange1m')}</SelectItem>
                          <SelectItem value="3m">{t('profile.dateRange3m')}</SelectItem>
                          <SelectItem value="ytd">{t('profile.dateRangeYtd')}</SelectItem>
                          <SelectItem value="1y">{t('profile.dateRange1y')}</SelectItem>
                          <SelectItem value="all">{t('common.allTime')}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="pref-report-frequency">{t('profile.reportFrequency')}</Label>
                      <Select
                        value={prefState.performanceReportFrequency || '__none__'}
                        onValueChange={(val) => updatePref('performanceReportFrequency', val === '__none__' ? null : val)}
                      >
                        <SelectTrigger id="pref-report-frequency">
                          <SelectValue placeholder={t('common.none')} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__none__">{t('common.none')}</SelectItem>
                          <SelectItem value="DAILY">{t('profile.daily')}</SelectItem>
                          <SelectItem value="WEEKLY">{t('profile.weekly')}</SelectItem>
                          <SelectItem value="MONTHLY">{t('profile.monthly')}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="pref-date-format">{t('profile.dateFormat')}</Label>
                      <Select
                        value={prefState.dateFormat || '__none__'}
                        onValueChange={(val) => updatePref('dateFormat', val === '__none__' ? null : val)}
                      >
                        <SelectTrigger id="pref-date-format">
                          <SelectValue placeholder={t('profile.default')} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__none__">{t('profile.default')}</SelectItem>
                          <SelectItem value="MM/dd/yyyy">MM/DD/YYYY</SelectItem>
                          <SelectItem value="dd/MM/yyyy">DD/MM/YYYY</SelectItem>
                          <SelectItem value="yyyy-MM-dd">YYYY-MM-DD</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Card 3 — Display */}
              <Card className="glass-card rounded-2xl">
                <CardHeader>
                  <CardTitle>{t('profile.displayPreferences')}</CardTitle>
                  <CardDescription>{t('profile.displayPreferencesDesc', 'Customize the look and feel of the interface')}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="pref-font-size">{t('profile.fontSize')}</Label>
                    <Select
                      value={prefState.fontSize || '__none__'}
                      onValueChange={(val) => updatePref('fontSize', val === '__none__' ? null : val)}
                    >
                      <SelectTrigger id="pref-font-size" className="sm:max-w-xs">
                        <SelectValue placeholder={t('profile.default')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">{t('profile.default')}</SelectItem>
                        <SelectItem value="small">{t('profile.fontSmall')}</SelectItem>
                        <SelectItem value="medium">{t('profile.fontMedium')}</SelectItem>
                        <SelectItem value="large">{t('profile.fontLarge')}</SelectItem>
                      </SelectContent>
                    </Select>
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
                      ].map((color) => {
                        const isSelected = (prefState.accentColor || 'blue') === color.value;
                        return (
                          <button
                            key={color.value}
                            type="button"
                            onClick={() => updatePref('accentColor', color.value)}
                            aria-label={t(color.labelKey)}
                            className={`h-8 w-8 rounded-full ${color.bg} transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                              isSelected ? 'ring-2 ring-offset-2 ring-foreground scale-110' : 'hover:scale-105'
                            }`}
                          />
                        );
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Card 4 — Chart Preferences */}
              <Card className="glass-card rounded-2xl">
                <CardHeader>
                  <CardTitle>{t('profile.chartPreferences')}</CardTitle>
                  <CardDescription>{t('profile.chartPreferencesDesc', 'Default chart style and display options')}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="pref-chart-style">{t('profile.defaultChartStyle')}</Label>
                      <Select
                        value={prefState.defaultChartStyle || '__none__'}
                        onValueChange={(val) => updatePref('defaultChartStyle', val === '__none__' ? null : val)}
                      >
                        <SelectTrigger id="pref-chart-style">
                          <SelectValue placeholder={t('profile.default')} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__none__">{t('profile.default')}</SelectItem>
                          <SelectItem value="candle">{t('profile.chartCandlestick')}</SelectItem>
                          <SelectItem value="bar">{t('profile.chartBar')}</SelectItem>
                          <SelectItem value="line">{t('profile.chartLine')}</SelectItem>
                          <SelectItem value="area">{t('profile.chartArea')}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="pref-chart-interval">{t('profile.defaultChartInterval')}</Label>
                      <Select
                        value={prefState.defaultChartInterval || '__none__'}
                        onValueChange={(val) => updatePref('defaultChartInterval', val === '__none__' ? null : val)}
                      >
                        <SelectTrigger id="pref-chart-interval">
                          <SelectValue placeholder={t('profile.default')} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__none__">{t('profile.default')}</SelectItem>
                          <SelectItem value="1">{t('profile.interval1min')}</SelectItem>
                          <SelectItem value="5">{t('profile.interval5min')}</SelectItem>
                          <SelectItem value="15">{t('profile.interval15min')}</SelectItem>
                          <SelectItem value="60">{t('profile.interval1hour')}</SelectItem>
                          <SelectItem value="D">{t('profile.intervalDaily')}</SelectItem>
                          <SelectItem value="W">{t('profile.intervalWeekly')}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between py-3 border-b border-border/50">
                      <div>
                        <Label htmlFor="pref-show-volume">{t('profile.showVolume')}</Label>
                        <p className="text-[13px] text-muted-foreground">{t('profile.showVolumeDesc', 'Display volume bars at the bottom of the chart')}</p>
                      </div>
                      <Switch
                        id="pref-show-volume"
                        checked={!!prefState.showChartVolume}
                        onCheckedChange={(val) => updatePref('showChartVolume', val)}
                      />
                    </div>
                    <div className="flex items-center justify-between py-3 last:border-0">
                      <div>
                        <Label htmlFor="pref-extended-hours">{t('profile.showExtendedHours')}</Label>
                        <p className="text-[13px] text-muted-foreground">{t('profile.extendedHoursDesc', 'Show pre-market and after-hours trading data')}</p>
                      </div>
                      <Switch
                        id="pref-extended-hours"
                        checked={!!prefState.showExtendedHours}
                        onCheckedChange={(val) => updatePref('showExtendedHours', val)}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-end">
                <Button type="submit" disabled={isSavingPrefs}>
                  {isSavingPrefs ? t('profile.saving') : t('profile.savePreferences')}
                </Button>
              </div>
            </form>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default Profile;
