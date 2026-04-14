import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, ExternalLink, Loader2, RefreshCw } from 'lucide-react';
import {
  useMyPublicProfile,
  useCreateProfile,
  useUpdateProfile,
  useRefreshMetrics,
} from '@/hooks/usePublicProfile';
import { formatDistanceToNow } from 'date-fns';

const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,20}$/;
const BIO_MAX_LENGTH = 280;

const PublicProfileSettings: React.FC = () => {
  const { t } = useTranslation();
  const { data: profile, isLoading } = useMyPublicProfile();
  const createMutation = useCreateProfile();
  const updateMutation = useUpdateProfile();
  const refreshMutation = useRefreshMetrics();

  const profileExists = profile !== null && profile !== undefined;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!profileExists) {
    return <CreateProfileForm onSubmit={createMutation.mutate} isPending={createMutation.isPending} />;
  }

  return (
    <EditProfileForm
      profile={profile}
      onUpdate={updateMutation.mutate}
      onRefresh={() => refreshMutation.mutate()}
      isUpdating={updateMutation.isPending}
      isRefreshing={refreshMutation.isPending}
    />
  );
};

/* ------------------------------------------------------------------ */
/*  Create Profile Form                                                */
/* ------------------------------------------------------------------ */

interface CreateProfileFormProps {
  readonly onSubmit: (data: { username: string; bio?: string }) => void;
  readonly isPending: boolean;
}

