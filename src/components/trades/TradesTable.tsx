
import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

interface TradesTableProps {
  visibleColumns: {
    symbol: boolean;
    type: boolean;
    price: boolean;
    quantity: boolean;
    date: boolean;
    status: boolean;
    pl: boolean;
    entryPrice: boolean;
    exitPrice: boolean;
    stoploss: boolean;
    takeProfit: boolean;
    fees: boolean;
    notes: boolean;
    createdAt: boolean;
    updatedAt: boolean;
    plPercentage: boolean;
  };
  searchQuery: string;
  statusFilter: string;
  typeFilter: string;
}

// Sample data - in a real app, this would come from an API or context
const tradesData = [
  { id: 1, symbol: 'AAPL', type: 'buy', price: 182.52, entryPrice: 180.00, exitPrice: 182.52, quantity: 10, date: '2023-06-12', status: 'closed', pl: '+125.32', plPercentage: '+6.86%', stoploss: 175.00, takeProfit: 190.00, fees: 5.99, notes: 'Strong earnings', createdAt: '2023-06-10', updatedAt: '2023-06-12' },
  { id: 2, symbol: 'MSFT', type: 'buy', price: 337.94, entryPrice: 330.00, exitPrice: 337.94, quantity: 5, date: '2023-06-10', status: 'closed', pl: '+87.45', plPercentage: '+5.17%', stoploss: 325.00, takeProfit: 345.00, fees: 5.99, notes: 'Cloud growth', createdAt: '2023-06-08', updatedAt: '2023-06-10' },
  { id: 3, symbol: 'TSLA', type: 'sell', price: 193.17, entryPrice: 200.00, exitPrice: 193.17, quantity: 8, date: '2023-06-08', status: 'closed', pl: '-43.21', plPercentage: '-2.79%', stoploss: 205.00, takeProfit: 185.00, fees: 5.99, notes: 'Market concerns', createdAt: '2023-06-06', updatedAt: '2023-06-08' },
  { id: 4, symbol: 'AMZN', type: 'buy', price: 127.90, entryPrice: 120.00, exitPrice: 127.90, quantity: 15, date: '2023-06-05', status: 'closed', pl: '+102.67', plPercentage: '+5.34%', stoploss: 115.00, takeProfit: 130.00, fees: 5.99, notes: 'Retail strength', createdAt: '2023-06-03', updatedAt: '2023-06-05' },
  { id: 5, symbol: 'GOOGL', type: 'buy', price: 122.23, entryPrice: 118.00, exitPrice: 122.23, quantity: 12, date: '2023-06-01', status: 'closed', pl: '+65.43', plPercentage: '+4.47%', stoploss: 115.00, takeProfit: 125.00, fees: 5.99, notes: 'AI advancements', createdAt: '2023-05-29', updatedAt: '2023-06-01' },
  { id: 6, symbol: 'NVDA', type: 'buy', price: 426.92, entryPrice: 426.92, exitPrice: null, quantity: 3, date: '2023-05-30', status: 'open', pl: '', plPercentage: '', stoploss: 400.00, takeProfit: 450.00, fees: 5.99, notes: 'AI chip demand', createdAt: '2023-05-30', updatedAt: '2023-05-30' },
  { id: 7, symbol: 'META', type: 'sell', price: 326.49, entryPrice: 315.00, exitPrice: 326.49, quantity: 6, date: '2023-05-25', status: 'closed', pl: '+93.76', plPercentage: '+4.78%', stoploss: 310.00, takeProfit: 330.00, fees: 5.99, notes: 'User growth', createdAt: '2023-05-23', updatedAt: '2023-05-25' },
  { id: 8, symbol: 'AMD', type: 'buy', price: 122.41, entryPrice: 122.41, exitPrice: null, quantity: 20, date: '2023-05-20', status: 'open', pl: '', plPercentage: '', stoploss: 115.00, takeProfit: 130.00, fees: 5.99, notes: 'Product launch', createdAt: '2023-05-20', updatedAt: '2023-05-20' },
  { id: 9, symbol: 'INTC', type: 'sell', price: 33.96, entryPrice: 36.00, exitPrice: 33.96, quantity: 30, date: '2023-05-15', status: 'closed', pl: '-48.90', plPercentage: '-4.58%', stoploss: 38.00, takeProfit: 32.00, fees: 5.99, notes: 'Competition', createdAt: '2023-05-13', updatedAt: '2023-05-15' },
  { id: 10, symbol: 'PYPL', type: 'buy', price: 60.12, entryPrice: 60.12, exitPrice: null, quantity: 15, date: '2023-05-10', status: 'open', pl: '', plPercentage: '', stoploss: 55.00, takeProfit: 65.00, fees: 5.99, notes: 'Payment trends', createdAt: '2023-05-10', updatedAt: '2023-05-10' },
];

