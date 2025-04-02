
import React from 'react';
import { useToast } from '@/hooks/use-toast';

// Contexte pour gérer les erreurs API globalement
interface ApiErrorContext {
  handleError: (error: unknown) => void;
}

const ApiErrorContext = React.createContext<ApiErrorContext | undefined>(undefined);

export const ApiErrorProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { toast } = useToast();

  // Fonction pour traiter les erreurs API
  const handleError = (error: unknown) => {
    console.error('API Error:', error);
    
    // Afficher une notification toast avec l'erreur
    toast({
      title: "Erreur",
      description: error instanceof Error ? error.message : "Une erreur s'est produite",
      variant: "destructive",
    });
  };

  return (
    <ApiErrorContext.Provider value={{ handleError }}>
      {children}
    </ApiErrorContext.Provider>
  );
};

export const useApiError = (): ApiErrorContext => {
  const context = React.useContext(ApiErrorContext);
  if (context === undefined) {
    throw new Error('useApiError must be used within an ApiErrorProvider');
  }
  return context;
};
