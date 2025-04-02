
// Configuration API pour se connecter au backend SpringBoot

// URL de base de l'API - à mettre à jour selon votre environnement
export const API_BASE_URL = 'http://localhost:8080/api';

// Temps d'expiration des requêtes en millisecondes
export const API_TIMEOUT = 30000; 

// Headers par défaut pour les requêtes
export const getDefaultHeaders = () => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };

  // Ajouter le token d'authentification s'il existe
  const token = localStorage.getItem('auth_token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
};

// Gestionnaire de réponse pour vérifier les erreurs
export const handleApiResponse = async (response: Response) => {
  if (!response.ok) {
    // Si la réponse est 401 Unauthorized, déconnexion de l'utilisateur
    if (response.status === 401) {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
      window.location.href = '/auth/login';
      throw new Error('Session expirée. Veuillez vous reconnecter.');
    }

    // Pour les autres erreurs, on essaie de récupérer le message d'erreur du serveur
    const errorData = await response.json().catch(() => ({}));
    const errorMessage = errorData.message || `Erreur ${response.status}: ${response.statusText}`;
    throw new Error(errorMessage);
  }

  // Si la réponse est vide, retourner null
  if (response.status === 204) {
    return null;
  }

  // Sinon retourner les données JSON
  return response.json();
};

