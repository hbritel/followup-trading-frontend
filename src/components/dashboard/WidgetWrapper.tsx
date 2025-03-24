
import React from 'react';
import { X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useDashboardWidgets } from '@/hooks/use-dashboard-widgets';
import { toast } from 'sonner';

interface WidgetWrapperProps {
  id: string;
  title: string;
  children: React.ReactNode;
  className?: string;
}

const WidgetWrapper = ({ 
  id, 
  title, 
  children, 
  className 
}: WidgetWrapperProps) => {
  const { isEditMode, removeWidget } = useDashboardWidgets();

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    removeWidget(id);
    toast.success(`Removed ${title} widget`);
  };

  return (
    <Card 
      className={`h-full w-full ${isEditMode ? 'border-dashed border-2' : ''} ${className || ''}`}
    >
      <CardHeader 
        className="px-6 py-3 flex flex-row items-center justify-between card-header"
        style={{ cursor: isEditMode ? 'move' : 'default' }}
      >
        <CardTitle className="text-lg font-semibold">{title}</CardTitle>
        {isEditMode && (
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-6 w-6 p-0 rounded-full"
            onClick={handleRemove}
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Remove widget</span>
          </Button>
        )}
      </CardHeader>
      <CardContent className="p-0">
        {children}
      </CardContent>
    </Card>
  );
};

export default WidgetWrapper;
