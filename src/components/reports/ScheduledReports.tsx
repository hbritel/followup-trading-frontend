
import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PlusCircle } from "lucide-react";

interface ScheduledReportsProps {
  onCreateSchedule: () => void;
}

const ScheduledReports: React.FC<ScheduledReportsProps> = ({ onCreateSchedule }) => {
  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <CardTitle>Scheduled Reports</CardTitle>
        <CardDescription>Auto-generated reports based on schedule</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="rounded-md border p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">Weekly Performance Summary</h3>
                <p className="text-sm text-muted-foreground">Every Monday at 8:00 AM</p>
              </div>
              <Badge>Active</Badge>
            </div>
          </div>
          <div className="rounded-md border p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">Monthly Trading Report</h3>
                <p className="text-sm text-muted-foreground">1st day of each month at 9:00 AM</p>
              </div>
              <Badge>Active</Badge>
            </div>
          </div>
          <div className="rounded-md border p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">Quarterly Performance Review</h3>
                <p className="text-sm text-muted-foreground">Every 3 months on the 1st at 10:00 AM</p>
              </div>
              <Badge variant="outline">Paused</Badge>
            </div>
          </div>
          <Button variant="outline" className="w-full" onClick={onCreateSchedule}>
            <PlusCircle className="h-4 w-4 mr-2" />
            Create Schedule
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ScheduledReports;