const CreateProfileForm: React.FC<CreateProfileFormProps> = ({ onSubmit, isPending }) => {
  const { t } = useTranslation();
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [usernameError, setUsernameError] = useState<string | null>(null);

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setUsername(value);
    if (value && !USERNAME_REGEX.test(value)) {
      setUsernameError(t('profile.usernameHint'));
    } else {
      setUsernameError(null);
    }
  };

  const handleSubmit = () => {
    if (!username || !USERNAME_REGEX.test(username)) {
      setUsernameError(t('profile.usernameHint'));
      return;
    }
    const trimmedBio = bio.trim();
    onSubmit({ username, bio: trimmedBio || undefined });
  };

  return (
    <div className="space-y-5">
      <h3 className="text-base font-semibold">
        {t('profile.createPublicProfile')}
      </h3>

      <div className="space-y-1.5">
        <Label htmlFor="create-username" className="text-sm font-medium">
          {t('profile.username')}
        </Label>
        <Input
          id="create-username"
          value={username}
          onChange={handleUsernameChange}
          placeholder="e.g. elite_trader"
          maxLength={20}
          className={usernameError ? 'border-destructive' : ''}
        />
        {usernameError ? (
          <p className="text-xs text-destructive">{usernameError}</p>
        ) : (
          <p className="text-xs text-muted-foreground">{t('profile.usernameHint')}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="create-bio" className="text-sm font-medium">
          {t('profile.bio')}
        </Label>
        <Textarea
          id="create-bio"
          value={bio}
          onChange={(e) => setBio(e.target.value.slice(0, BIO_MAX_LENGTH))}
          placeholder={t('profile.bioHint')}
          rows={3}
          maxLength={BIO_MAX_LENGTH}
        />
        <p className="text-xs text-muted-foreground text-right">
          {bio.length}/{BIO_MAX_LENGTH}
        </p>
      </div>

      <Button
        onClick={handleSubmit}
        disabled={isPending || !username || !!usernameError}
        size="sm"
      >
        {isPending && <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />}
        {t('profile.createProfile')}
      </Button>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  Edit Profile Form                                                  */
/* ------------------------------------------------------------------ */

interface VerifiedProfile {
  readonly username: string;
  readonly bio?: string;
  readonly isVerified: boolean;
  readonly showRealPnl: boolean;
  readonly showSymbols: boolean;
  readonly showStrategies: boolean;
  readonly showEquityCurve: boolean;
  readonly lastVerifiedAt?: string;
}

interface EditProfileFormProps {
  readonly profile: VerifiedProfile;
  readonly onUpdate: (data: {
    bio?: string;
    showRealPnl?: boolean;
    showSymbols?: boolean;
    showStrategies?: boolean;
    showEquityCurve?: boolean;
  }) => void;
  readonly onRefresh: () => void;
  readonly isUpdating: boolean;
  readonly isRefreshing: boolean;
}

const EditProfileForm: React.FC<EditProfileFormProps> = ({
  profile,
  onUpdate,
  onRefresh,
  isUpdating,
  isRefreshing,
}) => {
  const { t } = useTranslation();
  const [bio, setBio] = useState(profile.bio ?? '');
  const [showRealPnl, setShowRealPnl] = useState(profile.showRealPnl);
  const [showSymbols, setShowSymbols] = useState(profile.showSymbols);
  const [showStrategies, setShowStrategies] = useState(profile.showStrategies);
  const [showEquityCurve, setShowEquityCurve] = useState(profile.showEquityCurve);

  const handleSave = () => {
    const trimmedBio = bio.trim();
    onUpdate({
      bio: trimmedBio || undefined,
      showRealPnl,
      showSymbols,
      showStrategies,
      showEquityCurve,
    });
  };

  const profileUrl = `/trader/${profile.username}`;

  return (
    <div className="space-y-6">
      {/* Username (read-only) */}
      <div className="space-y-1.5">
        <Label className="text-sm font-medium">{t('profile.username')}</Label>
        <div className="flex items-center gap-2">
          <span className="text-sm font-mono bg-muted/50 px-3 py-1.5 rounded-md">
            {profile.username}
          </span>
          <a
            href={profileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
          >
            <ExternalLink className="h-3 w-3" />
            {t('profile.viewProfile')}
          </a>
        </div>
      </div>

      {/* Verification status */}
      <div>
        {profile.isVerified ? (
          <Badge variant="default" className="bg-emerald-500/15 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/20">
            <CheckCircle className="h-3 w-3 mr-1" />
            {t('profile.verified')}
          </Badge>
        ) : (
          <p className="text-sm text-muted-foreground">
            {t('profile.notVerified')}
          </p>
        )}
      </div>

      {/* Bio */}
      <div className="space-y-1.5">
        <Label htmlFor="edit-bio" className="text-sm font-medium">
          {t('profile.bio')}
        </Label>
        <Textarea
          id="edit-bio"
          value={bio}
          onChange={(e) => setBio(e.target.value.slice(0, BIO_MAX_LENGTH))}
          placeholder={t('profile.bioHint')}
          rows={3}
          maxLength={BIO_MAX_LENGTH}
        />
        <p className="text-xs text-muted-foreground text-right">
          {bio.length}/{BIO_MAX_LENGTH}
        </p>
      </div>

      {/* Privacy toggles */}
      <div className="space-y-1">
        <h4 className="text-sm font-semibold">{t('profile.privacySettings')}</h4>
        <div className="space-y-4 pt-2">
          <PrivacyToggle
            id="show-real-pnl"
            label={t('profile.showRealPnl')}
            description={t('profile.showRealPnlDesc')}
            checked={showRealPnl}
            onCheckedChange={setShowRealPnl}
          />
          <PrivacyToggle
            id="show-symbols"
            label={t('profile.showSymbols')}
            description={t('profile.showSymbolsDesc')}
            checked={showSymbols}
            onCheckedChange={setShowSymbols}
          />
          <PrivacyToggle
            id="show-strategies"
            label={t('profile.showStrategies')}
            description={t('profile.showStrategiesDesc')}
            checked={showStrategies}
            onCheckedChange={setShowStrategies}
          />
          <PrivacyToggle
            id="show-equity-curve"
            label={t('profile.showEquityCurve')}
            description={t('profile.showEquityCurveDesc')}
            checked={showEquityCurve}
            onCheckedChange={setShowEquityCurve}
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-3 pt-1">
        <Button onClick={handleSave} disabled={isUpdating} size="sm">
          {isUpdating && <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />}
          {t('profile.saveChanges')}
        </Button>
        <Button
          onClick={onRefresh}
          disabled={isRefreshing}
          variant="outline"
          size="sm"
        >
          {isRefreshing ? (
            <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
          ) : (
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
          )}
          {t('profile.refreshMetrics')}
        </Button>
      </div>

      {/* Last refresh time */}
      {profile.lastVerifiedAt && (
        <p className="text-xs text-muted-foreground">
          {t('profile.lastRefresh')}: {formatDistanceToNow(new Date(profile.lastVerifiedAt), { addSuffix: true })}
        </p>
      )}
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  Privacy Toggle                                                     */
/* ------------------------------------------------------------------ */

interface PrivacyToggleProps {
  readonly id: string;
  readonly label: string;
  readonly description: string;
  readonly checked: boolean;
  readonly onCheckedChange: (checked: boolean) => void;
}

const PrivacyToggle: React.FC<PrivacyToggleProps> = ({
  id,
  label,
  description,
  checked,
  onCheckedChange,
}) => (
  <div className="flex items-center justify-between gap-4">
    <div className="space-y-0.5">
      <Label htmlFor={id} className="text-sm font-medium cursor-pointer">
        {label}
      </Label>
      <p className="text-xs text-muted-foreground">{description}</p>
    </div>
    <Switch id={id} checked={checked} onCheckedChange={onCheckedChange} />
  </div>
);

export default PublicProfileSettings;
