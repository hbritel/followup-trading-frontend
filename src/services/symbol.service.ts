// src/services/symbol.service.ts
import apiClient from './apiClient';

export interface SymbolSpecification {
  symbol: string;
  displayName: string;
  assetType: string;   // FOREX, COMMODITY, INDEX, CRYPTO
  contractSize: number;
  pipSize: number;
  currency: string;
}

export interface SymbolSearchResult {
  symbol: string;
  displayName: string;
  assetType: string;
  exchange: string;
  source: 'LOCAL' | 'YAHOO';
}

export const symbolService = {
  getAll: async (): Promise<SymbolSpecification[]> => {
    const { data } = await apiClient.get<SymbolSpecification[]>('/symbol-specifications');
    return data;
  },

  getBySymbol: async (symbol: string): Promise<SymbolSpecification | null> => {
    try {
      const { data } = await apiClient.get<SymbolSpecification>(`/symbol-specifications/${symbol}`);
      return data;
    } catch {
      return null;
    }
  },

  search: async (query: string): Promise<SymbolSearchResult[]> => {
    const { data } = await apiClient.get<SymbolSearchResult[]>('/symbols/search', {
      params: { q: query },
    });
    return data;
  },
};
