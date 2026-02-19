// src/contexts/auth-context.tsx
import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode'; // Importer jwt-decode
import { authService } from '@/services/auth.service'; // Importer notre service auth
import { userService } from '@/services/user.service'; // Importer notre service user
import { useToast } from '@/hooks/use-toast';
import type {
  UserProfileDto,
  TokenResponseDto,
  MfaRequiredResponseDto,
  RegisterRequestDto,
  RegisterResponseDto,
  MfaDisableRequestDto,
  MfaResultDto,
  TotpVerifyRequestDto,
  EmailOtpVerifyRequestDto
} from '@/types/dto'; // Importer nos types DTO

// Interface pour les données de l'utilisateur stockées dans le contexte
// Utilise UserProfileDto car c'est ce que /users/me renvoie
type UserContextType = UserProfileDto | null;

// Interface pour les données nécessaires à la vérification MFA
interface MfaVerificationData {
  mfaTokenId: string;
  // Ajouter d'autres infos si nécessaire, ex: userId ou email, type de MFA (TOTP/Email)
}

interface AuthContextType {
  user: UserContextType;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (emailOrUsername: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string, username: string) => Promise<RegisterResponseDto>;
  logout: () => void;
  // --- Fonctions MFA ---
  // initiateMfaVerification: (data: MfaVerificationData) => void; // Peut-être pas nécessaire si login gère déjà
  verifyMfaCode: (code: string, mfaTokenId: string, userId: string, type: 'TOTP' | 'EMAIL') => Promise<boolean>; // Ajout userId si nécessaire pour l'API TOTP/Email
  // --- Fonctions de récupération de mot de passe ---
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (token: string, newPassword: string) => Promise<void>; // Added resetPassword function
  // La réinitialisation effective (avec token + nouveau mdp) sera probablement gérée sur une page dédiée
  // qui appelle directement authService.resetPassword, pas besoin de la mettre dans le contexte global.
  //Pour le LOGIN MFA
  // Fonctions pour le SETUP MFA depuis Settings
  // enableMfa n'est plus ici car l'initiation ne change pas l'état global
  confirmMfaSetup: (userId: string, code: string) => Promise<void>; // Nouvelle fonction
  disableMfa: (password: string) => Promise<void>; // Fonction modifiée pour rafraîchir l'état
  // --- Fonction pour rafraîchir manuellement le profil si nécessaire ---
  refreshUserProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper pour vérifier l'expiration du token
const isTokenExpired = (token: string | null): boolean => {
  if (!token) return true;
  try {
    const decoded: { exp: number } = jwtDecode(token);
    const currentTime = Date.now() / 1000; // en secondes
    return decoded.exp < currentTime;
  } catch (error) {
    console.error("Failed to decode token:", error);
    return true; // Considérer comme expiré si invalide
  }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserContextType>(null);
  const [isLoading, setIsLoading] = useState(true);
  // Stocke les infos temporaires si MFA est requis après le login initial
  const [mfaVerificationData, setMfaVerificationData] = useState<MfaVerificationData | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Vérifier si un nouvel appareil a été détecté
    const newDeviceDetected = sessionStorage.getItem('newDeviceDetected');

    if (newDeviceDetected === 'true') {
      // Afficher la notification
      toast({
        title: "Nouvel appareil détecté",
        description: "Nous avons détecté que vous vous connectez depuis un nouvel appareil. Un e-mail de notification a été envoyé pour des raisons de sécurité.",
        variant: "default",
        duration: 8000 // Plus long pour s'assurer que l'utilisateur le voit
      });

      // Supprimer l'indicateur pour éviter d'afficher la notification plusieurs fois
      sessionStorage.removeItem('newDeviceDetected');
    }
  }, [toast]); // Inclure toast dans les dépendances

  // Fonction pour définir l'état d'authentification après succès (login, refresh, load)
  const setAuthState = useCallback(async (accessToken: string, refreshToken?: string) => {
    try {
      localStorage.setItem('accessToken', accessToken);
      if (refreshToken) {
        localStorage.setItem('refreshToken', refreshToken);
      }
      // Récupérer le profil utilisateur à jour depuis le backend
      const userProfile = await userService.getUserProfile();
      setUser(userProfile);
      console.log("User profile fetched and set:", userProfile);
    } catch (error) {
      console.error("Failed to set auth state (fetching profile failed):", error);
      // Si on ne peut pas récupérer le profil, déconnecter l'utilisateur
      await clearAuthState(); // Utiliser await ici
      throw new Error("Failed to fetch user profile after authentication.");
    }
  }, []); // Pas de dépendances, userService est stable

  // Fonction pour nettoyer l'état d'authentification
  const clearAuthState = useCallback(async () => {
    const refreshToken = localStorage.getItem('refreshToken');
    const userId = user?.id; // Essayer de récupérer l'ID utilisateur avant de le supprimer

    // Nettoyer le stockage local
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');

    // Réinitialiser l'état
    setUser(null);
    setMfaVerificationData(null);

    // Appeler l'API de déconnexion (best effort)
    if (refreshToken && userId) {
      await authService.logoutUser(refreshToken, userId);
    } else {
      console.warn("Could not call logout API: missing refresh token or user ID.");
    }
  }, [user?.id]); // Dépend de user.id pour l'appel API

  // Vérification initiale au chargement de l'application
  useEffect(() => {
    const checkAuth = async () => {
      setIsLoading(true);
      const accessToken = localStorage.getItem('accessToken');
      const refreshToken = localStorage.getItem('refreshToken');

      if (accessToken && !isTokenExpired(accessToken)) {
        console.log("Found valid access token. Verifying profile...");
        try {
          // Le token est valide, on essaie de récupérer le profil
          await setAuthState(accessToken);
        } catch (error) {
          console.error("Profile fetch failed with valid token, logging out.", error);
          await clearAuthState();
        }
      } else if (refreshToken && !isTokenExpired(refreshToken)) {
        // Access Token expiré ou absent, MAIS Refresh Token valide
        console.log("Access token expired or missing, attempting refresh...");
        try {
          // APPEL À L'API DE REFRESH
          const refreshResponse = await authService.refreshToken({ refreshToken });
          console.log("Token refresh successful.");
          // Stocker les nouveaux tokens et récupérer le profil
          await setAuthState(refreshResponse.accessToken, refreshResponse.refreshToken); // Mettre à jour les deux tokens
        } catch (error) {
          // Si le refresh échoue (ex: Refresh Token aussi expiré ou révoqué)
          console.error("Token refresh failed:", error);
          await clearAuthState(); // Nettoyer si le refresh échoue
          navigate('/auth/login'); // Rediriger vers login si le refresh échoue
        }
      } else {
        console.log("No valid tokens found.");
        // Aucun token valide, s'assurer que l'état est propre
        if (user !== null) { // Seulement si l'état n'est pas déjà null
          await clearAuthState();
        }
      }
      setIsLoading(false);
    };

    checkAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Exécuté une seule fois au montage


  const login = async (usernameOrEmail: string, password: string): Promise<void> => {
    setIsLoading(true);
    setMfaVerificationData(null); // Réinitialiser MFA au début d'une nouvelle tentative
    try {
      const response = await authService.loginUser({ usernameOrEmail, password });

      // Cas 1: Authentification réussie avec tokens
      if ('accessToken' in response) {
        const tokenResponse = response as TokenResponseDto;
        console.log("Login successful, tokens received.");
        await setAuthState(tokenResponse.accessToken, tokenResponse.refreshToken);
        navigate('/dashboard'); // Ou la page par défaut
      }
      // Cas 2: MFA Requis
      else if ('mfaTokenId' in response && 'userId' in response) {
        const mfaResponse = response as MfaRequiredResponseDto;
        console.log("Login requires MFA verification. Received userId:", mfaResponse.userId);
        // Ici, nous avons besoin de l'ID de l'utilisateur qui tente de se connecter.
        // Le backend devrait idéalement renvoyer cet ID avec mfaTokenId,
        // ou nous devons le stocker temporairement depuis la tentative initiale.
        // Pour l'instant, supposons que nous devrons le récupérer/passer autrement.
        // ATTENTION: La réponse /auth/login actuelle ne semble pas renvoyer userId dans le cas MFA.
        // Il faudra peut-être ajuster le backend ou trouver une autre solution.
        // Pour l'exemple, stockons mfaTokenId. L'userId sera nécessaire pour verifyMfaCode.
        setMfaVerificationData({ mfaTokenId: mfaResponse.mfaTokenId });
        // Passer l'email/username à la page MFA via state pour pouvoir récupérer le userId si besoin
        navigate('/auth/mfa', {
          state: {
            identifier: usernameOrEmail,
            mfaTokenId: mfaResponse.mfaTokenId,
            userId: mfaResponse.userId // <-- Passer userId ici
          }
        });
      }
      else {
        // Cas inattendu
        console.error("Unexpected login response structure:", response);
        throw new Error("Invalid response from login API.");
      }

    } catch (error) {
      console.error("Login failed:", error);
      await clearAuthState(); // Nettoyer en cas d'échec
      // L'erreur sera affichée dans le composant Login via toast
      throw error; // Renvoyer l'erreur pour que le composant puisse la traiter
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (name: string, email: string, password: string, username: string): Promise<RegisterResponseDto> => {
    setIsLoading(true); // Indiquer le début du chargement
    try {
      // Préparer les données pour l'API (correspond à RegisterRequestDto)
      const registerData: RegisterRequestDto = { username, email, password, fullName: name };

      // Appeler le service réel
      const response = await authService.registerUser(registerData);

      // En cas de succès, le service renvoie RegisterResponseDto.
      // Nous ne connectons PAS l'utilisateur ici, nous retournons juste la réponse.
      // La navigation vers le login sera gérée par le composant Signup.tsx.
      console.log("Signup successful via service:", response);
      return response;

    } catch (error) {
      // L'erreur (validation backend, email/username dupliqué, etc.) sera interceptée
      // par Axios et formatée par getErrorMessage. Nous la propageons au composant.
      console.error("Signup context error:", error);
      throw error; // Renvoyer l'erreur pour que Signup.tsx l'affiche
    } finally {
      setIsLoading(false); // Fin du chargement
    }
  };

  const logout = useCallback(async () => {
    console.log("Logging out...");
    await clearAuthState();
    navigate('/auth/login');
  }, [clearAuthState, navigate]); // Utiliser le clearAuthState mis à jour

  const forgotPassword = async (email: string): Promise<void> => {
    setIsLoading(true);
    try {
      await authService.forgotPassword({ email });
      // Le succès est géré dans le composant (toast + message "check email")
      // car le service ne renvoie rien et ne lève pas d'erreur pour la sécurité.
    } catch (error) {
      // Ne devrait pas arriver si le service gère l'erreur, mais au cas où :
      console.error("Forgot password context error:", error);
      throw error; // Renvoyer pour affichage dans le composant
    } finally {
      setIsLoading(false);
    }
  };

  const resetPassword = async (token: string, newPassword: string): Promise<void> => {
    setIsLoading(true);
    try {
      await authService.resetPassword({ token, newPassword });
      // Success will be handled in the component (toast + redirect)
    } catch (error) {
      console.error("Reset password context error:", error);
      throw error; // Forward error for display in component
    } finally {
      setIsLoading(false);
    }
  };

  const refreshUserProfile = useCallback(async () => {
    console.log("Refreshing user profile...");
    setIsLoading(true); // Optionnel: indiquer le chargement pendant le refresh
    try {
      const profile = await userService.getUserProfile();
      setUser(profile);
      console.log("User profile refreshed:", profile);
    } catch (error) {
      console.error("Failed to refresh user profile:", error);
      // Gérer l'erreur ? Déconnecter si 401 ?
      await logout(); // Déconnecter si le refresh échoue (token invalide ?)
    } finally {
      setIsLoading(false); // Fin du chargement
    }
  }, [setUser, logout]); // Ajouter les dépendances

  const confirmMfaSetup = async (userId: string, code: string): Promise<void> => {
    console.log(`confirmMfaSetup called in context for userId: ${userId}`);
    try {
      await authService.completeMfaSetup(userId, code);
      console.log("completeMfaSetup API call successful.");
      // Rafraîchir le profil pour obtenir le nouvel état mfaEnabled=true
      await refreshUserProfile();
      // Le composant Settings mettra à jour son état local (mfaStatus) en fonction du nouveau user.mfaEnabled
    } catch (error) {
      console.error("confirmMfaSetup context error:", error);
      // Propager l'erreur pour que Settings puisse afficher un toast
      throw error;
    }
  };

  const disableMfa = async (password: string): Promise<void> => {
    if (!user) throw new Error("User not authenticated for disableMfa");
    console.log("disableMfa called in context");
    try {
      const data: MfaDisableRequestDto = { userId: user.id, password };
      await authService.disableMfa(data);
      console.log("disableMfa API call successful.");
      // Rafraîchir le profil pour obtenir le nouvel état mfaEnabled=false
      await refreshUserProfile();
      // Le composant Settings mettra à jour son état local (mfaStatus) en fonction du nouveau user.mfaEnabled
    } catch (error) {
      console.error("disableMfa context error:", error);
      // Propager l'erreur pour que Settings puisse afficher un toast
      throw error;
    }
  };

  const verifyMfaCode = async (code: string, mfaTokenId: string, userId: string, type: 'TOTP' | 'EMAIL'): Promise<boolean> => {
    setIsLoading(true);
    try {
      let response: MfaResultDto; // Type de retour attendu contenant les tokens

      if (type === 'TOTP') {
        const data: TotpVerifyRequestDto = { userId, code };
        response = await authService.verifyTotpCode(data);
      } else { // type === 'EMAIL'
        const data: EmailOtpVerifyRequestDto = { otpTokenId: mfaTokenId, code };
        response = await authService.verifyEmailOtp(data);
      }

      if (response && response.accessToken) {
        console.log("MFA verification successful, tokens received.");
        // Utiliser setAuthState pour stocker les tokens et récupérer le profil
        await setAuthState(response.accessToken, response.refreshToken);
        setMfaVerificationData(null); // Nettoyer les données MFA temporaires
        navigate('/dashboard'); // Naviguer vers le dashboard après succès
        return true;
      } else {
        console.warn("MFA verification response did not contain expected tokens.");
        return false;
      }

    } catch (error) {
      console.error("MFA verification context error:", error);
      // L'erreur sera gérée par le composant appelant (toast)
      return false; // Indiquer l'échec
    } finally {
      setIsLoading(false);
    }
  };

  const authContextValue = useMemo(() => ({
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    signup,
    logout,
    forgotPassword,
    resetPassword,
    verifyMfaCode,
    confirmMfaSetup,
    disableMfa,
    refreshUserProfile
  }), [user, isLoading, login, signup, logout, forgotPassword, resetPassword, verifyMfaCode, confirmMfaSetup, disableMfa, refreshUserProfile]);

  return <AuthContext.Provider value={authContextValue}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
