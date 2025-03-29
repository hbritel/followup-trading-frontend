
import React from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Download, Share2, ArrowUpRight } from "lucide-react";

interface ReportCardProps {
  report: {
    id: number;
    title: string;
    description: string;
    date: string;
    category: string;
    status: string;
  };
  onShare: (id: number) => void;
  onDownload: (id: number) => void;
  onView: (id: number) => void;
}

const ReportCard: React.FC<ReportCardProps> = ({ 
  report, 
  onShare, 
  onDownload, 
  onView 
}) => {
  return (
    <Card key={report.id} className="overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center border-b border-border">
        <div className="flex-1 p-4">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            <h3 className="font-medium">{report.title}</h3>
            <Badge variant={report.status === 'ready' ? 'outline' : 'secondary'}>
              {report.status}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">{report.description}</p>
        </div>
        <div className="flex items-center gap-2 p-4 border-t sm:border-t-0 sm:border-l border-border bg-muted/30">
          <div className="text-xs text-muted-foreground mr-2">
            {report.date}
          </div>
          {report.status === 'ready' && (
            <>
              <Button 
                variant="outline" 
                size="sm" 
                className="h-8 w-8 p-0"
                onClick={() => onShare(report.id)}
              >
                <Share2 className="h-4 w-4" />
                <span className="sr-only">Share</span>
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="h-8 w-8 p-0"
                onClick={() => onDownload(report.id)}
              >
                <Download className="h-4 w-4" />
                <span className="sr-only">Download</span>
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="h-8 w-8 p-0"
                onClick={() => onView(report.id)}
              >
                <ArrowUpRight className="h-4 w-4" />
                <span className="sr-only">View</span>
              </Button>
            </>
          )}
        </div>
      </div>
    </Card>
  );
};

export default ReportCard;
