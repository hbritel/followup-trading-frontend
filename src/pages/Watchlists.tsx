
import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Import components
import WatchlistsSidebar from '@/components/watchlists/WatchlistsSidebar';
import WatchlistContent from '@/components/watchlists/WatchlistContent';
import StockSummaryCards from '@/components/watchlists/StockSummaryCards';
import WatchlistDialogs from '@/components/watchlists/WatchlistDialogs';
import { WatchlistFormValues } from '@/components/watchlists/WatchlistForm';
import { SymbolFormValues } from '@/components/watchlists/SymbolForm';
import { StockData } from '@/components/watchlists/StockTable';

// Sample data
const initialWatchlists = [
  { id: 1, name: 'Tech Stocks', description: 'Major technology companies', symbols: 15 },
  { id: 2, name: 'Dividend Aristocrats', description: 'Companies with consistent dividend growth', symbols: 23 },
  { id: 3, name: 'Growth Opportunities', description: 'High growth potential stocks', symbols: 18 },
  { id: 4, name: 'ETFs', description: 'Exchange-traded funds', symbols: 10 },
  { id: 5, name: 'Earnings This Week', description: 'Companies reporting earnings', symbols: 7 },
];

const initialTechStocksData = [
  { symbol: 'AAPL', name: 'Apple Inc.', price: 182.52, change: 2.34, changePercent: 1.28, volume: '24.5M', marketCap: '2.87T', starred: true },
  { symbol: 'MSFT', name: 'Microsoft Corp.', price: 337.94, change: 3.76, changePercent: 1.12, volume: '18.2M', marketCap: '2.51T', starred: true },
  { symbol: 'GOOGL', name: 'Alphabet Inc.', price: 122.23, change: 1.85, changePercent: 1.53, volume: '22.8M', marketCap: '1.54T', starred: false },
  { symbol: 'AMZN', name: 'Amazon.com Inc.', price: 127.90, change: 2.10, changePercent: 1.67, volume: '31.4M', marketCap: '1.32T', starred: true },
  { symbol: 'META', name: 'Meta Platforms Inc.', price: 326.49, change: 5.23, changePercent: 1.62, volume: '16.7M', marketCap: '838.2B', starred: false },
  { symbol: 'TSLA', name: 'Tesla Inc.', price: 193.17, change: -2.76, changePercent: -1.41, volume: '43.5M', marketCap: '612.9B', starred: false },
  { symbol: 'NVDA', name: 'NVIDIA Corp.', price: 426.92, change: 8.47, changePercent: 2.02, volume: '35.1M', marketCap: '1.05T', starred: true },
  { symbol: 'AMD', name: 'Advanced Micro Devices', price: 122.41, change: 2.31, changePercent: 1.92, volume: '27.6M', marketCap: '197.5B', starred: false },
  { symbol: 'INTC', name: 'Intel Corp.', price: 33.96, change: -0.52, changePercent: -1.51, volume: '32.8M', marketCap: '142.3B', starred: false },
  { symbol: 'CRM', name: 'Salesforce Inc.', price: 217.43, change: 3.85, changePercent: 1.80, volume: '12.3M', marketCap: '211.8B', starred: false },
  { symbol: 'ADBE', name: 'Adobe Inc.', price: 472.63, change: 7.34, changePercent: 1.57, volume: '8.7M', marketCap: '216.4B', starred: false },
  { symbol: 'CSCO', name: 'Cisco Systems Inc.', price: 45.87, change: 0.43, changePercent: 0.94, volume: '17.5M', marketCap: '187.1B', starred: false },
  { symbol: 'ORCL', name: 'Oracle Corp.', price: 118.76, change: 1.24, changePercent: 1.05, volume: '9.1M', marketCap: '324.3B', starred: false },
  { symbol: 'IBM', name: 'IBM Corp.', price: 143.62, change: 1.87, changePercent: 1.32, volume: '5.4M', marketCap: '132.1B', starred: false },
  { symbol: 'NFLX', name: 'Netflix Inc.', price: 398.25, change: 5.73, changePercent: 1.46, volume: '10.8M', marketCap: '177.6B', starred: false },
];

