import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, ChevronDown, ChevronUp, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { usePublicProfile } from '@/hooks/usePublicProfile';
import VerifiedBadge from '@/components/social/VerifiedBadge';
import ShareButtons from '@/components/social/ShareButtons';
import ProfileMetricsGrid from '@/components/social/ProfileMetricsGrid';

const PublicTraderProfile: React.FC = () => {
  const { username } = useParams<{ username: string }>();
  const { data: profile, isLoading, isError } = usePublicProfile(username);
  const [hashExpanded, setHashExpanded] = useState(false);

  const profileUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/trader/${username ?? ''}`
    : '';

  /* ------------------------------------------------------------------ */
  /*  Loading skeleton                                                   */
  /* ------------------------------------------------------------------ */
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#050506] text-white">
        <div className="max-w-3xl mx-auto px-4 py-10 space-y-8">
          {/* Header skeleton */}
          <div className="flex items-center gap-3">
            <Skeleton className="w-8 h-8 rounded-full" />
            <Skeleton className="h-5 w-40" />
          </div>
          {/* Hero skeleton */}
          <div className="space-y-4 pt-6">
            <Skeleton className="h-10 w-56" />
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-72" />
            <Skeleton className="h-4 w-24" />
          </div>
          {/* Metrics grid skeleton */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-28 rounded-2xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  /* ------------------------------------------------------------------ */
  /*  404 state                                                          */
  /* ------------------------------------------------------------------ */
  if (isError || !profile) {
    return (
      <div className="min-h-screen bg-[#050506] flex flex-col items-center justify-center gap-6 px-4">
        <div className="text-center">
          <h1 className="text-5xl font-bold text-white mb-3">404</h1>
          <p className="text-muted-foreground text-lg">
            Trader not found
          </p>
          <p className="text-muted-foreground text-sm mt-1">
            @{username} does not have a public trading profile yet.
          </p>
        </div>
        <Button asChild variant="outline" className="border-white/15 text-white hover:bg-white/5">
          <Link to="/">Back to home</Link>
        </Button>
      </div>
    );
  }

  const memberSince = new Date(profile.createdAt).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  /* ------------------------------------------------------------------ */
  /*  Main layout                                                        */
  /* ------------------------------------------------------------------ */
  return (
    <div className="min-h-screen bg-[#050506] text-white selection:bg-primary/30">
      {/* Ambient depth layers */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-18%] left-[-8%] w-[50%] h-[50%] rounded-full bg-primary/8 blur-[120px]" />
        <div className="absolute bottom-[-12%] right-[-6%] w-[45%] h-[45%] rounded-full bg-blue-500/6 blur-[120px]" />
      </div>

      <div className="relative z-10 max-w-3xl mx-auto px-4 py-10 space-y-10">
        {/* ---- Header ---- */}
        <header className="flex items-center gap-3">
          <Link
            to="/"
            className="flex items-center justify-center w-9 h-9 rounded-full bg-white/5 border border-white/8 hover:bg-white/10 transition-colors"
            aria-label="Back to home"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <span className="text-sm font-semibold tracking-wide text-muted-foreground">
            FollowUp Trading
          </span>
        </header>

        {/* ---- Hero ---- */}
        <section className="space-y-3 pt-2">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">
              @{profile.username}
            </h1>
            {profile.isVerified && <VerifiedBadge className="translate-y-0.5" />}
          </div>

          {profile.bio && (
            <p className="text-muted-foreground text-base leading-relaxed max-w-xl">
              {profile.bio}
            </p>
          )}

          <p className="text-xs text-muted-foreground/70">
            Member since {memberSince}
          </p>
        </section>

        {/* ---- Metrics ---- */}
        <section aria-label="Trading metrics">
          <ProfileMetricsGrid profile={profile} />
        </section>

        {/* ---- Verification hash ---- */}
        {profile.verificationHash && (
          <section className="space-y-2">
            <button
              type="button"
              onClick={() => setHashExpanded((prev) => !prev)}
              className="flex items-center gap-2 text-xs text-muted-foreground hover:text-white transition-colors group"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
              <span>Verified by FollowUp Trading</span>
              {hashExpanded ? (
                <ChevronUp className="w-3.5 h-3.5 opacity-50 group-hover:opacity-100 transition-opacity" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5 opacity-50 group-hover:opacity-100 transition-opacity" />
              )}
            </button>

            {hashExpanded && (
              <p className="text-[11px] text-muted-foreground/60 font-mono break-all pl-5">
                Hash: {profile.verificationHash}
              </p>
            )}
          </section>
        )}

        {/* ---- Share ---- */}
        <section aria-label="Share profile">
          <ShareButtons username={profile.username} url={profileUrl} />
        </section>

        {/* ---- CTA Footer ---- */}
        <footer className="border-t border-white/6 pt-10 text-center space-y-4">
          <p className="text-lg font-medium text-white">
            Start your trading journal
          </p>
          <p className="text-sm text-muted-foreground">
            Track, analyze, and verify your performance — for free.
          </p>
          <Button asChild size="lg" className="bg-primary hover:bg-primary/90 text-sm font-semibold px-8">
            <Link to="/auth/signup">Get started free</Link>
          </Button>
        </footer>
      </div>
    </div>
  );
};

export default PublicTraderProfile;
