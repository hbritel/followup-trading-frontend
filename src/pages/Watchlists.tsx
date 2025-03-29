
import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  PlusCircle, 
  Search, 
  Star, 
  Pencil, 
  Trash2, 
  ArrowUpRight, 
  Edit2,
  Save,
  X
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
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
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';

// Types for the watchlist data
type Watchlist = {
  id: number;
  name: string;
  description: string;
  symbols: number;
};

type StockData = {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: string;
  marketCap: string;
  starred: boolean;
};

// Sample data
const initialWatchlists: Watchlist[] = [
  { id: 1, name: 'Tech Stocks', description: 'Major technology companies', symbols: 15 },
  { id: 2, name: 'Dividend Aristocrats', description: 'Companies with consistent dividend growth', symbols: 23 },
  { id: 3, name: 'Growth Opportunities', description: 'High growth potential stocks', symbols: 18 },
  { id: 4, name: 'ETFs', description: 'Exchange-traded funds', symbols: 10 },
  { id: 5, name: 'Earnings This Week', description: 'Companies reporting earnings', symbols: 7 },
];

const techStocksData: StockData[] = [
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

// Sample symbols to add to watchlist
const availableSymbols = [
  { symbol: 'PYPL', name: 'PayPal Holdings Inc.' },
  { symbol: 'BABA', name: 'Alibaba Group Holding Ltd.' },
  { symbol: 'SHOP', name: 'Shopify Inc.' },
  { symbol: 'SQ', name: 'Block Inc.' },
  { symbol: 'ZM', name: 'Zoom Video Communications Inc.' },
];

const Watchlists = () => {
  const [watchlists, setWatchlists] = useState<Watchlist[]>(initialWatchlists);
  const [activeWatchlist, setActiveWatchlist] = useState('1');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFavorites, setShowFavorites] = useState(false);
  const [stocks, setStocks] = useState<StockData[]>(techStocksData);
  
  // Dialogs state
  const [isNewWatchlistOpen, setIsNewWatchlistOpen] = useState(false);
  const [isEditWatchlistOpen, setIsEditWatchlistOpen] = useState(false);
  const [isAddSymbolOpen, setIsAddSymbolOpen] = useState(false);
  const [selectedWatchlist, setSelectedWatchlist] = useState<Watchlist | null>(null);
  const [watchlistForm, setWatchlistForm] = useState({ name: '', description: '' });
  
  const { toast } = useToast();

  // Filter stocks based on search query and favorites filter
  const filteredStocks = stocks.filter(stock => {
    const matchesSearch = stock.symbol.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         stock.name.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (showFavorites) {
      return matchesSearch && stock.starred;
    }
    
    return matchesSearch;
  });

  // Handle star/unstar (favorite/unfavorite) a stock
  const handleToggleStar = (symbol: string) => {
    setStocks(stocks.map(stock => 
      stock.symbol === symbol 
        ? { ...stock, starred: !stock.starred } 
        : stock
    ));
    
    toast({
      title: `${symbol} ${stocks.find(s => s.symbol === symbol)?.starred ? 'removed from' : 'added to'} favorites`,
      description: "Your watchlist has been updated",
    });
  };

  // Handle adding a new watchlist
  const handleAddWatchlist = () => {
    if (!watchlistForm.name.trim()) {
      toast({
        title: "Error",
        description: "Watchlist name is required",
        variant: "destructive",
      });
      return;
    }
    
    const newWatchlist: Watchlist = {
      id: Math.max(...watchlists.map(w => w.id), 0) + 1,
      name: watchlistForm.name,
      description: watchlistForm.description,
      symbols: 0,
    };
    
    setWatchlists([...watchlists, newWatchlist]);
    setWatchlistForm({ name: '', description: '' });
    setIsNewWatchlistOpen(false);
    
    toast({
      title: "Watchlist created",
      description: `${newWatchlist.name} has been added to your watchlists`,
    });
  };

  // Handle editing a watchlist
  const handleEditWatchlist = () => {
    if (!selectedWatchlist) return;
    if (!watchlistForm.name.trim()) {
      toast({
        title: "Error",
        description: "Watchlist name is required",
        variant: "destructive",
      });
      return;
    }
    
    setWatchlists(watchlists.map(watchlist => 
      watchlist.id === selectedWatchlist.id 
        ? { ...watchlist, name: watchlistForm.name, description: watchlistForm.description } 
        : watchlist
    ));
    
    setIsEditWatchlistOpen(false);
    
    toast({
      title: "Watchlist updated",
      description: `${watchlistForm.name} has been updated`,
    });
  };

  // Handle deleting a watchlist
  const handleDeleteWatchlist = (id: number) => {
    setWatchlists(watchlists.filter(watchlist => watchlist.id !== id));
    
    if (parseInt(activeWatchlist) === id && watchlists.length > 1) {
      const remainingWatchlists = watchlists.filter(watchlist => watchlist.id !== id);
      setActiveWatchlist(remainingWatchlists[0]?.id.toString() || '1');
    }
    
    toast({
      title: "Watchlist deleted",
      description: "The watchlist has been removed",
    });
  };

  // Handle opening edit watchlist dialog
  const handleOpenEditDialog = (watchlist: Watchlist) => {
    setSelectedWatchlist(watchlist);
    setWatchlistForm({
      name: watchlist.name,
      description: watchlist.description,
    });
    setIsEditWatchlistOpen(true);
  };

  // Handle adding a symbol to the watchlist
  const handleAddSymbol = (symbol: string, name: string) => {
    // Check if the symbol already exists
    if (stocks.find(s => s.symbol === symbol)) {
      toast({
        title: "Symbol already exists",
        description: `${symbol} is already in this watchlist`,
        variant: "destructive",
      });
      return;
    }
    
    const newStock: StockData = {
      symbol,
      name,
      price: +(Math.random() * 500).toFixed(2),
      change: +(Math.random() * 10 - 5).toFixed(2),
      changePercent: +(Math.random() * 5 - 2.5).toFixed(2),
      volume: `${(Math.random() * 20).toFixed(1)}M`,
      marketCap: `${(Math.random() * 500).toFixed(1)}B`,
      starred: false,
    };
    
    setStocks([...stocks, newStock]);
    
    // Update the watchlist symbol count
    const currentWatchlist = watchlists.find(w => w.id.toString() === activeWatchlist);
    if (currentWatchlist) {
      setWatchlists(watchlists.map(w => 
        w.id.toString() === activeWatchlist 
          ? { ...w, symbols: w.symbols + 1 } 
          : w
      ));
    }
    
    setIsAddSymbolOpen(false);
    
    toast({
      title: "Symbol added",
      description: `${symbol} has been added to the watchlist`,
    });
  };

  // Handle removing a symbol from the watchlist
  const handleRemoveSymbol = (symbol: string) => {
    setStocks(stocks.filter(stock => stock.symbol !== symbol));
    
    // Update the watchlist symbol count
    const currentWatchlist = watchlists.find(w => w.id.toString() === activeWatchlist);
    if (currentWatchlist) {
      setWatchlists(watchlists.map(w => 
        w.id.toString() === activeWatchlist 
          ? { ...w, symbols: w.symbols - 1 } 
          : w
      ));
    }
    
    toast({
      title: "Symbol removed",
      description: `${symbol} has been removed from the watchlist`,
    });
  };

  return (
    <DashboardLayout pageTitle="Watchlists">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Stock Watchlists</h1>
            <p className="text-muted-foreground">Monitor and track your favorite securities</p>
          </div>
          <Button onClick={() => {
            setWatchlistForm({ name: '', description: '' });
            setIsNewWatchlistOpen(true);
          }}>
            <PlusCircle className="h-4 w-4 mr-2" />
            New Watchlist
          </Button>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>My Watchlists</CardTitle>
              <CardDescription>
                {watchlists.length} watchlists
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {watchlists.map((watchlist) => (
                  <div key={watchlist.id} className="flex items-center">
                    <Button
                      variant={activeWatchlist === watchlist.id.toString() ? 'default' : 'outline'}
                      className="w-full justify-between mr-1"
                      onClick={() => setActiveWatchlist(watchlist.id.toString())}
                    >
                      <div className="flex flex-col items-start">
                        <span>{watchlist.name}</span>
                        <span className="text-xs text-muted-foreground">{watchlist.symbols} symbols</span>
                      </div>
                    </Button>
                    <div className="flex flex-col">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleOpenEditDialog(watchlist)}>
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Watchlist</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete "{watchlist.name}"? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteWatchlist(watchlist.id)}>
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                ))}
                <Button 
                  variant="outline" 
                  className="w-full mt-4"
                  onClick={() => {
                    setWatchlistForm({ name: '', description: '' });
                    setIsNewWatchlistOpen(true);
                  }}
                >
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Add Watchlist
                </Button>
              </div>
            </CardContent>
          </Card>
          
          <Card className="lg:col-span-3">
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <CardTitle>
                    {watchlists.find(w => w.id.toString() === activeWatchlist)?.name || 'Tech Stocks'}
                  </CardTitle>
                  <CardDescription>
                    {watchlists.find(w => w.id.toString() === activeWatchlist)?.description || 'Major technology companies'}
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      const watchlist = watchlists.find(w => w.id.toString() === activeWatchlist);
                      if (watchlist) {
                        handleOpenEditDialog(watchlist);
                      }
                    }}
                  >
                    <Pencil className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setIsAddSymbolOpen(true)}
                  >
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Add Symbol
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between mb-4">
                <div className="relative w-full max-w-sm">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Search symbols..."
                    className="pl-8"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Tabs defaultValue={showFavorites ? "favorites" : "all"} className="hidden md:block" onValueChange={(value) => setShowFavorites(value === "favorites")}>
                  <TabsList>
                    <TabsTrigger value="all">All</TabsTrigger>
                    <TabsTrigger value="favorites">Favorites</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
              
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[40px]"></TableHead>
                      <TableHead>Symbol</TableHead>
                      <TableHead className="hidden md:table-cell">Name</TableHead>
                      <TableHead className="text-right">Price</TableHead>
                      <TableHead className="text-right">Chg%</TableHead>
                      <TableHead className="hidden lg:table-cell text-right">Volume</TableHead>
                      <TableHead className="w-[100px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredStocks.map((stock) => (
                      <TableRow key={stock.symbol}>
                        <TableCell>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8"
                            onClick={() => handleToggleStar(stock.symbol)}
                          >
                            <Star 
                              className={`h-4 w-4 ${stock.starred ? 'fill-primary text-primary' : 'text-muted-foreground'}`} 
                            />
                          </Button>
                        </TableCell>
                        <TableCell className="font-medium">
                          {stock.symbol}
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          {stock.name}
                        </TableCell>
                        <TableCell className="text-right">
                          ${stock.price}
                        </TableCell>
                        <TableCell className={`text-right ${stock.changePercent > 0 ? 'text-profit' : 'text-loss'}`}>
                          {stock.changePercent > 0 ? '+' : ''}{stock.changePercent}%
                        </TableCell>
                        <TableCell className="hidden lg:table-cell text-right">
                          {stock.volume}
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <ArrowUpRight className="h-4 w-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Remove Symbol</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to remove {stock.symbol} from this watchlist?
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleRemoveSymbol(stock.symbol)}>
                                    Remove
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {filteredStocks.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} className="h-24 text-center">
                          No stocks found. Try a different search or filter.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Top Gainers</CardTitle>
              <CardDescription>Best performing stocks today</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stocks
                  .filter(stock => stock.changePercent > 0)
                  .sort((a, b) => b.changePercent - a.changePercent)
                  .slice(0, 5)
                  .map((stock) => (
                    <div key={stock.symbol} className="flex justify-between items-center">
                      <div>
                        <div className="font-medium">{stock.symbol}</div>
                        <div className="text-xs text-muted-foreground">{stock.name}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">${stock.price}</div>
                        <div className="text-xs text-profit">+{stock.changePercent}%</div>
                      </div>
                    </div>
                  ))
                }
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Top Losers</CardTitle>
              <CardDescription>Worst performing stocks today</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stocks
                  .filter(stock => stock.changePercent < 0)
                  .sort((a, b) => a.changePercent - b.changePercent)
                  .slice(0, 5)
                  .map((stock) => (
                    <div key={stock.symbol} className="flex justify-between items-center">
                      <div>
                        <div className="font-medium">{stock.symbol}</div>
                        <div className="text-xs text-muted-foreground">{stock.name}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">${stock.price}</div>
                        <div className="text-xs text-loss">{stock.changePercent}%</div>
                      </div>
                    </div>
                  ))
                }
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>By Market Cap</CardTitle>
              <CardDescription>Largest companies by capitalization</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stocks
                  .sort((a, b) => {
                    const aValue = parseFloat(a.marketCap.replace(/[^0-9.]/g, ''));
                    const bValue = parseFloat(b.marketCap.replace(/[^0-9.]/g, ''));
                    return bValue - aValue;
                  })
                  .slice(0, 5)
                  .map((stock, index) => (
                    <div key={stock.symbol} className="flex justify-between items-center">
                      <div>
                        <div className="font-medium">
                          <Badge variant="outline" className="mr-2">{index + 1}</Badge>
                          {stock.symbol}
                        </div>
                        <div className="text-xs text-muted-foreground">{stock.name}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{stock.marketCap}</div>
                        <div className="text-xs text-muted-foreground">Market Cap</div>
                      </div>
                    </div>
                  ))
                }
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* New Watchlist Dialog */}
      <Dialog open={isNewWatchlistOpen} onOpenChange={setIsNewWatchlistOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Watchlist</DialogTitle>
            <DialogDescription>
              Add a new watchlist to track stocks or other securities.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium">Name</label>
              <Input 
                id="name" 
                placeholder="e.g., Tech Stocks"
                value={watchlistForm.name}
                onChange={(e) => setWatchlistForm({ ...watchlistForm, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="description" className="text-sm font-medium">Description</label>
              <Input 
                id="description" 
                placeholder="Optional description"
                value={watchlistForm.description}
                onChange={(e) => setWatchlistForm({ ...watchlistForm, description: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNewWatchlistOpen(false)}>Cancel</Button>
            <Button onClick={handleAddWatchlist}>Create Watchlist</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Watchlist Dialog */}
      <Dialog open={isEditWatchlistOpen} onOpenChange={setIsEditWatchlistOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Watchlist</DialogTitle>
            <DialogDescription>
              Update the details of your watchlist.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label htmlFor="edit-name" className="text-sm font-medium">Name</label>
              <Input 
                id="edit-name" 
                value={watchlistForm.name}
                onChange={(e) => setWatchlistForm({ ...watchlistForm, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="edit-description" className="text-sm font-medium">Description</label>
              <Input 
                id="edit-description" 
                value={watchlistForm.description}
                onChange={(e) => setWatchlistForm({ ...watchlistForm, description: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditWatchlistOpen(false)}>Cancel</Button>
            <Button onClick={handleEditWatchlist}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Symbol Dialog */}
      <Dialog open={isAddSymbolOpen} onOpenChange={setIsAddSymbolOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Symbol to Watchlist</DialogTitle>
            <DialogDescription>
              Select a symbol to add to your watchlist.
            </DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <div className="space-y-4 max-h-60 overflow-y-auto">
              {availableSymbols.map((item) => (
                <div 
                  key={item.symbol} 
                  className="flex justify-between items-center p-2 hover:bg-accent rounded-md cursor-pointer"
                  onClick={() => handleAddSymbol(item.symbol, item.name)}
                >
                  <div className="font-medium">{item.symbol}</div>
                  <div className="text-sm text-muted-foreground">{item.name}</div>
                </div>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddSymbolOpen(false)}>Cancel</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </DashboardLayout>
  );
};

export default Watchlists;
