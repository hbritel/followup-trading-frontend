import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { useSubmitComplaint } from '@/hooks/useMentor';
import type { MentorComplaintCategory } from '@/types/dto';

const CATEGORIES: MentorComplaintCategory[] = [
  'MISLEADING_CREDENTIALS',
  'SCAM',
  'HARASSMENT',
  'COPYRIGHT',
  'ILLEGAL_CONTENT',
  'MINOR_ABUSE',
  'IMPERSONATION',
  'OTHER',
];

interface ReportProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  slug: string;
  brandName: string;
}

const ReportProfileDialog: React.FC<ReportProfileDialogProps> = ({
  open,
  onOpenChange,
  slug,
  brandName,
}) => {
  const { t } = useTranslation();
  const submitComplaint = useSubmitComplaint(slug);

  const [category, setCategory] = useState<MentorComplaintCategory | ''>('');
  const [description, setDescription] = useState('');
  const [evidenceUrl, setEvidenceUrl] = useState('');
  const [reporterEmail, setReporterEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const canSubmit =
    category !== '' &&
    description.trim().length >= 10 &&
    !submitComplaint.isPending;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    submitComplaint.mutate(
      {
        category: category as MentorComplaintCategory,
        description: description.trim(),
        ...(evidenceUrl.trim() ? { evidenceUrl: evidenceUrl.trim() } : {}),
        ...(reporterEmail.trim() ? { reporterEmail: reporterEmail.trim() } : {}),
      },
      {
        onSuccess: () => {
          setSubmitted(true);
          toast.success(t('mentor.complaint.form.successToast', 'Report submitted. Thank you.'));
        },
        onError: () => {
          toast.error(
            t('mentor.complaint.form.genericError', 'Failed to submit report. Please try again.')
          );
        },
      }
    );
  };

  const handleClose = () => {
    onOpenChange(false);
    // Reset after animation
    setTimeout(() => {
      setCategory('');
      setDescription('');
      setEvidenceUrl('');
      setReporterEmail('');
      setSubmitted(false);
    }, 300);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {t('mentor.complaint.form.title', 'Report {{brand}}', {
              brand: brandName,
            })}
          </DialogTitle>
          <DialogDescription>
            {t(
              'mentor.complaint.form.description',
              'Reports are reviewed by the FollowUp Trading trust & safety team. Do not submit false reports.'
            )}
          </DialogDescription>
        </DialogHeader>

        {submitted ? (
          <div className="py-6 text-center space-y-2">
            <p className="text-sm font-medium">
              {t('mentor.complaint.form.successTitle', 'Report received')}
            </p>
            <p className="text-xs text-muted-foreground">
              {t(
                'mentor.complaint.form.successDesc',
                'Our team will review your report and take appropriate action.'
              )}
            </p>
            <Button variant="outline" size="sm" onClick={handleClose} className="mt-2">
              {t('common.close', 'Close')}
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div className="space-y-1.5">
              <Label htmlFor="report-category">
                {t('mentor.complaint.form.categoryLabel', 'Category')} *
              </Label>
              <Select
                value={category}
                onValueChange={(v) => setCategory(v as MentorComplaintCategory)}
              >
                <SelectTrigger id="report-category">
                  <SelectValue
                    placeholder={t('mentor.complaint.form.categoryPlaceholder', 'Select a category')}
                  />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {t(`mentor.complaint.categories.${cat}`, cat.replace(/_/g, ' '))}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="report-description">
                {t('mentor.complaint.form.descriptionLabel', 'Description')} *
              </Label>
              <Textarea
                id="report-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t(
                  'mentor.complaint.form.descriptionPlaceholder',
                  'Describe the issue in detail (minimum 10 characters).'
                )}
                rows={4}
                required
                className="resize-none text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="report-evidence">
                {t('mentor.complaint.form.evidenceLabel', 'Evidence URL (optional)')}
              </Label>
              <Input
                id="report-evidence"
                type="url"
                value={evidenceUrl}
                onChange={(e) => setEvidenceUrl(e.target.value)}
                placeholder="https://…"
                className="text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="report-email">
                {t('mentor.complaint.form.reporterEmailLabel', 'Your email (optional)')}
              </Label>
              <Input
                id="report-email"
                type="email"
                value={reporterEmail}
                onChange={(e) => setReporterEmail(e.target.value)}
                placeholder={t(
                  'mentor.complaint.form.reporterEmailPlaceholder',
                  'So we can follow up if needed'
                )}
                className="text-sm"
                autoComplete="email"
              />
            </div>

            <DialogFooter className="gap-2 flex-col sm:flex-row">
              <Button
                type="button"
                variant="ghost"
                onClick={handleClose}
                className="order-2 sm:order-1"
              >
                {t('common.cancel', 'Cancel')}
              </Button>
              <Button
                type="submit"
                variant="destructive"
                disabled={!canSubmit}
                className="order-1 sm:order-2 gap-2"
              >
                {submitComplaint.isPending && (
                  <Loader2 className="w-4 h-4 animate-spin" />
                )}
                {t('mentor.complaint.form.submitButton', 'Submit report')}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ReportProfileDialog;
