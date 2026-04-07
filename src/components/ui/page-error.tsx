import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export interface PageErrorProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

/**
 * Reusable full-page error state component.
 * Uses glass-card styling consistent with the rest of the app.
 */
const PageError: React.FC<PageErrorProps> = ({
  title = 'Something went wrong',
  message = 'Could not load data. Please check your connection and try again.',
  onRetry,
}) => {
  return (
    <Card className="glass-card rounded-2xl border-destructive/30">
      <CardContent className="flex flex-col items-center justify-center gap-4 py-12 px-6 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10">
          <AlertCircle className="h-7 w-7 text-destructive" />
        </div>
        <div className="space-y-1.5">
          <h3 className="text-base font-semibold text-foreground">{title}</h3>
          <p className="text-sm text-muted-foreground max-w-sm">{message}</p>
        </div>
        {onRetry && (
          <Button variant="outline" size="sm" onClick={onRetry} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Try Again
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default PageError;
