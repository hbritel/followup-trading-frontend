import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  CHART_ANALYSIS_ALLOWED_MIME,
  CHART_ANALYSIS_MAX_BYTES,
  validateChartUpload,
} from '@/types/visionAnalysis';

interface TradeChartUploadProps {
  /** Selected file, hoisted to the parent for submission. */
  file: File | null;
  /** Setter — pass {@code null} to clear. */
  onFileChange: (file: File | null) => void;
  /** Disables interaction during submission. */
  disabled?: boolean;
}

/**
 * Drag-and-drop zone + file picker for the chart-analysis flow.
 *
 * <p>Validates MIME and size on selection so the parent never has to. The
 * preview revokes its object URL on unmount and on every file change.</p>
 */
const TradeChartUpload: React.FC<TradeChartUploadProps> = ({
  file,
  onFileChange,
  disabled = false,
}) => {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setDragging] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const previewUrl = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const accept = CHART_ANALYSIS_ALLOWED_MIME.join(',');

  const tryAccept = useCallback(
    (candidate: File) => {
      const errKey = validateChartUpload(candidate);
      if (errKey) {
        setValidationError(t(errKey, defaultErrorMessage(errKey)));
        return;
      }
      setValidationError(null);
      onFileChange(candidate);
    },
    [onFileChange, t],
  );

  const onPick = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const next = e.target.files?.[0] ?? null;
      if (next) {
        tryAccept(next);
      }
      // Reset so picking the same file twice fires onChange again.
      if (inputRef.current) {
        inputRef.current.value = '';
      }
    },
    [tryAccept],
  );

  const onDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setDragging(false);
      const next = e.dataTransfer.files?.[0];
      if (next) {
        tryAccept(next);
      }
    },
    [tryAccept],
  );

  const onDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setDragging(true);
    }
  }, [disabled]);

  const onDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(false);
  }, []);

  const clearFile = useCallback(() => {
    setValidationError(null);
    onFileChange(null);
  }, [onFileChange]);

  return (
    <div className="flex flex-col gap-2">
      {file && previewUrl ? (
        <div className="relative overflow-hidden rounded-lg border border-border bg-muted/20">
          <img
            src={previewUrl}
            alt={file.name}
            className="max-h-72 w-full object-contain"
          />
          <Button
            type="button"
            size="icon"
            variant="secondary"
            onClick={clearFile}
            disabled={disabled}
            className="absolute right-2 top-2 h-7 w-7"
            aria-label={t('common.remove', 'Remove')}
          >
            <X className="h-4 w-4" />
          </Button>
          <div className="flex items-center justify-between bg-muted/40 px-3 py-1.5 text-xs">
            <span className="truncate font-medium">{file.name}</span>
            <span className="tabular-nums text-muted-foreground">
              {formatBytes(file.size)}
            </span>
          </div>
        </div>
      ) : (
        <div
          role="button"
          tabIndex={disabled ? -1 : 0}
          aria-disabled={disabled}
          onClick={() => !disabled && inputRef.current?.click()}
          onKeyDown={(e) => {
            if (!disabled && (e.key === 'Enter' || e.key === ' ')) {
              e.preventDefault();
              inputRef.current?.click();
            }
          }}
          onDrop={onDrop}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          className={cn(
            'flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border px-4 py-8 text-center transition-colors',
            isDragging && 'border-primary/60 bg-primary/5',
            disabled && 'cursor-not-allowed opacity-60',
            !disabled && 'cursor-pointer hover:border-primary/40 hover:bg-muted/40',
          )}
        >
          <Upload className="h-6 w-6 text-muted-foreground" />
          <p className="text-sm font-medium">
            {t('visionAnalysis.dropzone.title', 'Drag a chart screenshot here')}
          </p>
          <p className="text-xs text-muted-foreground">
            {t('visionAnalysis.dropzone.hint', {
              defaultValue: 'PNG / JPEG / WEBP / GIF — up to 5 MB',
            })}
          </p>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={onPick}
        disabled={disabled}
        className="hidden"
      />

      {validationError && (
        <p className="text-xs text-destructive" role="alert">
          {validationError}
        </p>
      )}
    </div>
  );
};

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function defaultErrorMessage(key: string): string {
  switch (key) {
    case 'visionAnalysis.errors.fileRequired':
      return 'Please select a chart screenshot.';
    case 'visionAnalysis.errors.fileTooLarge':
      return `File exceeds the ${CHART_ANALYSIS_MAX_BYTES / (1024 * 1024)} MB limit.`;
    case 'visionAnalysis.errors.fileBadMime':
      return 'Unsupported image format.';
    default:
      return 'Invalid file.';
  }
}

export default TradeChartUpload;
