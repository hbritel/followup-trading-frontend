
import React, { createContext, useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

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

  useEffect(() => {
    // Check for existing session on initial load
    const checkAuth = async () => {
      try {
        // For now, we'll just use localStorage for testing
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        }
      } catch (error) {
        console.error("Auth check failed:", error);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string): Promise<void> => {
    setIsLoading(true);
    try {
      // Simulating an API call to your backend
      // Replace with actual API call to your Spring Boot backend
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock response - replace with actual backend response
      const mockUser = {
        id: "user123",
        name: "John Doe",
        email: email,
        mfaEnabled: true
      };
      
      setUser(mockUser);
      localStorage.setItem("user", JSON.stringify(mockUser));
      
      // If MFA is enabled, redirect to MFA verification
      if (mockUser.mfaEnabled) {
        navigate("/auth/mfa");
      } else {
        navigate("/dashboard");
      }
    } catch (error) {
      console.error("Login failed:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (email: string, password: string, name: string): Promise<void> => {
    setIsLoading(true);
    try {
      // Simulating an API call to your backend
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock response - replace with actual backend response
      const mockUser = {
        id: "user123",
        name: name,
        email: email,
        mfaEnabled: false
      };
      
      setUser(mockUser);
      localStorage.setItem("user", JSON.stringify(mockUser));
      navigate("/dashboard");
    } catch (error) {
      console.error("Signup failed:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("user");
    navigate("/auth/login");
  };

  const resetPassword = async (email: string): Promise<void> => {
    setIsLoading(true);
    try {
      // Simulating an API call to your backend
      await new Promise(resolve => setTimeout(resolve, 1000));
      // Backend would send an email with reset instructions
      navigate("/auth/reset-success");
    } catch (error) {
      console.error("Password reset failed:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const verifyMfaCode = async (code: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      // Simulating an API call to your backend
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock response - replace with actual backend response
      const isValid = code === "123456"; // Example validation
      
      if (isValid) {
        navigate("/dashboard");
      }
      
      return isValid;
    } catch (error) {
      console.error("MFA verification failed:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const enableMfa = async (): Promise<{ qrCodeUrl: string }> => {
    setIsLoading(true);
    try {
      // Simulating an API call to your backend
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock response - replace with actual backend response
      const qrCodeUrl = "https://api.qrserver.com/v1/create-qr-code/?data=otpauth://totp/DashNestTrader:user@example.com?secret=JBSWY3DPEHPK3PXP&issuer=DashNestTrader&algorithm=SHA1&digits=6&period=30";
      
      // Update user object
      if (user) {
        const updatedUser = { ...user, mfaEnabled: true };
        setUser(updatedUser);
        localStorage.setItem("user", JSON.stringify(updatedUser));
      }
      
      return { qrCodeUrl };
    } catch (error) {
      console.error("Enable MFA failed:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const disableMfa = async (): Promise<void> => {
    setIsLoading(true);
    try {
      // Simulating an API call to your backend
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Update user object
      if (user) {
        const updatedUser = { ...user, mfaEnabled: false };
        setUser(updatedUser);
        localStorage.setItem("user", JSON.stringify(updatedUser));
      }
    } catch (error) {
      console.error("Disable MFA failed:", error);
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
