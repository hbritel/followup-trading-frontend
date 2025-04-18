// src/contexts/auth-context.tsx
import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode'; // Importer jwt-decode
import { authService } from '@/services/auth.service'; // Importer notre service auth
import { userService } from '@/services/user.service'; // Importer notre service user
import type {
  UserProfileDto,
  LoginResponseDto,
  TokenResponseDto,
  MfaRequiredResponseDto,
  RegisterResponseDto,
  MfaDisableRequestDto,
  MfaSetupResponseDto,
  MfaResultDto,
  TotpVerifyRequestDto,
  EmailOtpVerifyRequestDto
} from '@/types/dto'; // Importer nos types DTO
import { AxiosError } from 'axios';

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
  signup: (name: string, email: string, password: string, username: string) => Promise<RegisterResponseDto | null>;
  logout: () => void;
  // --- Fonctions MFA ---
  // initiateMfaVerification: (data: MfaVerificationData) => void; // Peut-être pas nécessaire si login gère déjà
  verifyMfaCode: (code: string, mfaTokenId: string, userId: string, type: 'TOTP' | 'EMAIL') => Promise<boolean>; // Ajout userId si nécessaire pour l'API TOTP/Email
  // --- Fonctions de récupération de mot de passe ---
  forgotPassword: (email: string) => Promise<void>;
  // La réinitialisation effective (avec token + nouveau mdp) sera probablement gérée sur une page dédiée
  // qui appelle directement authService.resetPassword, pas besoin de la mettre dans le contexte global.
  // --- Autres fonctions (à implémenter si besoin) ---
  // refreshAuthToken: () => Promise<boolean>;
  enableMfa: () => Promise<MfaSetupResponseDto>; // Renvoie les infos pour le QR code
  disableMfa: (password: string) => Promise<void>;
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
        console.log("Access token expired or missing, attempting refresh...");
        try {
          const refreshResponse = await authService.refreshToken({ refreshToken });
          console.log("Token refresh successful.");
          await setAuthState(refreshResponse.accessToken, refreshResponse.refreshToken); // Mettre à jour les deux tokens
        } catch (error) {
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
      else if ('mfaTokenId' in response) {
        const mfaResponse = response as MfaRequiredResponseDto;
        console.log("Login requires MFA verification.");
        // Ici, nous avons besoin de l'ID de l'utilisateur qui tente de se connecter.
        // Le backend devrait idéalement renvoyer cet ID avec mfaTokenId,
        // ou nous devons le stocker temporairement depuis la tentative initiale.
        // Pour l'instant, supposons que nous devrons le récupérer/passer autrement.
        // ATTENTION: La réponse /auth/login actuelle ne semble pas renvoyer userId dans le cas MFA.
        // Il faudra peut-être ajuster le backend ou trouver une autre solution.
        // Pour l'exemple, stockons mfaTokenId. L'userId sera nécessaire pour verifyMfaCode.
        setMfaVerificationData({ mfaTokenId: mfaResponse.mfaTokenId });
        // Passer l'email/username à la page MFA via state pour pouvoir récupérer le userId si besoin
        navigate('/auth/mfa', { state: { identifier: usernameOrEmail, mfaTokenId: mfaResponse.mfaTokenId } });
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

  const signup = async (name: string, email: string, password: string, username: string): Promise<RegisterResponseDto | null> => {
    setIsLoading(true);
    try {
      const registerData = { username, email, password, fullName: name };
      const response = await authService.registerUser(registerData);
      console.log("Signup successful:", response);
      // Après inscription réussie, on pourrait rediriger vers le login
      // ou connecter automatiquement l'utilisateur (si le backend renvoie des tokens)
      // Pour l'instant, on renvoie juste les données et le composant gérera la redirection vers login.
      return response;
    } catch (error) {
      console.error("Signup failed:", error);
      // L'erreur sera affichée dans le composant Signup via toast
      throw error; // Renvoyer l'erreur
    } finally {
      setIsLoading(false);
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

  // Fonction pour démarrer la configuration MFA
  const enableMfa = async (): Promise<MfaSetupResponseDto> => {
    if (!user) throw new Error("User not authenticated");
    setIsLoading(true);
    try {
      // Appel API pour obtenir le secret et l'URI QR code
      const response = await authService.setupMfa({ userId: user.id });
      // NOTE: Le backend active MFA immédiatement ici ou attend la vérification ?
      // Le code actuel du backend (configureMfa) semble l'activer immédiatement.
      // Si la vérification est requise pour *finaliser* l'activation,
      // il faudrait ajuster la logique ici et dans MFASetup.tsx.
      // Supposons que l'activation est immédiate au backend pour l'instant.

      // Mettre à jour l'état utilisateur localement (important!)
      setUser(prevUser => prevUser ? { ...prevUser, mfaEnabled: true } : null);

      return response; // Retourner les données pour affichage du QR code
    } catch (error) {
      console.error("Enable MFA context error:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Fonction pour désactiver MFA
  const disableMfa = async (password: string): Promise<void> => {
    if (!user) throw new Error("User not authenticated");
    setIsLoading(true);
    try {
      const data: MfaDisableRequestDto = { userId: user.id, password };
      await authService.disableMfa(data);

      // Mettre à jour l'état utilisateur localement
      setUser(prevUser => prevUser ? { ...prevUser, mfaEnabled: false } : null);

      // Afficher un toast de succès (peut aussi être fait dans le composant appelant)
      // toast({ title: "MFA Disabled", description: "Two-factor authentication has been disabled." });

    } catch (error) {
      console.error("Disable MFA context error:", error);
      throw error; // L'erreur sera gérée par le composant appelant (ex: afficher toast)
    } finally {
      setIsLoading(false);
    }
  };

  // ATTENTION: verifyMfaCode nécessite userId. Il faudra l'obtenir.
  // Soit via le state passé par navigate, soit via un appel API pour récupérer
  // l'utilisateur par son email/username avant d'appeler cette fonction.
  // L'implémentation ci-dessous suppose que l'userId est fourni.
  // Le backend (AuthController) prend aussi mfaTokenId pour la vérification email,
  // mais userId pour la vérification TOTP. Adaptez selon le type de MFA.

  // Fonction pour finaliser l'authentification après vérification MFA
  // Prend le type de MFA pour appeler le bon service
  const verifyMfaCode = async (code: string, mfaTokenId: string, userId: string, type: 'TOTP' | 'EMAIL'): Promise<boolean> => {
    setIsLoading(true);
    try {
      let response: MfaResultDto; // Type de retour attendu contenant les tokens

      if (type === 'TOTP') {
        const data: TotpVerifyRequestDto = { userId, code };
        response = await authService.verifyTotpCode(data);
      } else { // type === 'EMAIL'
        // Pour l'email, l'API attend otpTokenId, qui correspond à notre mfaTokenId reçu lors du login
        const data: EmailOtpVerifyRequestDto = { otpTokenId: mfaTokenId, code };
        response = await authService.verifyEmailOtp(data);
      }

      // Vérifier si la réponse contient bien les tokens
      if (response && response.accessToken) {
        console.log("MFA verification successful, tokens received.");
        // Utiliser setAuthState pour stocker les tokens et récupérer le profil
        await setAuthState(response.accessToken, response.refreshToken);
        setMfaVerificationData(null); // Nettoyer les données MFA temporaires
        navigate('/dashboard'); // Naviguer vers le dashboard après succès
        return true;
      } else {
        // Cas où l'API réussit (200 OK) mais ne renvoie pas de tokens ? Improbable.
        console.warn("MFA verification response did not contain expected tokens.");
        // Traiter comme un échec côté client
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


  // --- Appareil de confiance ---
  // Exemple d'implémentation (peut être ajouté à AuthContextType si besoin global)
  /*
  const addTrustedDevice = async (deviceName: string, mfaExemptDays: number = 30): Promise<void> => {
      if (!user) throw new Error("User not authenticated");

      // Récupérer l'empreinte digitale (à implémenter, ex: avec une librairie comme fingerprintjs2)
      const fingerprint = await getDeviceFingerprint(); // Placeholder
      if (!fingerprint) {
           console.error("Could not get device fingerprint.");
           throw new Error("Device fingerprint is missing.");
      }

      setIsLoading(true);
      try {
          const data: TrustedDeviceRequestDto = { userId: user.id, deviceName, mfaExemptDays };
          await authService.addTrustedDevice(data, fingerprint);
          // Afficher un toast de succès ?
      } catch (error) {
          console.error("Add trusted device context error:", error);
          throw error;
      } finally {
          setIsLoading(false);
      }
  };
  */

  // Utiliser useMemo pour l'objet de valeur du contexte afin d'éviter des rendus inutiles
  const authContextValue = useMemo(() => ({
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    signup,
    logout,
    forgotPassword,
    enableMfa,
    disableMfa,
    verifyMfaCode,
    // addTrustedDevice, // <-- Exporter si implémenté et nécessaire globalement
  }), [user, isLoading, login, signup, logout, forgotPassword, enableMfa, disableMfa, verifyMfaCode]); // Ajouter les nouvelles fonctions aux dépendances

  return <AuthContext.Provider value={authContextValue}>{children}</AuthContext.Provider>;
};

interface AuthContextType {
  user: UserContextType;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (emailOrUsername: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string, username: string) => Promise<RegisterResponseDto | null>;
  logout: () => void;
  forgotPassword: (email: string) => Promise<void>;
  verifyMfaCode: (mfaTokenId: string, code: string, userId: string, type: 'TOTP' | 'EMAIL') => Promise<boolean>; // Commenté
  enableMfa: () => Promise<MfaSetupResponseDto>;
  disableMfa: (password: string) => Promise<void>;
}

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};