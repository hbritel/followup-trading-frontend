// src/components/trades/ImportDialog.tsx
import React, { useCallback, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Upload, FileText, X, ChevronDown, ChevronUp, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useImportTrades } from '@/hooks/useImportTrades';
import type { TradeImportResult } from '@/services/import.service';

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
const ACCEPTED_EXTENSIONS = ['.csv', '.html'];
const ACCEPTED_MIME_TYPES = ['text/csv', 'text/html', 'application/csv'];

type Step = 'upload' | 'processing' | 'result';

interface ImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const FORMAT_OPTIONS = [
  { value: 'AUTO', labelKey: 'import.formatAuto', fallback: 'Auto-detect' },
  { value: 'MT5_CSV', labelKey: 'import.formatMt5Csv', fallback: 'MT5 CSV' },
  { value: 'MT5_HTML', labelKey: 'import.formatMt5Html', fallback: 'MT5 HTML Report' },
  { value: 'CTRADER_CSV', labelKey: 'import.formatCtraderCsv', fallback: 'cTrader CSV' },
  { value: 'GENERIC_CSV', labelKey: 'import.formatGenericCsv', fallback: 'Generic CSV' },
];

const ImportDialog: React.FC<ImportDialogProps> = ({ open, onOpenChange }) => {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<Step>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [format, setFormat] = useState('AUTO');
  const [dragOver, setDragOver] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const [result, setResult] = useState<TradeImportResult | null>(null);
  const [errorDetailsExpanded, setErrorDetailsExpanded] = useState(false);

  const importMutation = useImportTrades();

  // --- File validation ---
  const validateFile = (f: File): string | null => {
    const ext = '.' + f.name.split('.').pop()?.toLowerCase();
    if (!ACCEPTED_EXTENSIONS.includes(ext) && !ACCEPTED_MIME_TYPES.includes(f.type)) {
      return t('import.invalidFile', 'Please select a CSV or HTML file');
    }
    if (f.size > MAX_FILE_SIZE_BYTES) {
      return t('import.fileTooLarge', 'File exceeds 10MB limit');
    }
    return null;
  };

  const handleFileSelected = (f: File) => {
    const error = validateFile(f);
    if (error) {
      setFileError(error);
      setFile(null);
    } else {
      setFileError(null);
      setFile(f);
    }
  };

  // --- Drag & Drop ---
  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) handleFileSelected(dropped);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) handleFileSelected(selected);
    // Reset so the same file can be re-selected after clearing
    e.target.value = '';
  };

  const handleDropzoneClick = () => {
    fileInputRef.current?.click();
  };

  const handleClearFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    setFile(null);
    setFileError(null);
  };

  // --- Import submission ---
  const handleImport = async () => {
    if (!file) return;
    setStep('processing');
    try {
      const importResult = await importMutation.mutateAsync({ file, format });
      setResult(importResult);
      setStep('result');
    } catch {
      // Error toast is handled in useImportTrades; go back to upload so user can retry
      setStep('upload');
    }
  };

  // --- Reset for "Import Another" ---
  const handleImportAnother = () => {
    setFile(null);
    setFileError(null);
    setFormat('AUTO');
    setResult(null);
    setErrorDetailsExpanded(false);
    setStep('upload');
  };

  // --- Dialog close: reset all state ---
  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen && step !== 'processing') {
      handleImportAnother();
      onOpenChange(false);
    } else if (nextOpen) {
      onOpenChange(true);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="glass-panel sm:max-w-md rounded-2xl border-white/10 p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-0">
          <DialogTitle className="text-lg font-semibold tracking-tight">
            {t('import.title', 'Import Trades')}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground text-sm">
            {step === 'result'
              ? t('import.resultDescription', 'Import complete. Review the results below.')
              : t('import.description', 'Upload a broker export file to import your trades.')}
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 pb-6 pt-4 space-y-5">
          {/* ---- STEP: UPLOAD ---- */}
          {step === 'upload' && (
            <>
              {/* Drop zone */}
              <div
                role="button"
                tabIndex={0}
                aria-label={t('import.dropzone', 'Drop your CSV or HTML file here')}
                onClick={handleDropzoneClick}
                onKeyDown={(e) => e.key === 'Enter' && handleDropzoneClick()}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={[
                  'relative cursor-pointer rounded-2xl border-2 border-dashed p-8 text-center',
                  'transition-all duration-200 outline-none',
                  dragOver
                    ? 'border-primary/50 bg-primary/5 dark:shadow-[0_0_20px_hsl(var(--primary)/0.15)]'
                    : file
                    ? 'border-primary/30 bg-primary/[0.03]'
                    : 'border-muted-foreground/30 bg-muted/20 hover:border-muted-foreground/50 hover:bg-muted/30',
                  fileError ? 'border-destructive/50 bg-destructive/5' : '',
                ].filter(Boolean).join(' ')}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.html"
                  className="sr-only"
                  onChange={handleInputChange}
                  aria-hidden="true"
                />

                {file ? (
                  <div className="flex items-center justify-center gap-3">
                    <FileText className="h-8 w-8 text-primary flex-shrink-0" />
                    <div className="text-left min-w-0">
                      <p className="font-mono text-sm font-medium truncate max-w-[200px]">
                        {file.name}
                      </p>
                      <p className="text-xs text-muted-foreground tabular-nums">
                        {formatFileSize(file.size)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleClearFile}
                      className="ml-auto p-1 rounded-lg hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors"
                      aria-label="Remove file"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex justify-center">
                      <div className={[
                        'rounded-xl p-3 transition-colors',
                        dragOver ? 'bg-primary/20' : 'bg-muted/50',
                      ].join(' ')}>
                        <Upload className={[
                          'h-6 w-6 transition-colors',
                          dragOver ? 'text-primary' : 'text-muted-foreground',
                        ].join(' ')} />
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {t('import.dropzone', 'Drop your CSV or HTML file here')}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {t('import.browse', 'or click to browse')}
                      </p>
                    </div>
                    <p className="text-xs text-muted-foreground/70">
                      {t('import.maxSize', 'Maximum file size: 10MB')}
                    </p>
                  </div>
                )}
              </div>

              {/* File error */}
              {fileError && (
                <div className="flex items-center gap-2 text-destructive text-sm">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  <span>{fileError}</span>
                </div>
              )}

              {/* Format selector */}
              <div className="space-y-2">
                <Label className="label-caps text-muted-foreground">
                  {t('import.format', 'File Format')}
                </Label>
                <Select value={format} onValueChange={setFormat}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FORMAT_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {t(opt.labelKey, opt.fallback)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-1">
                <Button
                  variant="outline"
                  onClick={() => handleOpenChange(false)}
                >
                  {t('common.cancel', 'Cancel')}
                </Button>
                <Button
                  onClick={handleImport}
                  disabled={!file || !!fileError}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {t('import.import', 'Import')}
                </Button>
              </div>
            </>
          )}

          {/* ---- STEP: PROCESSING ---- */}
          {step === 'processing' && (
            <div className="flex flex-col items-center justify-center gap-4 py-8">
              <div className="rounded-full bg-primary/10 p-4">
                <Loader2 className="h-8 w-8 text-primary animate-spin" />
              </div>
              <div className="text-center space-y-1">
                <p className="text-sm font-medium text-foreground">
                  {t('import.importing', 'Importing trades...')}
                </p>
                {file && (
                  <p className="font-mono text-xs text-muted-foreground truncate max-w-[260px]">
                    {file.name}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* ---- STEP: RESULT ---- */}
          {step === 'result' && result && (
            <>
              {/* Summary cards */}
              <div className="grid grid-cols-3 gap-3">
                {/* Imported */}
                <div className="glass-card rounded-xl p-3 text-center space-y-1 border-profit/20 dark:shadow-[0_0_16px_rgba(16,185,129,0.08)]">
                  <p className="label-caps text-muted-foreground">
                    {t('import.imported', 'Imported')}
                  </p>
                  <p className="kpi-value text-2xl text-profit tabular-nums">
                    {result.imported}
                  </p>
                </div>

                {/* Skipped */}
                <div className="glass-card rounded-xl p-3 text-center space-y-1 border-amber-500/20">
                  <p className="label-caps text-muted-foreground">
                    {t('import.skipped', 'Skipped')}
                  </p>
                  <p className="kpi-value text-2xl text-amber-400 tabular-nums">
                    {result.skippedDuplicates}
                  </p>
                </div>

                {/* Errors */}
                <div className={[
                  'glass-card rounded-xl p-3 text-center space-y-1',
                  result.errors > 0 ? 'border-destructive/20 dark:shadow-[0_0_16px_rgba(248,113,113,0.08)]' : '',
                ].join(' ')}>
                  <p className="label-caps text-muted-foreground">
                    {t('import.errors', 'Errors')}
                  </p>
                  <p className={[
                    'kpi-value text-2xl tabular-nums',
                    result.errors > 0 ? 'text-loss' : 'text-muted-foreground',
                  ].join(' ')}>
                    {result.errors}
                  </p>
                </div>
              </div>

              {/* Total parsed hint */}
              <p className="text-center text-xs text-muted-foreground tabular-nums">
                {result.totalParsed} {t('import.totalParsed', 'records parsed total')}
              </p>

              {/* Status icon */}
              <div className="flex justify-center">
                {result.errors === 0 ? (
                  <div className="flex items-center gap-2 text-profit text-sm font-medium">
                    <CheckCircle2 className="h-4 w-4" />
                    {t('import.success', 'Trades imported successfully')}
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-amber-400 text-sm font-medium">
                    <AlertCircle className="h-4 w-4" />
                    {t('import.partialSuccess', 'Imported with some errors')}
                  </div>
                )}
              </div>

              {/* Error details (expandable) */}
              {result.errorDetails && result.errorDetails.length > 0 && (
                <div className="glass-card rounded-xl overflow-hidden">
                  <button
                    type="button"
                    className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-foreground hover:bg-muted/20 transition-colors"
                    onClick={() => setErrorDetailsExpanded((v) => !v)}
                  >
                    <span className="flex items-center gap-2 text-loss">
                      <AlertCircle className="h-4 w-4" />
                      {t('import.errorDetails', 'Error details')}
                      <span className="tabular-nums font-mono text-xs text-muted-foreground">
                        ({result.errorDetails.length})
                      </span>
                    </span>
                    {errorDetailsExpanded ? (
                      <ChevronUp className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    )}
                  </button>

                  {errorDetailsExpanded && (
                    <ul className="px-4 pb-3 space-y-1 max-h-40 overflow-y-auto">
                      {result.errorDetails.map((detail, idx) => (
                        <li
                          key={idx}
                          className="font-mono text-xs text-muted-foreground leading-relaxed border-l-2 border-destructive/40 pl-2"
                        >
                          {detail}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-1">
                <Button variant="outline" onClick={handleImportAnother}>
                  <Upload className="h-4 w-4 mr-2" />
                  {t('import.importAnother', 'Import Another')}
                </Button>
                <Button onClick={() => handleOpenChange(false)}>
                  {t('common.cancel', 'Close')}
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ImportDialog;
