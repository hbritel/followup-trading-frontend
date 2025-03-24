
import React from 'react';
import { PlusCircle, RotateCcw, GripVertical, X, Edit, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { WidgetType, useDashboardWidgets } from '@/hooks/use-dashboard-widgets';
import { useIsMobile } from '@/hooks/use-mobile';
import { toast } from 'sonner';

interface WidgetControlsProps {
  className?: string;
}

const WidgetControls = ({ className }: WidgetControlsProps) => {
  const { 
    isEditMode, 
    toggleEditMode, 
    resetWidgets, 
    addWidget, 
    getAvailableWidgetsToAdd 
  } = useDashboardWidgets();
  const [openDialog, setOpenDialog] = React.useState(false);
  const isMobile = useIsMobile();
  
  const availableWidgets = getAvailableWidgetsToAdd();
  
  const handleAddWidget = (type: WidgetType) => {
    addWidget(type);
    setOpenDialog(false);
    toast.success(`Added ${type} widget to dashboard`);
  };
  
  const handleReset = () => {
    resetWidgets();
    toast.success("Dashboard layout reset to default");
  };
  
  const handleToggleEditMode = () => {
    toggleEditMode();
    if (!isEditMode) {
      toast.info("Edit mode enabled. Drag widgets to reposition them.");
    }
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              variant={isEditMode ? "default" : "outline"} 
              size="sm"
              onClick={handleToggleEditMode}
            >
              {isEditMode ? (
                <><Save className="h-4 w-4 mr-2" /> Save Layout</>
              ) : (
                <><Edit className="h-4 w-4 mr-2" /> Edit Layout</>
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {isEditMode ? "Save layout changes" : "Edit dashboard layout"}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {isEditMode && (
        <>
          <Dialog open={openDialog} onOpenChange={setOpenDialog}>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" disabled={availableWidgets.length === 0}>
                      <PlusCircle className="h-4 w-4 mr-2" /> Add Widget
                    </Button>
                  </DialogTrigger>
                </TooltipTrigger>
                <TooltipContent>
                  Add new widgets to dashboard
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Add Widget</DialogTitle>
                <DialogDescription>
                  Select a widget to add to your dashboard.
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid gap-4 py-4">
                {availableWidgets.length > 0 ? (
                  availableWidgets.map((widget) => (
                    <Button 
                      key={widget.type} 
                      variant="outline" 
                      className="justify-start"
                      onClick={() => handleAddWidget(widget.type)}
                    >
                      {widget.title}
                    </Button>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">
                    All available widgets are already on your dashboard.
                  </p>
                )}
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpenDialog(false)}>
                  Cancel
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="sm" onClick={handleReset}>
                  <RotateCcw className="h-4 w-4 mr-2" /> Reset
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                Reset to default layout
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          {!isMobile && (
            <div className="px-4 py-1.5 bg-accent/50 rounded-md flex items-center">
              <GripVertical className="h-4 w-4 text-muted-foreground mr-2" />
              <span className="text-xs font-medium">Drag to rearrange</span>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default WidgetControls;
