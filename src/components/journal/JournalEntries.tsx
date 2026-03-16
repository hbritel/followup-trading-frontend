
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Eye, Edit, Trash } from "lucide-react";
import { Badge } from "@/components/ui/badge";
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
import type { JournalEntryResponseDto } from '@/types/dto';

interface JournalEntriesProps {
  entries: JournalEntryResponseDto[];
  onView: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

const MOOD_LABELS: Record<number, { label: string; color: string }> = {
  1: { label: 'Very Bad', color: 'bg-red-600/90 text-white' },
  2: { label: 'Bad', color: 'bg-orange-500/90 text-white' },
  3: { label: 'Neutral', color: 'bg-amber-500/90 text-white' },
  4: { label: 'Good', color: 'bg-lime-500/90 text-white' },
  5: { label: 'Great', color: 'bg-emerald-500/90 text-white' },
};

const JournalEntries: React.FC<JournalEntriesProps> = ({
  entries,
  onView,
  onEdit,
  onDelete
}) => {
  const { t } = useTranslation();

  return (
    <Card className="glass-card rounded-2xl">
      <CardHeader>
        <CardTitle className="text-gradient">{t('journal.entries')}</CardTitle>
        <CardDescription>{t('journal.entriesDescription')}</CardDescription>
      </CardHeader>
      <CardContent>
        {entries.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {t('journal.noEntries')}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="label-caps">{t('journal.date')}</TableHead>
                <TableHead className="label-caps">{t('journal.mood')}</TableHead>
                <TableHead className="label-caps">{t('journal.content')}</TableHead>
                <TableHead className="label-caps">{t('journal.tags')}</TableHead>
                <TableHead className="label-caps text-right">{t('common.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.map((entry) => {
                const mood = MOOD_LABELS[entry.mood] ?? MOOD_LABELS[3];
                return (
                  <TableRow key={entry.id}>
                    <TableCell className="font-mono text-sm tabular-nums">{entry.date}</TableCell>
                    <TableCell>
                      <Badge className={`${mood.color} font-mono text-xs`}>{mood.label}</Badge>
                    </TableCell>
                    <TableCell className="max-w-xs truncate text-sm">
                      {entry.content ?? '-'}
                    </TableCell>
                    <TableCell>
                      {entry.tags
                        ? <span className="font-mono text-xs border border-border rounded px-1.5 py-0.5 bg-accent/10">{entry.tags}</span>
                        : '-'}
                    </TableCell>
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
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};

export default JournalEntries;
