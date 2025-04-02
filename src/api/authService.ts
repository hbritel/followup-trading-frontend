
import { API_BASE_URL, getDefaultHeaders, handleApiResponse } from './config';

interface LoginRequest {
  email: string;
  password: string;
}

interface SignupRequest {
  name: string;
  email: string;
  password: string;
}

interface AuthResponse {
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
    mfaEnabled: boolean;
  };
}

export const authService = {
  // Connexion utilisateur
  login: async (credentials: LoginRequest): Promise<AuthResponse> => {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: getDefaultHeaders(),
      body: JSON.stringify(credentials),
    });
    
    return handleApiResponse(response);
  },

  // Inscription utilisateur
  signup: async (userData: SignupRequest): Promise<AuthResponse> => {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: getDefaultHeaders(),
      body: JSON.stringify(userData),
    });
    
    return handleApiResponse(response);
  },

  // Vérification de la session utilisateur
  checkSession: async (): Promise<{ user: AuthResponse['user'] }> => {
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      method: 'GET',
      headers: getDefaultHeaders(),
    });
    
    return handleApiResponse(response);
  },

  // Demande de réinitialisation du mot de passe
  requestPasswordReset: async (email: string): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/auth/password/reset-request`, {
      method: 'POST',
      headers: getDefaultHeaders(),
      body: JSON.stringify({ email }),
    });
    
    return handleApiResponse(response);
  },

  // Vérification du code MFA
  verifyMfa: async (code: string): Promise<{ valid: boolean }> => {
    const response = await fetch(`${API_BASE_URL}/auth/mfa/verify`, {
      method: 'POST',
      headers: getDefaultHeaders(),
      body: JSON.stringify({ code }),
    });
    
    return handleApiResponse(response);
  },

  // Activation de MFA
  enableMfa: async (): Promise<{ qrCodeUrl: string }> => {
    const response = await fetch(`${API_BASE_URL}/auth/mfa/enable`, {
      method: 'POST',
      headers: getDefaultHeaders(),
    });
    
    return handleApiResponse(response);
  },

  // Désactivation de MFA
  disableMfa: async (): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/auth/mfa/disable`, {
      method: 'POST',
      headers: getDefaultHeaders(),
    });
    
    return handleApiResponse(response);
  },

  // Déconnexion utilisateur
  logout: async (): Promise<void> => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/logout`, {
        method: 'POST',
        headers: getDefaultHeaders(),
      });
      
      await handleApiResponse(response);
    } finally {
      // Toujours supprimer les données locales
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
    }
  },
};
