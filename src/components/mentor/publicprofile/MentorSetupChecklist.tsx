import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Check,
  ChevronDown,
  ChevronUp,
  CircleDashed,
  Globe,
  PartyPopper,
  Send,
  Sparkles,
  UserPlus,
  Users,
} from 'lucide-react';
import type { MentorInstanceDto } from '@/types/dto';

interface Props {
  instance: MentorInstanceDto;
  onStepClick?: (anchor: string) => void;
  onShareClick?: () => void;
}

type StepId = 'profile' | 'brand' | 'share' | 'accept' | 'firstStudent';

interface Step {
  id: StepId;
  icon: React.ReactNode;
  titleKey: string;
  titleFallback: string;
  hintKey: string;
  hintFallback: string;
  anchor?: string;
  done: boolean;
  action?: () => void;
}

const SHARE_STORAGE_KEY = 'mentor.setup.shareConfirmed';
const DISMISSED_STORAGE_KEY = 'mentor.setup.dismissed';

const MentorSetupChecklist: React.FC<Props> = ({ instance, onStepClick, onShareClick }) => {
  const { t } = useTranslation();
  const [collapsed, setCollapsed] = useState(false);
  const [shareMarked, setShareMarked] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    try {
      setShareMarked(
        localStorage.getItem(`${SHARE_STORAGE_KEY}.${instance.id}`) === '1'
      );
      setDismissed(
        localStorage.getItem(`${DISMISSED_STORAGE_KEY}.${instance.id}`) === '1'
      );
    } catch {
      /* noop */
    }
  }, [instance.id]);

  const markShareDone = () => {
    try {
      localStorage.setItem(`${SHARE_STORAGE_KEY}.${instance.id}`, '1');
    } catch {
      /* noop */
    }
    setShareMarked(true);
    onShareClick?.();
  };

  const steps: Step[] = useMemo(() => {
    const brandFull =
      !!instance.description?.trim() &&
      (!!instance.publicBio?.trim() || !!instance.publicHeadline?.trim());
    return [
      {
        id: 'profile',
        icon: <Globe className="w-4 h-4" />,
        titleKey: 'mentor.setupChecklist.profile.title',
        titleFallback: 'Enable your public profile',
        hintKey: 'mentor.setupChecklist.profile.hint',
        hintFallback: 'Get discovered in the mentor directory.',
        anchor: 'public-profile-heading',
        done: !!instance.publicProfileEnabled,
      },
      {
        id: 'brand',
        icon: <Sparkles className="w-4 h-4" />,
        titleKey: 'mentor.setupChecklist.brand.title',
        titleFallback: 'Tell your story',
        hintKey: 'mentor.setupChecklist.brand.hint',
        hintFallback: 'Add a description, headline, and short bio.',
        anchor: 'public-profile-heading',
        done: brandFull,
      },
      {
        id: 'accept',
        icon: <UserPlus className="w-4 h-4" />,
        titleKey: 'mentor.setupChecklist.accept.title',
        titleFallback: 'Open your space to new students',
        hintKey: 'mentor.setupChecklist.accept.hint',
        hintFallback: 'Flip the switch — the directory hides closed spaces.',
        anchor: 'public-profile-heading',
        done: instance.acceptNewEnabled !== false,
      },
      {
        id: 'share',
        icon: <Send className="w-4 h-4" />,
        titleKey: 'mentor.setupChecklist.share.title',
        titleFallback: 'Share your invite link',
        hintKey: 'mentor.setupChecklist.share.hint',
        hintFallback: 'Post it on your socials — first 3 students unlock momentum.',
        done: shareMarked || instance.currentStudents > 0,
        action: markShareDone,
      },
      {
        id: 'firstStudent',
        icon: <Users className="w-4 h-4" />,
        titleKey: 'mentor.setupChecklist.firstStudent.title',
        titleFallback: 'Welcome your first student',
        hintKey: 'mentor.setupChecklist.firstStudent.hint',
        hintFallback: 'They join with your invite code — the rest follows.',
        done: instance.currentStudents > 0,
      },
    ];
  }, [instance, shareMarked]);

  const completed = steps.filter((s) => s.done).length;
  const total = steps.length;
  const pct = Math.round((completed / total) * 100);
  const allDone = completed === total;

  // Confetti burst the first time allDone flips true. Tracked in a ref-like
  // boolean so it doesn't replay on every re-render.
  const [celebrating, setCelebrating] = useState(false);
  const [hasCelebrated, setHasCelebrated] = useState(false);
  useEffect(() => {
    if (allDone && !hasCelebrated) {
      setCelebrating(true);
      setHasCelebrated(true);
      const id = setTimeout(() => setCelebrating(false), 1800);
      return () => clearTimeout(id);
    }
  }, [allDone, hasCelebrated]);

  // Once dismissed (user clicked "Hide this") it stays gone for the lifetime of
  // the instance — power users get their pixels back.
  if (dismissed) return null;
  if (allDone && collapsed) return null;

  const dismissForever = () => {
    try {
      localStorage.setItem(`${DISMISSED_STORAGE_KEY}.${instance.id}`, '1');
    } catch {
      /* noop */
    }
    setDismissed(true);
  };

  return (
    <section
      aria-labelledby="setup-checklist-heading"
      className={[
        'glass-card rounded-2xl border overflow-hidden transition-all duration-300 relative',
        allDone
          ? 'border-emerald-500/40 bg-gradient-to-br from-emerald-500/5 to-transparent'
          : 'border-primary/25',
        celebrating ? 'ring-2 ring-emerald-500/40 ring-offset-2 ring-offset-background' : '',
      ].join(' ')}
    >
      {celebrating && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 overflow-hidden motion-reduce:hidden"
        >
          {[
            { left: '12%', delay: '0ms', hue: 'bg-emerald-400' },
            { left: '28%', delay: '120ms', hue: 'bg-amber-300' },
            { left: '46%', delay: '60ms', hue: 'bg-emerald-300' },
            { left: '64%', delay: '180ms', hue: 'bg-primary' },
            { left: '82%', delay: '90ms', hue: 'bg-emerald-500' },
          ].map((dot, i) => (
            <span
              key={i}
              className={[
                'absolute top-3 w-1.5 h-1.5 rounded-full',
                dot.hue,
                'animate-[confetti-fall_1.6s_ease-out_forwards]',
              ].join(' ')}
              style={{ left: dot.left, animationDelay: dot.delay }}
            />
          ))}
        </div>
      )}
      <button
        type="button"
        onClick={() => setCollapsed((v) => !v)}
        className="w-full flex items-center justify-between gap-3 p-5 text-left hover:bg-muted/20 transition-colors"
        aria-expanded={!collapsed}
        aria-controls="setup-checklist-body"
      >
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div
            className={[
              'w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors',
              allDone
                ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                : 'bg-primary/10 text-primary',
            ].join(' ')}
          >
            {allDone ? (
              <PartyPopper className="w-5 h-5 motion-safe:animate-in motion-safe:zoom-in-50 motion-safe:duration-500" />
            ) : (
              <CircleDashed className="w-5 h-5" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h2
              id="setup-checklist-heading"
              className="text-base font-semibold flex items-center gap-2"
            >
              {allDone
                ? t('mentor.setupChecklist.doneTitle', "You're live!")
                : t('mentor.setupChecklist.title', 'Your revenue roadmap')}
              <span
                className={[
                  'text-xs font-bold tabular-nums px-2 py-0.5 rounded-full',
                  allDone
                    ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                    : 'bg-primary/10 text-primary',
                ].join(' ')}
              >
                {completed}/{total}
              </span>
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {allDone
                ? t(
                    'mentor.setupChecklist.doneHint',
                    'Every step checked. Tap to close this card.'
                  )
                : t(
                    'mentor.setupChecklist.hint',
                    '{{n}} step{{plural}} to your first paying student.',
                    { n: total - completed, plural: total - completed > 1 ? 's' : '' }
                  )}
            </p>
          </div>
        </div>
        {collapsed ? (
          <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
        ) : (
          <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" />
        )}
      </button>

      {!collapsed && (
        <div id="setup-checklist-body" className="px-5 pb-5 space-y-3">
          <div
            className="h-1.5 rounded-full bg-muted/50 overflow-hidden"
            role="progressbar"
            aria-valuenow={pct}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={t(
              'mentor.setupChecklist.progressAria',
              'Setup progress: {{pct}}% complete',
              { pct }
            )}
          >
            <div
              className={[
                'h-full rounded-full transition-all duration-500 ease-out',
                allDone
                  ? 'bg-gradient-to-r from-emerald-400 to-emerald-500'
                  : 'bg-gradient-to-r from-primary/70 to-primary',
              ].join(' ')}
              style={{ width: `${pct}%` }}
            />
          </div>

          <ul className="space-y-1.5 pt-2">
            {steps.map((step) => {
              const clickable = !step.done && (!!step.anchor || !!step.action);
              const onClick = () => {
                if (step.done) return;
                if (step.action) step.action();
                if (step.anchor && onStepClick) onStepClick(step.anchor);
              };
              return (
                <li key={step.id}>
                  <button
                    type="button"
                    onClick={clickable ? onClick : undefined}
                    disabled={!clickable}
                    className={[
                      'w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-all',
                      step.done
                        ? 'bg-emerald-500/5 border border-emerald-500/20'
                        : clickable
                          ? 'border border-border/40 hover:border-primary/40 hover:bg-primary/5 cursor-pointer'
                          : 'border border-border/40 opacity-70',
                    ].join(' ')}
                  >
                    <div
                      className={[
                        'w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors',
                        step.done
                          ? 'bg-emerald-500 text-white'
                          : 'bg-muted/60 text-muted-foreground',
                      ].join(' ')}
                      aria-hidden="true"
                    >
                      {step.done ? <Check className="w-3.5 h-3.5" /> : step.icon}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p
                        className={[
                          'text-sm font-medium leading-tight',
                          step.done ? 'line-through text-muted-foreground' : '',
                        ].join(' ')}
                      >
                        {t(step.titleKey, step.titleFallback)}
                      </p>
                      {!step.done && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {t(step.hintKey, step.hintFallback)}
                        </p>
                      )}
                    </div>
                    {clickable && (
                      <ChevronDown
                        className="w-4 h-4 text-muted-foreground/60 -rotate-90 shrink-0"
                        aria-hidden="true"
                      />
                    )}
                  </button>
                </li>
              );
            })}
          </ul>

          {allDone && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-2">
              <p className="text-xs text-emerald-700 dark:text-emerald-300 font-medium motion-safe:animate-in motion-safe:fade-in">
                {t(
                  'mentor.setupChecklist.celebrate',
                  '🎉 Your profile is discoverable. Time to grow.'
                )}
              </p>
              <button
                type="button"
                onClick={dismissForever}
                className="text-[11px] font-medium text-muted-foreground hover:text-foreground hover:underline"
              >
                {t('mentor.setupChecklist.hideForever', 'Hide this card')}
              </button>
            </div>
          )}
        </div>
      )}
    </section>
  );
};

export default MentorSetupChecklist;
