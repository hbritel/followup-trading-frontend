
import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface ReportTemplatesProps {
  onSelectTemplate: (template: string) => void;
}

const ReportTemplates: React.FC<ReportTemplatesProps> = ({ onSelectTemplate }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Report Templates</CardTitle>
        <CardDescription>Predefined report templates</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Button 
            variant="outline" 
            className="w-full justify-start"
            onClick={() => onSelectTemplate("Daily Summary")}
          >
            <div className="flex flex-col items-start text-left">
              <span className="font-medium">Daily Summary</span>
              <span className="text-xs text-muted-foreground">Daily trading performance summary</span>
            </div>
          </Button>
          <Button 
            variant="outline" 
            className="w-full justify-start"
            onClick={() => onSelectTemplate("Weekly Review")}
          >
            <div className="flex flex-col items-start text-left">
              <span className="font-medium">Weekly Review</span>
              <span className="text-xs text-muted-foreground">Weekly trading performance analysis</span>
            </div>
          </Button>
          <Button 
            variant="outline" 
            className="w-full justify-start"
            onClick={() => onSelectTemplate("Monthly Performance")}
          >
            <div className="flex flex-col items-start text-left">
              <span className="font-medium">Monthly Performance</span>
              <span className="text-xs text-muted-foreground">Comprehensive monthly report</span>
            </div>
          </Button>
          <Button 
            variant="outline" 
            className="w-full justify-start"
            onClick={() => onSelectTemplate("Strategy Analysis")}
          >
            <div className="flex flex-col items-start text-left">
              <span className="font-medium">Strategy Analysis</span>
              <span className="text-xs text-muted-foreground">Detailed strategy performance metrics</span>
            </div>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ReportTemplates;
