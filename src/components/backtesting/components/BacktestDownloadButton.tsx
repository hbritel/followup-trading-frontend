
import React from 'react';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';

interface BacktestDownloadButtonProps {
  backtestId: string;
  onDownload?: () => void;
}

const BacktestDownloadButton: React.FC<BacktestDownloadButtonProps> = ({ 
  backtestId, 
  onDownload 
}) => {
  const handleDownload = () => {
    console.log(`Downloading backtest data for ID: ${backtestId}`);
    if (onDownload) onDownload();
    // In a real app, this would trigger a download of the backtest data
  };

  return (
    <Button 
      variant="outline" 
      size="sm" 
      onClick={handleDownload}
      className="flex items-center gap-1"
    >
      <Download className="h-4 w-4" />
      <span>Download</span>
    </Button>
  );
};

export default BacktestDownloadButton;
