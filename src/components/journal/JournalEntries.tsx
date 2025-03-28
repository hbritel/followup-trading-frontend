
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Eye, Edit, Trash } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface JournalEntry {
  id: number;
  date: Date;
  title: string;
  marketConditions: string;
  trades: number;
  content?: string;
}

interface JournalEntriesProps {
  entries: JournalEntry[];
  onView: (id: number) => void;
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
}

const JournalEntries: React.FC<JournalEntriesProps> = ({ 
  entries,
  onView,
  onEdit,
  onDelete
}) => {
  const { t } = useTranslation();
  
  const getMarketConditionBadge = (condition: string) => {
    switch (condition.toLowerCase()) {
      case 'bullish':
        return <Badge className="bg-green-500">{condition}</Badge>;
      case 'bearish':
        return <Badge className="bg-red-500">{condition}</Badge>;
      default:
        return <Badge>{condition}</Badge>;
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('journal.entries')}</CardTitle>
        <CardDescription>{t('journal.entriesDescription')}</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('journal.date')}</TableHead>
              <TableHead>{t('journal.title')}</TableHead>
              <TableHead>{t('journal.marketConditions')}</TableHead>
              <TableHead>{t('journal.trades')}</TableHead>
              <TableHead className="text-right">{t('common.actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {entries.map((entry) => (
              <TableRow key={entry.id}>
                <TableCell>{format(entry.date, 'MMM dd, yyyy')}</TableCell>
                <TableCell>{entry.title}</TableCell>
                <TableCell>{getMarketConditionBadge(entry.marketConditions)}</TableCell>
                <TableCell>{entry.trades}</TableCell>
                <TableCell className="flex justify-end gap-2">
                  <Button size="icon" variant="ghost" onClick={() => onView(entry.id)}>
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => onEdit(entry.id)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="icon" variant="ghost">
                        <Trash className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>{t('journal.deleteEntry')}</AlertDialogTitle>
                        <AlertDialogDescription>
                          {t('journal.deleteEntryConfirmation')}
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                        <AlertDialogAction onClick={() => onDelete(entry.id)}>
                          {t('common.delete')}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default JournalEntries;
