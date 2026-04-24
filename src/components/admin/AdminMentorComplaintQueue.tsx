import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown, ChevronUp, Loader2, AlertTriangle, ExternalLink } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { useAdminComplaints, useTransitionComplaint } from '@/hooks/useAdminMentor';
import type { MentorComplaintDto, MentorComplaintStatus } from '@/types/dto';

const STATUS_TABS: { value: MentorComplaintStatus | 'all'; labelKey: string; fallback: string }[] =
  [
    { value: 'all', labelKey: 'admin.mentors.complaints.tabAll', fallback: 'All' },
    { value: 'OPEN', labelKey: 'admin.mentors.complaints.tabOpen', fallback: 'Open' },
    {
      value: 'UNDER_REVIEW',
      labelKey: 'admin.mentors.complaints.tabUnderReview',
      fallback: 'Under review',
    },
    {
      value: 'RESOLVED_REMOVED',
      labelKey: 'admin.mentors.complaints.tabRemoved',
      fallback: 'Removed',
    },
    {
      value: 'RESOLVED_REJECTED',
      labelKey: 'admin.mentors.complaints.tabRejected',
      fallback: 'Rejected',
    },
  ];

const TRANSITION_OPTIONS: { value: MentorComplaintStatus; labelKey: string; fallback: string }[] =
  [
    { value: 'OPEN', labelKey: 'admin.mentors.complaints.statusOpen', fallback: 'Open' },
    {
      value: 'UNDER_REVIEW',
      labelKey: 'admin.mentors.complaints.statusUnderReview',
      fallback: 'Under review',
    },
    {
      value: 'RESOLVED_REMOVED',
      labelKey: 'admin.mentors.complaints.statusRemoved',
      fallback: 'Resolved — Removed',
    },
    {
      value: 'RESOLVED_REJECTED',
      labelKey: 'admin.mentors.complaints.statusRejected',
      fallback: 'Resolved — Rejected',
    },
  ];

const STATUS_COLORS: Record<MentorComplaintStatus, string> = {
  OPEN: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/25',
  UNDER_REVIEW: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/25',
  RESOLVED_REMOVED: 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/25',
  RESOLVED_REJECTED: 'bg-muted text-muted-foreground border-border/40',
};

function fmtDate(iso: string): string {
  return new Intl.DateTimeFormat(
    document.documentElement.lang || navigator.language || 'en-US',
    { month: 'short', day: 'numeric', year: 'numeric' }
  ).format(new Date(iso));
}

interface ComplaintRowProps {
  complaint: MentorComplaintDto;
}

const ComplaintRow: React.FC<ComplaintRowProps> = ({ complaint }) => {
  const { t } = useTranslation();
  const transition = useTransitionComplaint();
  const [expanded, setExpanded] = useState(false);
  const [newStatus, setNewStatus] = useState<MentorComplaintStatus>(complaint.status);
  const [notes, setNotes] = useState(complaint.adminNotes ?? '');

  const statusChanged = newStatus !== complaint.status;
  const canTransition = statusChanged || (notes !== (complaint.adminNotes ?? '') && notes.trim().length > 0);

  return (
    <div className="rounded-xl border border-border/50 overflow-hidden">
      {/* Row header */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center gap-3 p-4 text-left hover:bg-muted/30 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
        aria-expanded={expanded}
      >
        <div className="min-w-0 flex-1 flex items-start gap-3">
          <span
            className={cn(
              'shrink-0 inline-flex items-center text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full border',
              STATUS_COLORS[complaint.status]
            )}
          >
            {t(`admin.mentors.complaints.status${complaint.status.replace(/_/g, '')}`, complaint.status)}
          </span>
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">
              {t(`mentor.complaint.categories.${complaint.category}`, complaint.category.replace(/_/g, ' '))}
            </p>
            <p className="text-xs text-muted-foreground">
              {fmtDate(complaint.createdAt)}{complaint.reporterEmail ? ` · ${complaint.reporterEmail}` : ''}
            </p>
          </div>
        </div>
        {expanded ? (
          <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" aria-hidden="true" />
        ) : (
          <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" aria-hidden="true" />
        )}
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div className="border-t border-border/40 p-4 space-y-4 bg-muted/10">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-1">
              {t('admin.mentors.complaints.descriptionLabel', 'Description')}
            </p>
            <p className="text-sm leading-relaxed whitespace-pre-wrap">
              {complaint.description}
            </p>
          </div>

          {complaint.evidenceUrl && (
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-1">
                {t('admin.mentors.complaints.evidenceLabel', 'Evidence')}
              </p>
              <a
                href={complaint.evidenceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
              >
                {complaint.evidenceUrl}
                <ExternalLink className="w-3 h-3" aria-hidden="true" />
              </a>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor={`status-${complaint.id}`} className="text-xs">
                {t('admin.mentors.complaints.statusLabel', 'Status')}
              </Label>
              <Select
                value={newStatus}
                onValueChange={(v) => setNewStatus(v as MentorComplaintStatus)}
              >
                <SelectTrigger id={`status-${complaint.id}`} className="text-sm h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TRANSITION_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value} className="text-sm">
                      {t(opt.labelKey, opt.fallback)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor={`notes-${complaint.id}`} className="text-xs">
                {t('admin.mentors.complaints.notesLabel', 'Admin notes (optional)')}
              </Label>
              <Textarea
                id={`notes-${complaint.id}`}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                className="text-sm resize-none"
                placeholder={t(
                  'admin.mentors.complaints.notesPlaceholder',
                  'Internal notes…'
                )}
              />
            </div>
          </div>

          <div className="flex justify-end">
            <Button
              size="sm"
              onClick={() =>
                transition.mutate({
                  id: complaint.id,
                  status: newStatus,
                  notes: notes.trim() || undefined,
                })
              }
              disabled={!canTransition || transition.isPending}
              className="h-8 gap-2"
            >
              {transition.isPending && (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              )}
              {t('admin.mentors.complaints.saveTransition', 'Update')}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

const ComplaintTabContent: React.FC<{ status?: MentorComplaintStatus }> = ({ status }) => {
  const { t } = useTranslation();
  const { data: complaints = [], isLoading } = useAdminComplaints(status);

  if (isLoading) {
    return (
      <div className="space-y-2 mt-4">
        <Skeleton className="h-16 w-full rounded-xl" />
        <Skeleton className="h-16 w-full rounded-xl" />
      </div>
    );
  }

  if (complaints.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-12 text-center text-muted-foreground mt-4">
        <AlertTriangle className="w-8 h-8 opacity-30" aria-hidden="true" />
        <p className="text-sm">
          {t('admin.mentors.complaints.empty', 'No complaints in this category.')}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2 mt-4">
      {complaints.map((c) => (
        <ComplaintRow key={c.id} complaint={c} />
      ))}
    </div>
  );
};

const AdminMentorComplaintQueue: React.FC = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<string>('OPEN');

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <AlertTriangle className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
        <h3 className="text-sm font-semibold">
          {t('admin.mentors.complaints.title', 'Mentor complaints')}
        </h3>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex-wrap h-auto gap-1">
          {STATUS_TABS.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value} className="text-xs">
              {t(tab.labelKey, tab.fallback)}
            </TabsTrigger>
          ))}
        </TabsList>

        {STATUS_TABS.map((tab) => (
          <TabsContent key={tab.value} value={tab.value}>
            <ComplaintTabContent
              status={tab.value === 'all' ? undefined : (tab.value as MentorComplaintStatus)}
            />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

export default AdminMentorComplaintQueue;