const Watchlists = () => {
  const { toast } = useToast();
  const [watchlists, setWatchlists] = useState(initialWatchlists);
  const [activeWatchlist, setActiveWatchlist] = useState('1');
  const [searchQuery, setSearchQuery] = useState('');
  const [stocksData, setStocksData] = useState<StockData[]>(initialTechStocksData);
  const [showFavorites, setShowFavorites] = useState(false);
  const [editingWatchlist, setEditingWatchlist] = useState<{ id: number, name: string, description: string } | null>(null);
  const [watchlistToDelete, setWatchlistToDelete] = useState<number | null>(null);
  
  // Dialog open states
  const [openNewWatchlistDialog, setOpenNewWatchlistDialog] = useState(false);
  const [openEditWatchlistDialog, setOpenEditWatchlistDialog] = useState(false);
  const [openAddSymbolDialog, setOpenAddSymbolDialog] = useState(false);
  const [openDeleteWatchlistDialog, setOpenDeleteWatchlistDialog] = useState(false);

  const activeWatchlistData = watchlists.find(
    watchlist => watchlist.id.toString() === activeWatchlist
  );

  const handleToggleFavorite = (symbol: string) => {
    setStocksData(stocks => 
      stocks.map(stock => 
        stock.symbol === symbol 
          ? { ...stock, starred: !stock.starred } 
          : stock
      )
    );
    
    toast({
      title: "Favorites updated",
      description: `${symbol} ${stocksData.find(s => s.symbol === symbol)?.starred ? 'removed from' : 'added to'} favorites`,
    });
  };

  const handleCreateWatchlist = (data: WatchlistFormValues) => {
    const newWatchlist = {
      id: watchlists.length + 1,
      name: data.name,
      description: data.description,
      symbols: 0,
    };
    
    setWatchlists([...watchlists, newWatchlist]);
    setActiveWatchlist(newWatchlist.id.toString());
    setOpenNewWatchlistDialog(false);
    
    toast({
      title: "Watchlist created",
      description: `${data.name} watchlist has been created`
    });
  };

  const handleEditWatchlist = (data: WatchlistFormValues) => {
    if (!editingWatchlist) return;
    
    setWatchlists(lists => 
      lists.map(list => 
        list.id === editingWatchlist.id 
          ? { ...list, name: data.name, description: data.description } 
          : list
      )
    );
    
    setOpenEditWatchlistDialog(false);
    setEditingWatchlist(null);
    
    toast({
      title: "Watchlist updated",
      description: `${data.name} watchlist has been updated`
    });
  };

  const handleDeleteWatchlist = () => {
    if (!watchlistToDelete) return;
    
    setWatchlists(lists => lists.filter(list => list.id !== watchlistToDelete));
    
    if (activeWatchlist === watchlistToDelete.toString() && watchlists.length > 1) {
      setActiveWatchlist(watchlists[0].id.toString());
    }
    
    setOpenDeleteWatchlistDialog(false);
    setWatchlistToDelete(null);
    
    toast({
      title: "Watchlist deleted",
      description: `Watchlist has been removed`
    });
  };

  const handleAddSymbol = (data: SymbolFormValues) => {
    const newSymbol = {
      symbol: data.symbol.toUpperCase(),
      name: data.name,
      price: Math.random() * 500 + 50,
      change: Math.random() * 10 - 5,
      changePercent: Math.random() * 5 - 2.5,
      volume: `${Math.floor(Math.random() * 30) + 1}.${Math.floor(Math.random() * 9)}M`,
      marketCap: `${Math.floor(Math.random() * 1000) + 1}.${Math.floor(Math.random() * 9)}B`,
      starred: false,
    };
    
    setStocksData([newSymbol, ...stocksData]);
    
    // Update watchlist symbols count
    setWatchlists(lists => 
      lists.map(list => 
        list.id.toString() === activeWatchlist 
          ? { ...list, symbols: list.symbols + 1 } 
          : list
      )
    );
    
    setOpenAddSymbolDialog(false);
    
    toast({
      title: "Symbol added",
      description: `${data.symbol.toUpperCase()} has been added to the watchlist`
    });
  };

  const handleRemoveSymbol = (symbol: string) => {
    setStocksData(stocks => stocks.filter(stock => stock.symbol !== symbol));
    
    // Update watchlist symbols count
    setWatchlists(lists => 
      lists.map(list => 
        list.id.toString() === activeWatchlist 
          ? { ...list, symbols: list.symbols - 1 } 
          : list
      )
    );
    
    toast({
      title: "Symbol removed",
      description: `${symbol} has been removed from the watchlist`
    });
  };

  const openEditDialog = (watchlist: typeof watchlists[0]) => {
    setEditingWatchlist(watchlist);
    setOpenEditWatchlistDialog(true);
  };

  const openDeleteDialog = (id: number) => {
    setWatchlistToDelete(id);
    setOpenDeleteWatchlistDialog(true);
  };

  return (
    <DashboardLayout pageTitle="Watchlists">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Stock Watchlists</h1>
            <p className="text-muted-foreground">Monitor and track your favorite securities</p>
          </div>
          <Button onClick={() => setOpenNewWatchlistDialog(true)}>
            <PlusCircle className="h-4 w-4 mr-2" />
            New Watchlist
          </Button>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <WatchlistsSidebar 
            watchlists={watchlists}
            activeWatchlist={activeWatchlist}
            onSelectWatchlist={setActiveWatchlist}
            onAddWatchlist={() => setOpenNewWatchlistDialog(true)}
            onEditWatchlist={openEditDialog}
            onDeleteWatchlist={openDeleteDialog}
          />
          
          <WatchlistContent 
            title={activeWatchlistData?.name || 'Watchlist'}
            description={activeWatchlistData?.description || 'Your securities'}
            stocks={stocksData}
            searchQuery={searchQuery}
            showFavorites={showFavorites}
            onEditClick={() => {
              if (activeWatchlistData) {
                openEditDialog(activeWatchlistData);
              }
            }}
            onAddSymbolClick={() => setOpenAddSymbolDialog(true)}
            onSearchChange={setSearchQuery}
            onToggleFavorites={(value) => setShowFavorites(value === "favorites")}
            onToggleStarred={handleToggleFavorite}
            onRemoveSymbol={handleRemoveSymbol}
          />
        </div>
        
        <StockSummaryCards stocks={stocksData} />
      </div>

      <WatchlistDialogs 
        newWatchlistOpen={openNewWatchlistDialog}
        editWatchlistOpen={openEditWatchlistDialog}
        addSymbolOpen={openAddSymbolDialog}
        deleteWatchlistOpen={openDeleteWatchlistDialog}
        editingWatchlist={editingWatchlist}
        onNewWatchlistOpenChange={setOpenNewWatchlistDialog}
        onEditWatchlistOpenChange={setOpenEditWatchlistDialog}
        onAddSymbolOpenChange={setOpenAddSymbolDialog}
        onDeleteWatchlistOpenChange={setOpenDeleteWatchlistDialog}
        onCreateWatchlist={handleCreateWatchlist}
        onEditWatchlist={handleEditWatchlist}
        onAddSymbol={handleAddSymbol}
        onCancelDelete={() => setOpenDeleteWatchlistDialog(false)}
        onConfirmDelete={handleDeleteWatchlist}
      />
    </DashboardLayout>
  );
};

export default Watchlists;
