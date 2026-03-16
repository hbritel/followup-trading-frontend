import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useGamificationProfile, useUpdatePublicProfile, useRecentBadges } from '@/hooks/useGamification';
import ProfileCard from './ProfileCard';

const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,20}$/;

const PublicProfileSettings: React.FC = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { data: profile, isLoading } = useGamificationProfile();
  const { data: recentBadges } = useRecentBadges();
  const { mutate: updateProfile, isPending } = useUpdatePublicProfile();

  const [isPublic, setIsPublic] = useState(false);
  const [username, setUsername] = useState('');
  const [usernameError, setUsernameError] = useState<string | null>(null);

  useEffect(() => {
    if (profile) {
      setIsPublic(profile.publicProfile);
      setUsername(profile.username ?? '');
    }
  }, [profile]);

  const validateUsername = (value: string) => {
    if (isPublic && !value) {
      setUsernameError(t('common.requiredField'));
      return false;
    }
    if (value && !USERNAME_REGEX.test(value)) {
      setUsernameError('3-20 characters, letters, numbers and underscores only');
      return false;
    }
    setUsernameError(null);
    return true;
  };

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUsername(e.target.value);
    validateUsername(e.target.value);
  };

  const handleSave = () => {
    if (!validateUsername(username)) return;
    updateProfile(
      { publicProfile: isPublic, username: username || null },
      {
        onSuccess: () => {
          toast({ title: t('common.success'), description: 'Profile settings saved.' });
        },
        onError: () => {
          toast({ title: t('common.error'), variant: 'destructive' });
        },
      },
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Toggle */}
      <div className="flex items-center justify-between">
        <div>
          <Label htmlFor="public-profile-toggle" className="text-sm font-medium">
            {t('gamification.makePublic', 'Make profile public')}
          </Label>
          <p className="text-xs text-muted-foreground mt-0.5">
            Allow others to view your trading stats and badges
          </p>
        </div>
        <Switch
          id="public-profile-toggle"
          checked={isPublic}
          onCheckedChange={(checked) => {
            setIsPublic(checked);
            if (!checked) setUsernameError(null);
          }}
        />
      </div>

      {/* Username */}
      <div className="space-y-1.5">
        <Label htmlFor="public-username" className="text-sm font-medium">
          {t('gamification.username', 'Username')}
        </Label>
        <Input
          id="public-username"
          placeholder="e.g. elite_trader"
          value={username}
          onChange={handleUsernameChange}
          className={usernameError ? 'border-destructive' : ''}
          maxLength={20}
        />
        {usernameError && (
          <p className="text-xs text-destructive">{usernameError}</p>
        )}
        <p className="text-xs text-muted-foreground">
          {window.location.origin}/p/{username || 'your-username'}
        </p>
      </div>

      {/* Save */}
      <Button onClick={handleSave} disabled={isPending || !!usernameError} size="sm">
        {isPending && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />}
        {t('common.saveChanges', 'Save Changes')}
      </Button>

      {/* Profile card preview */}
      {profile && (
        <div className="pt-4 border-t border-white/5">
          <p className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wider">
            Profile Card Preview
          </p>
          <ProfileCard
            profile={{ ...profile, username: username || profile.username }}
            recentBadges={recentBadges}
          />
        </div>
      )}
    </div>
  );
};

export default PublicProfileSettings;