const TradesTable: React.FC<TradesTableProps> = ({ 
  visibleColumns, 
  searchQuery,
  statusFilter,
  typeFilter 
}) => {
  // Filter trades based on search query and filters
  const filteredTrades = tradesData.filter(trade => {
    // Search query check
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = 
      searchQuery === '' || 
      trade.symbol.toLowerCase().includes(searchLower) ||
      trade.notes?.toLowerCase().includes(searchLower);

    // Status filter check
    const matchesStatus = 
      statusFilter === 'all' || 
      trade.status === statusFilter;

    // Type filter check
    const matchesType = 
      typeFilter === 'all' || 
      trade.type === typeFilter;

    return matchesSearch && matchesStatus && matchesType;
  });

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            {visibleColumns.symbol && <TableHead>Symbol</TableHead>}
            {visibleColumns.type && <TableHead>Type</TableHead>}
            {visibleColumns.entryPrice && <TableHead>Entry Price</TableHead>}
            {visibleColumns.exitPrice && <TableHead>Exit Price</TableHead>}
            {visibleColumns.price && <TableHead className="hidden md:table-cell">Price</TableHead>}
            {visibleColumns.quantity && <TableHead className="hidden md:table-cell">Quantity</TableHead>}
            {visibleColumns.date && <TableHead className="hidden md:table-cell">Date</TableHead>}
            {visibleColumns.stoploss && <TableHead>Stop Loss</TableHead>}
            {visibleColumns.takeProfit && <TableHead>Take Profit</TableHead>}
            {visibleColumns.fees && <TableHead>Fees</TableHead>}
            {visibleColumns.status && <TableHead>Status</TableHead>}
            {visibleColumns.pl && <TableHead className="text-right">P&L</TableHead>}
            {visibleColumns.plPercentage && <TableHead className="text-right hidden md:table-cell">P&L %</TableHead>}
            {visibleColumns.notes && <TableHead>Notes</TableHead>}
            {visibleColumns.createdAt && <TableHead className="hidden md:table-cell">Created</TableHead>}
            {visibleColumns.updatedAt && <TableHead className="hidden md:table-cell">Updated</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredTrades.length === 0 ? (
            <TableRow>
              <TableCell colSpan={Object.values(visibleColumns).filter(Boolean).length} className="text-center py-8 text-muted-foreground">
                No trades found matching your criteria
              </TableCell>
            </TableRow>
          ) : (
            filteredTrades.map((trade) => (
              <TableRow key={trade.id}>
                {visibleColumns.symbol && <TableCell className="font-medium">{trade.symbol}</TableCell>}
                {visibleColumns.type && (
                  <TableCell>
                    <Badge variant={trade.type === 'buy' ? 'default' : 'secondary'}>
                      {trade.type.toUpperCase()}
                    </Badge>
                  </TableCell>
                )}
                {visibleColumns.entryPrice && <TableCell>${trade.entryPrice}</TableCell>}
                {visibleColumns.exitPrice && <TableCell>{trade.exitPrice ? `$${trade.exitPrice}` : '-'}</TableCell>}
                {visibleColumns.price && <TableCell className="hidden md:table-cell">${trade.price}</TableCell>}
                {visibleColumns.quantity && <TableCell className="hidden md:table-cell">{trade.quantity}</TableCell>}
                {visibleColumns.date && <TableCell className="hidden md:table-cell">{trade.date}</TableCell>}
                {visibleColumns.stoploss && <TableCell>${trade.stoploss}</TableCell>}
                {visibleColumns.takeProfit && <TableCell>${trade.takeProfit}</TableCell>}
                {visibleColumns.fees && <TableCell>${trade.fees}</TableCell>}
                {visibleColumns.status && (
                  <TableCell>
                    <Badge variant={trade.status === 'open' ? 'outline' : 'secondary'}>
                      {trade.status}
                    </Badge>
                  </TableCell>
                )}
                {visibleColumns.pl && (
                  <TableCell className="text-right">
                    {trade.status === 'closed' ? (
                      <div className={trade.pl.startsWith('+') ? 'text-profit' : 'text-loss'}>
                        ${trade.pl}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                )}
                {visibleColumns.plPercentage && (
                  <TableCell className="hidden md:table-cell text-right">
                    {trade.status === 'closed' ? (
                      <div className={trade.plPercentage.startsWith('+') ? 'text-profit' : 'text-loss'}>
                        {trade.plPercentage}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                )}
                {visibleColumns.notes && <TableCell>{trade.notes}</TableCell>}
                {visibleColumns.createdAt && <TableCell className="hidden md:table-cell">{trade.createdAt}</TableCell>}
                {visibleColumns.updatedAt && <TableCell className="hidden md:table-cell">{trade.updatedAt}</TableCell>}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default TradesTable;
