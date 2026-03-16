
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Edit, Trash } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { StrategyResponseDto } from '@/types/dto';

interface StrategyListProps {
  strategies: StrategyResponseDto[];
  onEdit: (strategy: StrategyResponseDto) => void;
  onDelete: (id: string) => void;
  isDeleting?: boolean;
}

const StrategyList: React.FC<StrategyListProps> = ({ strategies, onEdit, onDelete, isDeleting }) => {
  const { t } = useTranslation();

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('playbook.strategies')}</CardTitle>
        <CardDescription>{t('playbook.strategiesDescription')}</CardDescription>
      </CardHeader>
      <CardContent>
        {strategies.length === 0 ? (
          <p className="text-center py-8 text-muted-foreground">{t('playbook.noStrategies')}</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('playbook.strategyName')}</TableHead>
                <TableHead>{t('playbook.description')}</TableHead>
                <TableHead>{t('playbook.status')}</TableHead>
                <TableHead className="text-right">{t('common.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {strategies.map((strategy) => (
                <TableRow key={strategy.id}>
                  <TableCell className="font-medium">{strategy.name}</TableCell>
                  <TableCell className="text-muted-foreground max-w-xs truncate">
                    {strategy.description ?? '\u2014'}
                  </TableCell>
                  <TableCell>
                    {strategy.active ? (
                      <Badge className="bg-green-500">{t('playbook.active')}</Badge>
                    ) : (
                      <Badge variant="secondary">{t('playbook.inactive')}</Badge>
                    )}
                  </TableCell>
                  <TableCell className="flex justify-end gap-2">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => onEdit(strategy)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => onDelete(strategy.id)}
                      disabled={isDeleting}
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};

export default StrategyList;
