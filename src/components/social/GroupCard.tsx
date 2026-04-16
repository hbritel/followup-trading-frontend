import React from 'react';
import { useTranslation } from 'react-i18next';
import { Users, Crown, LogOut, Trash2, Lock, GraduationCap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { StudyGroupDto, GroupType } from '@/types/dto';

interface GroupCardProps {
  group: StudyGroupDto;
  onJoin: (id: string) => void;
  onLeave: (id: string) => void;
  onDelete: (id: string) => void;
  isJoinPending?: boolean;
  isLeavePending?: boolean;
  isDeletePending?: boolean;
}

const TYPE_STYLES: Record<GroupType, { className: string; icon: React.ElementType }> = {
  OPEN: {
    className: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    icon: Users,
  },
  INVITE_ONLY: {
    className: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    icon: Lock,
  },
  MENTOR_LED: {
    className: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    icon: GraduationCap,
  },
};

const GroupCard: React.FC<GroupCardProps> = ({
  group,
  onJoin,
  onLeave,
  onDelete,
  isJoinPending = false,
  isLeavePending = false,
  isDeletePending = false,
}) => {
  const { t } = useTranslation();

  const typeStyle = TYPE_STYLES[group.type];
  const TypeIcon = typeStyle.icon;
  const isFull = group.memberCount >= group.maxMembers;
  const isOwner = group.isMember && group.ownerUsername === group.ownerUsername; // will rely on backend

  const typeLabel =
    group.type === 'OPEN'
      ? t('studyGroups.open')
      : group.type === 'INVITE_ONLY'
        ? t('studyGroups.inviteOnly')
        : t('studyGroups.mentorLed');

  return (
    <div className="glass-card rounded-2xl p-5 flex flex-col gap-4 h-full group/card hover:border-white/10 transition-colors duration-200">
      {/* Header row */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-white truncate text-base">{group.name}</h3>
          {group.description && (
            <p className="text-sm text-muted-foreground line-clamp-2 mt-1 leading-relaxed">
              {group.description}
            </p>
          )}
        </div>
        <Badge variant="outline" className={`flex-shrink-0 text-xs gap-1 ${typeStyle.className}`}>
          <TypeIcon className="w-3 h-3" />
          {typeLabel}
        </Badge>
      </div>

      {/* Owner */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary/40 to-primary/20 border border-primary/20 flex items-center justify-center text-xs font-bold text-primary flex-shrink-0">
          {group.ownerUsername.charAt(0).toUpperCase()}
        </div>
        <span className="truncate">
          <Crown className="w-3 h-3 inline-block mr-1 text-amber-400" />
          {group.ownerUsername}
        </span>
      </div>

      {/* Member count bar */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground flex items-center gap-1">
            <Users className="w-3.5 h-3.5" />
            {group.memberCount} / {group.maxMembers} {t('studyGroups.members')}
          </span>
          {isFull && (
            <span className="text-amber-400 font-medium text-[10px] uppercase tracking-wider">
              {t('studyGroups.full')}
            </span>
          )}
        </div>
        <div className="h-1 rounded-full bg-white/5 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-primary/60 to-primary transition-all duration-500"
            style={{ width: `${Math.min((group.memberCount / group.maxMembers) * 100, 100)}%` }}
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 mt-auto pt-1">
        {!group.isMember && (
          <Button
            size="sm"
            disabled={isJoinPending || isFull}
            onClick={() => onJoin(group.id)}
            className="flex-1 bg-primary hover:bg-primary/90 text-white"
          >
            {t('studyGroups.join')}
          </Button>
        )}

        {group.isMember && (
          <>
            <Badge
              variant="outline"
              className="text-xs bg-primary/10 text-primary border-primary/20"
            >
              {t('studyGroups.joined')}
            </Badge>
            <div className="flex-1" />
            <Button
              size="sm"
              variant="ghost"
              disabled={isLeavePending}
              onClick={() => onLeave(group.id)}
              className="text-muted-foreground hover:text-red-400 hover:bg-red-500/10 px-2"
              title={t('studyGroups.leave')}
            >
              <LogOut className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              disabled={isDeletePending}
              onClick={() => onDelete(group.id)}
              className="text-muted-foreground hover:text-red-400 hover:bg-red-500/10 px-2"
              title={t('studyGroups.delete')}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </>
        )}
      </div>
    </div>
  );
};

export default GroupCard;
