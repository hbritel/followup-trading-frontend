
import { apiService } from './apiService';
import { StockData } from '@/components/watchlists/StockTable';

export interface WatchlistItem {
  id: number;
  name: string;
  description: string;
  symbols: number;
}

export interface WatchlistDetailResponse {
  id: number;
  name: string;
  description: string;
  stocks: StockData[];
}

export interface CreateWatchlistRequest {
  name: string;
  description: string;
}

export interface AddSymbolRequest {
  symbol: string;
  watchlistId: number;
}

export const watchlistService = {
  // Récupérer toutes les watchlists de l'utilisateur
  getAllWatchlists: async (): Promise<WatchlistItem[]> => {
    return apiService.get('/watchlists');
  },

  // Récupérer une watchlist par ID avec ses stocks
  getWatchlistById: async (id: number): Promise<WatchlistDetailResponse> => {
    return apiService.get(`/watchlists/${id}`);
  },

  // Créer une nouvelle watchlist
  createWatchlist: async (data: CreateWatchlistRequest): Promise<WatchlistItem> => {
    return apiService.post('/watchlists', data);
  },

  // Mettre à jour une watchlist
  updateWatchlist: async (id: number, data: CreateWatchlistRequest): Promise<WatchlistItem> => {
    return apiService.put(`/watchlists/${id}`, data);
  },

  // Supprimer une watchlist
  deleteWatchlist: async (id: number): Promise<void> => {
    return apiService.delete(`/watchlists/${id}`);
  },

  // Ajouter un symbole à une watchlist
  addSymbol: async (data: AddSymbolRequest): Promise<void> => {
    return apiService.post(`/watchlists/${data.watchlistId}/symbols`, { symbol: data.symbol });
  },

  // Supprimer un symbole d'une watchlist
  removeSymbol: async (watchlistId: number, symbol: string): Promise<void> => {
    return apiService.delete(`/watchlists/${watchlistId}/symbols/${symbol}`);
  },
  
  // Mettre à jour le statut "favoris" d'un symbole
  toggleStarred: async (watchlistId: number, symbol: string, starred: boolean): Promise<void> => {
    return apiService.put(`/watchlists/${watchlistId}/symbols/${symbol}/starred`, { starred });
  },
};
