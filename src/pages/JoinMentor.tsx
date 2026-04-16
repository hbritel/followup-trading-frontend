import React from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Users, ArrowRight, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { usePublicMentorInstance, useJoinInstance } from '@/hooks/useMentor';
import { useAuth } from '@/contexts/auth-context';

const JoinMentor: React.FC = () => {
  const { inviteCode } = useParams<{ inviteCode: string }>();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: instance, isLoading, isError } = usePublicMentorInstance(inviteCode);
  const joinMutation = useJoinInstance();

  const handleJoin = () => {
    if (!inviteCode) return;
    joinMutation.mutate(inviteCode, {
      onSuccess: () => navigate('/dashboard'),
    });
  };

  /* ── Loading skeleton ─────────────────────────────────────── */
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#050506] text-white flex items-center justify-center">
        <div className="max-w-md w-full mx-auto px-6 space-y-8">
          <Skeleton className="w-20 h-20 rounded-2xl mx-auto" />
          <Skeleton className="h-9 w-56 mx-auto" />
          <Skeleton className="h-4 w-72 mx-auto" />
          <Skeleton className="h-4 w-40 mx-auto" />
          <Skeleton className="h-12 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  /* ── 404 state ────────────────────────────────────────────── */
  if (isError || !instance) {
    return (
      <div className="min-h-screen bg-[#050506] flex flex-col items-center justify-center gap-6 px-4">
        <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center">
          <AlertCircle className="w-8 h-8 text-red-400" />
        </div>
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white mb-2">
            {t('common.notFound', 'Not Found')}
          </h1>
          <p className="text-muted-foreground">
            This invite link is invalid or has expired.
          </p>
        </div>
        <Button
          asChild
          variant="outline"
          className="border-white/15 text-white hover:bg-white/5"
        >
          <Link to="/">Back to home</Link>
        </Button>
      </div>
    );
  }

  const isFull = instance.currentStudents >= instance.maxStudents;

  /* ── Main layout ──────────────────────────────────────────── */
  return (
    <div className="min-h-screen bg-[#050506] text-white flex items-center justify-center px-4">
      <div className="max-w-md w-full space-y-8 text-center">
        {/* Logo */}
        {instance.logoUrl && (
          <div className="flex justify-center">
            <img
              src={instance.logoUrl}
              alt={instance.brandName}
              width={80}
              height={80}
              className="w-20 h-20 rounded-2xl object-cover border border-white/10 shadow-lg"
            />
          </div>
        )}

        {!instance.logoUrl && (
          <div
            className="mx-auto w-20 h-20 rounded-2xl flex items-center justify-center text-2xl font-bold shadow-lg"
            style={{
              backgroundColor: `${instance.primaryColor}20`,
              color: instance.primaryColor,
              borderColor: `${instance.primaryColor}30`,
              borderWidth: 1,
            }}
          >
            {instance.brandName.charAt(0).toUpperCase()}
          </div>
        )}

        {/* Brand name */}
        <h1 className="text-4xl font-bold tracking-tight">
          {instance.brandName}
        </h1>

        {/* Description */}
        {instance.description && (
          <p className="text-muted-foreground text-lg leading-relaxed max-w-sm mx-auto">
            {instance.description}
          </p>
        )}

        {/* Student count */}
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Users className="w-4 h-4" />
          <span>
            {instance.currentStudents}/{instance.maxStudents}{' '}
            {t('mentor.students', 'students')}
          </span>
        </div>

        {/* Action */}
        <div className="pt-4">
          {user ? (
            <Button
              size="lg"
              onClick={handleJoin}
              disabled={joinMutation.isPending || isFull}
              className="w-full h-12 text-base rounded-xl gap-2"
              style={{
                backgroundColor: instance.primaryColor || undefined,
              }}
            >
              {joinMutation.isPending
                ? t('common.loading', 'Loading...')
                : isFull
                  ? t('mentor.instanceFull', 'Instance is full')
                  : t('mentor.joinInstance', 'Join')}
              {!joinMutation.isPending && !isFull && (
                <ArrowRight className="w-4 h-4" />
              )}
            </Button>
          ) : (
            <Button
              asChild
              size="lg"
              variant="outline"
              className="w-full h-12 text-base rounded-xl border-white/15 text-white hover:bg-white/5 gap-2"
            >
              <Link to="/auth/signup">
                {t('mentor.signUpToJoin', 'Sign up to join')}
                <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default JoinMentor;
