
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Eye, Edit, Trash } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

const JournalEntries = () => {
  const { t } = useTranslation();
  
  // Mock data for journal entries
  const journalEntries = [
    { 
      id: 1, 
      date: new Date(2023, 10, 15), 
      title: "Weekly market review", 
      marketConditions: "Bullish",
      trades: 3
    },
    { 
      id: 2, 
      date: new Date(2023, 10, 12), 
      title: "Earnings analysis", 
      marketConditions: "Mixed",
      trades: 2
    },
    { 
      id: 3, 
      date: new Date(2023, 10, 8), 
      title: "Market reversal strategy", 
      marketConditions: "Bearish",
      trades: 1
    },
    { 
      id: 4, 
      date: new Date(2023, 10, 5), 
      title: "Breakout pattern study", 
      marketConditions: "Bullish",
      trades: 4
    },
  ];
  
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
            {journalEntries.map((entry) => (
              <TableRow key={entry.id}>
                <TableCell>{format(entry.date, 'MMM dd, yyyy')}</TableCell>
                <TableCell>{entry.title}</TableCell>
                <TableCell>{getMarketConditionBadge(entry.marketConditions)}</TableCell>
                <TableCell>{entry.trades}</TableCell>
                <TableCell className="flex justify-end gap-2">
                  <Button size="icon" variant="ghost">
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost">
                    <Trash className="h-4 w-4" />
                  </Button>
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
