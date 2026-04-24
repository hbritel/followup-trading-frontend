import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Flag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ReportProfileDialog from './ReportProfileDialog';

interface ReportProfileButtonProps {
  slug: string;
  brandName: string;
  variant?: 'ghost' | 'outline' | 'link';
  size?: 'sm' | 'default';
  className?: string;
}

const ReportProfileButton: React.FC<ReportProfileButtonProps> = ({
  slug,
  brandName,
  variant = 'ghost',
  size = 'sm',
  className,
}) => {
  const { t } = useTranslation();
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={() => setDialogOpen(true)}
        className={['gap-1.5 text-muted-foreground hover:text-destructive', className]
          .filter(Boolean)
          .join(' ')}
        aria-label={t('mentor.complaint.reportButton.ariaLabel', 'Report {{brand}}', {
          brand: brandName,
        })}
      >
        <Flag className="w-3.5 h-3.5" aria-hidden="true" />
        {t('mentor.complaint.reportButton.label', 'Report')}
      </Button>

      <ReportProfileDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        slug={slug}
        brandName={brandName}
      />
    </>
  );
};

export default ReportProfileButton;
