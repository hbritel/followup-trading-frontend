import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Download, Upload, Loader2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Trade } from '@/components/trades/TradesTableWrapper';
import { tradeService } from '@/services/trade.service';

/** Column key → human-readable header */
const COLUMN_HEADERS: Record<string, string> = {
  symbol: 'Symbol',
  type: 'Direction',
  status: 'Status',
  entryDate: 'Entry Date',
  exitDate: 'Exit Date',
  entryPrice: 'Entry Price',
  exitPrice: 'Exit Price',
  quantity: 'Quantity',
  stopLoss: 'Stop Loss',
  takeProfit: 'Take Profit',
  profit: 'P&L',
  profitPercentage: 'P&L %',
  balance: 'Balance',
  fees: 'Fees',
  currency: 'Currency',
  strategy: 'Strategy',
  notes: 'Notes',
  tags: 'Tags',
  createdAt: 'Created At',
  updatedAt: 'Updated At',
};

/** All exportable column keys in display order */
const ALL_COLUMNS = Object.keys(COLUMN_HEADERS);

function getTradeValue(trade: Trade, col: string): string {
  const val = (trade as Record<string, unknown>)[col];
  if (val === undefined || val === null) return '';
  if (col === 'tags' && Array.isArray(val)) return (val as string[]).join('; ');
  if (col === 'profit' || col === 'balance' || col === 'fees') return String(Number(val).toFixed(2));
  if (col === 'profitPercentage') return String(Number(val).toFixed(2)) + '%';
  return String(val);
}

function escapeCsvField(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function buildCsv(trades: Trade[], columns: string[]): string {
  const headers = columns.map(c => COLUMN_HEADERS[c] || c);
  const rows = trades.map(trade =>
    columns.map(col => escapeCsvField(getTradeValue(trade, col))).join(',')
  );
  return [headers.join(','), ...rows].join('\n');
}

function downloadBlob(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

interface TradeImportExportProps {
  onImport?: (trades: any[]) => void;
  filteredTrades: Trade[];
  visibleColumns: Record<string, boolean>;
  accountFilter?: string;
  totalElements: number;
}

const TradeImportExport: React.FC<TradeImportExportProps> = ({
  onImport,
  filteredTrades,
  visibleColumns,
  accountFilter,
  totalElements,
}) => {
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState<'csv' | 'excel'>('csv');
  const [exportScope, setExportScope] = useState<'filtered' | 'all'>('filtered');
  const [exportColumns, setExportColumns] = useState<'visible' | 'all'>('visible');
  const [isExporting, setIsExporting] = useState(false);
  const [file, setFile] = useState<File | null>(null);

  const openExportDialog = (format: 'csv' | 'excel') => {
    setExportFormat(format);
    setExportScope('filtered');
    setExportColumns('visible');
    setExportDialogOpen(true);
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      // Determine which trades to export
      let tradesToExport: Trade[];
      if (exportScope === 'all') {
        tradesToExport = await tradeService.getAllTrades(
          accountFilter && accountFilter !== 'all' ? accountFilter : undefined
        );
      } else {
        tradesToExport = filteredTrades;
      }

      // Determine which columns to include
      const columns = exportColumns === 'visible'
        ? ALL_COLUMNS.filter(col => visibleColumns[col])
        : ALL_COLUMNS;

      const csv = buildCsv(tradesToExport, columns);
      const timestamp = new Date().toISOString().split('T')[0];

      if (exportFormat === 'csv') {
        downloadBlob(csv, `trades-${timestamp}.csv`, 'text/csv;charset=utf-8;');
      } else {
        downloadBlob(csv, `trades-${timestamp}.xlsx`, 'application/vnd.ms-excel');
      }

      setExportDialogOpen(false);
    } finally {
      setIsExporting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleImport = () => {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        const csvData = event.target.result as string;
        console.log('CSV Data:', csvData);
        setImportDialogOpen(false);
        setFile(null);
      }
    };
    reader.readAsText(file);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onClick={() => openExportDialog('csv')}>
            Export as CSV
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => openExportDialog('excel')}>
            Export as Excel
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Button variant="outline" onClick={() => setImportDialogOpen(true)}>
        <Upload className="h-4 w-4 mr-2" />
        Import
      </Button>

      {/* Export Options Dialog */}
      <Dialog open={exportDialogOpen} onOpenChange={setExportDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Export Trades</DialogTitle>
            <DialogDescription>
              Choose what data to include in your {exportFormat === 'csv' ? 'CSV' : 'Excel'} export.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-5 py-4">
            <div className="space-y-3">
              <Label className="text-sm font-medium">Data scope</Label>
              <div className="grid gap-2">
                <label className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-accent/50 transition-colors has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                  <input
                    type="radio"
                    name="scope"
                    value="filtered"
                    checked={exportScope === 'filtered'}
                    onChange={() => setExportScope('filtered')}
                    className="accent-primary"
                  />
                  <div>
                    <div className="text-sm font-medium">Current view</div>
                    <div className="text-xs text-muted-foreground">
                      {filteredTrades.length} trade{filteredTrades.length !== 1 ? 's' : ''} matching your filters
                    </div>
                  </div>
                </label>
                <label className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-accent/50 transition-colors has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                  <input
                    type="radio"
                    name="scope"
                    value="all"
                    checked={exportScope === 'all'}
                    onChange={() => setExportScope('all')}
                    className="accent-primary"
                  />
                  <div>
                    <div className="text-sm font-medium">All trades</div>
                    <div className="text-xs text-muted-foreground">
                      {totalElements} trade{totalElements !== 1 ? 's' : ''} total{accountFilter && accountFilter !== 'all' ? ' (selected account)' : ''}
                    </div>
                  </div>
                </label>
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-sm font-medium">Columns</Label>
              <div className="grid gap-2">
                <label className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-accent/50 transition-colors has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                  <input
                    type="radio"
                    name="columns"
                    value="visible"
                    checked={exportColumns === 'visible'}
                    onChange={() => setExportColumns('visible')}
                    className="accent-primary"
                  />
                  <div>
                    <div className="text-sm font-medium">Visible columns only</div>
                    <div className="text-xs text-muted-foreground">
                      {ALL_COLUMNS.filter(c => visibleColumns[c]).length} columns currently shown
                    </div>
                  </div>
                </label>
                <label className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-accent/50 transition-colors has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                  <input
                    type="radio"
                    name="columns"
                    value="all"
                    checked={exportColumns === 'all'}
                    onChange={() => setExportColumns('all')}
                    className="accent-primary"
                  />
                  <div>
                    <div className="text-sm font-medium">All columns</div>
                    <div className="text-xs text-muted-foreground">
                      {ALL_COLUMNS.length} columns including hidden ones
                    </div>
                  </div>
                </label>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setExportDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleExport} disabled={isExporting}>
              {isExporting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Export {exportFormat === 'csv' ? 'CSV' : 'Excel'}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Import Dialog */}
      <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import Trades</DialogTitle>
            <DialogDescription>
              Upload a CSV or Excel file containing your trade data.
              The file should include headers matching the expected format.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="flex items-center gap-4">
              <Input
                id="file-upload"
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileChange}
              />
            </div>
            {file && (
              <p className="text-sm text-muted-foreground">
                Selected file: {file.name}
              </p>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setImportDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleImport} disabled={!file}>
              Import
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default TradeImportExport;
