import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Globe,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useUpdatePublicProfile } from '@/hooks/useMentor';
import type {
  MentorInstanceDto,
  UpdatePublicProfileRequestDto,
} from '@/types/dto';

interface Props {
  instance: MentorInstanceDto;
}

const SLUG_RE = /^[a-z0-9](?:[a-z0-9-]{1,58}[a-z0-9])?$/;
const MAX_HEADLINE = 200;
const MAX_BIO = 500;
const MAX_CREDENTIALS = 500;

const toSlug = (input: string): string =>
  input
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);

const PublicProfileSection: React.FC<Props> = ({ instance }) => {
  const { t } = useTranslation();
  const mutation = useUpdatePublicProfile();

  const [open, setOpen] = useState(true);
  const [enabled, setEnabled] = useState(!!instance.publicProfileEnabled);
  const [slug, setSlug] = useState(instance.slug ?? '');
  const [headline, setHeadline] = useState(instance.publicHeadline ?? '');
  const [bio, setBio] = useState(instance.publicBio ?? '');
  const [credentials, setCredentials] = useState(
    instance.publicCredentials ?? ''
  );
  const [yearsTrading, setYearsTrading] = useState<string>(
    instance.publicYearsTrading != null
      ? String(instance.publicYearsTrading)
      : ''
  );

  useEffect(() => {
    setEnabled(!!instance.publicProfileEnabled);
    setSlug(instance.slug ?? '');
    setHeadline(instance.publicHeadline ?? '');
    setBio(instance.publicBio ?? '');
    setCredentials(instance.publicCredentials ?? '');
    setYearsTrading(
      instance.publicYearsTrading != null
        ? String(instance.publicYearsTrading)
        : ''
    );
  }, [instance]);

  // Auto-suggest slug from brandName when empty
  useEffect(() => {
    if (!slug && instance.brandName) {
      setSlug(toSlug(instance.brandName));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [instance.brandName]);

  const slugValid = useMemo(() => {
    if (!slug) return false;
    if (slug.length < 3 || slug.length > 60) return false;
    return SLUG_RE.test(slug);
  }, [slug]);

  const yearsValid =
    yearsTrading === '' ||
    (Number.isFinite(Number(yearsTrading)) && Number(yearsTrading) >= 0);

  const canSave =
    slugValid &&
    yearsValid &&
    headline.length <= MAX_HEADLINE &&
    bio.length <= MAX_BIO &&
    credentials.length <= MAX_CREDENTIALS;

  const publicUrl =
    typeof window !== 'undefined' && slug
      ? `${window.location.origin}/m/${slug}`
      : '';

  const handleSave = () => {
    const payload: UpdatePublicProfileRequestDto = {
      slug,
      headline,
      bio,
      credentials,
      enabled,
    };
    if (yearsTrading !== '') {
      payload.yearsTrading = Number(yearsTrading);
    }
    mutation.mutate(payload);
  };

  return (
    <section
      aria-labelledby="public-profile-heading"
      className="glass-card rounded-2xl p-5 space-y-5"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Globe className="w-4 h-4 text-primary" aria-hidden="true" />
          <h2 id="public-profile-heading" className="text-base font-semibold">
            {t('mentor.publicProfile.title', 'Public profile')}
          </h2>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls="public-profile-body"
          className="gap-1"
        >
          {open ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
          {open ? t('common.collapse', 'Collapse') : t('common.expand', 'Expand')}
        </Button>
      </div>

      {open && (
        <div id="public-profile-body" className="space-y-5">
          <div className="flex items-center justify-between gap-4 rounded-xl bg-muted/30 px-4 py-3 border border-border/30">
            <div className="min-w-0">
              <Label
                htmlFor="publish-public"
                className="cursor-pointer font-medium"
              >
                {t('mentor.publicProfile.publish', 'Publish public profile')}
              </Label>
              <p className="text-xs text-muted-foreground mt-0.5">
                {t(
                  'mentor.publicProfile.publishDesc',
                  'When enabled, your profile is discoverable and can be shared.'
                )}
              </p>
            </div>
            <Switch
              id="publish-public"
              checked={enabled}
              onCheckedChange={setEnabled}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-3 sm:items-end">
            <div className="space-y-2">
              <Label htmlFor="mentor-slug">
                {t('mentor.publicProfile.slug', 'Custom URL')}
              </Label>
              <Input
                id="mentor-slug"
                value={slug}
                onChange={(e) =>
                  setSlug(e.target.value.toLowerCase().slice(0, 60))
                }
                placeholder="my-brand"
                aria-invalid={!slugValid}
                aria-describedby="mentor-slug-help"
              />
              <p
                id="mentor-slug-help"
                className={[
                  'text-xs',
                  slugValid || !slug
                    ? 'text-muted-foreground'
                    : 'text-destructive',
                ].join(' ')}
              >
                {publicUrl || t(
                  'mentor.publicProfile.slugHelper',
                  '3–60 characters, lowercase letters, numbers, hyphens.'
                )}
                {!slugValid && slug && (
                  <>
                    {' · '}
                    {t(
                      'mentor.publicProfile.slugInvalid',
                      'Invalid format'
                    )}
                  </>
                )}
              </p>
            </div>

            {enabled && slug && slugValid && (
              <Button variant="outline" size="sm" asChild className="gap-1.5">
                <Link to={`/m/${slug}`}>
                  <ExternalLink className="w-4 h-4" />
                  {t('mentor.publicProfile.viewPage', 'View public page')}
                </Link>
              </Button>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="mentor-headline">
              {t('mentor.publicProfile.headline', 'Headline')}
            </Label>
            <Input
              id="mentor-headline"
              value={headline}
              onChange={(e) =>
                setHeadline(e.target.value.slice(0, MAX_HEADLINE))
              }
              placeholder={t(
                'mentor.publicProfile.headlinePlaceholder',
                'A one-line pitch that sells your mentorship'
              )}
              maxLength={MAX_HEADLINE}
            />
            <p className="text-[11px] text-muted-foreground text-right tabular-nums">
              {headline.length} / {MAX_HEADLINE}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="mentor-bio">
              {t('mentor.publicProfile.bio', 'Bio')}
            </Label>
            <Textarea
              id="mentor-bio"
              value={bio}
              onChange={(e) => setBio(e.target.value.slice(0, MAX_BIO))}
              rows={4}
              maxLength={MAX_BIO}
              placeholder={t(
                'mentor.publicProfile.bioPlaceholder',
                'Who you are and who you help.'
              )}
            />
            <p className="text-[11px] text-muted-foreground text-right tabular-nums">
              {bio.length} / {MAX_BIO}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="mentor-credentials">
              {t('mentor.publicProfile.credentials', 'Credentials')}
            </Label>
            <Textarea
              id="mentor-credentials"
              value={credentials}
              onChange={(e) =>
                setCredentials(e.target.value.slice(0, MAX_CREDENTIALS))
              }
              rows={3}
              maxLength={MAX_CREDENTIALS}
              placeholder={t(
                'mentor.publicProfile.credentialsPlaceholder',
                'Certifications, prop firm passes, years of experience…'
              )}
            />
            <p className="text-[11px] text-muted-foreground text-right tabular-nums">
              {credentials.length} / {MAX_CREDENTIALS}
            </p>
          </div>

          <div className="space-y-2 max-w-[180px]">
            <Label htmlFor="mentor-years">
              {t('mentor.publicProfile.yearsTrading', 'Years trading')}
            </Label>
            <Input
              id="mentor-years"
              type="number"
              inputMode="numeric"
              min={0}
              step={1}
              value={yearsTrading}
              onChange={(e) => setYearsTrading(e.target.value)}
              aria-invalid={!yearsValid}
            />
          </div>

          <div className="flex justify-end">
            <Button
              onClick={handleSave}
              disabled={!canSave || mutation.isPending}
            >
              {mutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {t('common.save', 'Save')}
            </Button>
          </div>
        </div>
      )}
    </section>
  );
};

export default PublicProfileSection;
