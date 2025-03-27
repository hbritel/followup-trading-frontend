import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Download, Upload } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface TradeImportExportProps {
  onImport?: (trades: any[]) => void;
  onExport?: () => void;
}

const TradeImportExport: React.FC<TradeImportExportProps> = ({ onImport, onExport }) => {
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);

  const handleExportCSV = () => {
    // In a real app, you would generate the CSV with actual trade data
    const headers = "Symbol,Type,Entry Price,Exit Price,Quantity,Date,Stop Loss,Take Profit,Fees,Status,P&L,P&L %,Notes,Created At,Updated At\n";
    const sampleData = [
      "AAPL,buy,180.00,182.52,10,2023-06-12,175.00,190.00,5.99,closed,+125.32,+6.86%,Strong earnings,2023-06-10,2023-06-12",
      "MSFT,buy,330.00,337.94,5,2023-06-10,325.00,345.00,5.99,closed,+87.45,+5.17%,Cloud growth,2023-06-08,2023-06-10"
    ].join('\n');
    
    const csvContent = `${headers}${sampleData}`;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'trades.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportExcel = () => {
    // Note: For real Excel export, you would typically use a library like xlsx
    // This is a simple CSV with Excel extension for demo purposes
    const headers = "Symbol,Type,Entry Price,Exit Price,Quantity,Date,Stop Loss,Take Profit,Fees,Status,P&L,P&L %,Notes,Created At,Updated At\n";
    const sampleData = [
      "AAPL,buy,180.00,182.52,10,2023-06-12,175.00,190.00,5.99,closed,+125.32,+6.86%,Strong earnings,2023-06-10,2023-06-12",
      "MSFT,buy,330.00,337.94,5,2023-06-10,325.00,345.00,5.99,closed,+87.45,+5.17%,Cloud growth,2023-06-08,2023-06-10"
    ].join('\n');
    
    const csvContent = `${headers}${sampleData}`;
    const blob = new Blob([csvContent], { type: 'application/vnd.ms-excel' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'trades.xlsx');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleImport = () => {
    if (!file) return;
    
    // In a real app, you would process the file here
    console.log(`Importing file: ${file.name}`);
    
    // Read the file content (for example, for CSV)
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        // Process the CSV data
        const csvData = event.target.result as string;
        console.log('CSV Data:', csvData);
        
        // Here you would parse the CSV and update your application state
        
        // Close the dialog after successful import
        setImportDialogOpen(false);
        
        // Reset the file state
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
          <DropdownMenuItem onClick={handleExportCSV}>
            Export as CSV
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleExportExcel}>
            Export as Excel
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Button variant="outline" onClick={() => setImportDialogOpen(true)}>
        <Upload className="h-4 w-4 mr-2" />
        Import
      </Button>

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
