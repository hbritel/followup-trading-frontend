
import React, { createContext, useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { authService } from "@/api/authService";
import { useToast } from "@/hooks/use-toast";

interface User {
  id: string;
  name: string;
  email: string;
  mfaEnabled: boolean;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
  resetPassword: (email: string) => Promise<void>;
  verifyMfaCode: (code: string) => Promise<boolean>;
  enableMfa: () => Promise<{ qrCodeUrl: string }>;
  disableMfa: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Vérifier la session utilisateur au chargement
    const checkAuth = async () => {
      try {
        // Vérifier si un token existe
        const token = localStorage.getItem('auth_token');
        if (!token) {
          setIsLoading(false);
          return;
        }

        // Vérifier la validité du token avec l'API
        const { user } = await authService.checkSession();
        setUser(user);
      } catch (error) {
        console.error("Erreur d'authentification:", error);
        // En cas d'erreur, supprimer les données locales
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string): Promise<void> => {
    setIsLoading(true);
    try {
      // Appel à l'API de connexion
      const response = await authService.login({ email, password });
      
      // Sauvegarder le token et les infos utilisateur
      localStorage.setItem('auth_token', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
      setUser(response.user);
      
      // Redirection en fonction de MFA
      if (response.user.mfaEnabled) {
        navigate("/auth/mfa");
      } else {
        navigate("/dashboard");
      }
    } catch (error) {
      console.error("Échec de connexion:", error);
      toast({
        title: "Échec de connexion",
        description: error instanceof Error ? error.message : "Identifiants invalides",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (email: string, password: string, name: string): Promise<void> => {
    setIsLoading(true);
    try {
      // Appel à l'API d'inscription
      const response = await authService.signup({ email, password, name });
      
      // Sauvegarder le token et les infos utilisateur
      localStorage.setItem('auth_token', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
      setUser(response.user);
      
      navigate("/dashboard");
    } catch (error) {
      console.error("Échec d'inscription:", error);
      toast({
        title: "Échec d'inscription",
        description: error instanceof Error ? error.message : "Une erreur s'est produite lors de l'inscription",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await authService.logout();
    } catch (error) {
      console.error("Erreur lors de la déconnexion:", error);
    } finally {
      setUser(null);
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
      setIsLoading(false);
      navigate("/auth/login");
    }
  };

  const resetPassword = async (email: string): Promise<void> => {
    setIsLoading(true);
    try {
      await authService.requestPasswordReset(email);
      navigate("/auth/reset-success");
    } catch (error) {
      console.error("Échec de réinitialisation du mot de passe:", error);
      toast({
        title: "Échec de la demande",
        description: error instanceof Error ? error.message : "Une erreur s'est produite",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const verifyMfaCode = async (code: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const result = await authService.verifyMfa(code);
      
      if (result.valid) {
        navigate("/dashboard");
      }
      
      return result.valid;
    } catch (error) {
      console.error("Échec de vérification MFA:", error);
      toast({
        title: "Code invalide",
        description: "Le code d'authentification est incorrect ou a expiré",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const enableMfa = async (): Promise<{ qrCodeUrl: string }> => {
    setIsLoading(true);
    try {
      const result = await authService.enableMfa();
      
      // Mettre à jour l'utilisateur avec MFA activé
      if (user) {
        const updatedUser = { ...user, mfaEnabled: true };
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
      }
      
      return result;
    } catch (error) {
      console.error("Échec d'activation MFA:", error);
      toast({
        title: "Échec d'activation MFA",
        description: error instanceof Error ? error.message : "Une erreur s'est produite",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const disableMfa = async (): Promise<void> => {
    setIsLoading(true);
    try {
      await authService.disableMfa();
      
      // Mettre à jour l'utilisateur avec MFA désactivé
      if (user) {
        const updatedUser = { ...user, mfaEnabled: false };
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
      }
    } catch (error) {
      console.error("Échec de désactivation MFA:", error);
      toast({
        title: "Échec de désactivation MFA",
        description: error instanceof Error ? error.message : "Une erreur s'est produite",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    signup,
    logout,
    resetPassword,
    verifyMfaCode,
    enableMfa,
    disableMfa
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
