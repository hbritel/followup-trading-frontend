
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: any | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  signup: (email: string, password: string, username: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  isLoading: true,
  user: null,
  login: async () => {},
  logout: async () => {},
  signup: async () => {},
});

export const useAuth = () => useContext(AuthContext);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    // Simulate checking authentication status
    const checkAuth = async () => {
      try {
        // In a real app, this would check for a valid session
        const isAuth = localStorage.getItem('isAuthenticated') === 'true';
        
        if (isAuth) {
          // Mock user data
          setUser({
            id: '1',
            email: 'user@example.com',
            name: 'Demo User',
          });
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error('Auth check failed:', error);
        setIsLoading(false);
      }
    };
    
    checkAuth();
  }, []);
  
  const login = async (email: string, password: string) => {
    // Simulate login
    setIsLoading(true);
    
    try {
      // In a real app, this would validate credentials with an API
      localStorage.setItem('isAuthenticated', 'true');
      
      setUser({
        id: '1',
        email,
        name: 'Demo User',
      });
      
      setIsLoading(false);
    } catch (error) {
      console.error('Login failed:', error);
      setIsLoading(false);
      throw error;
    }
  };
  
  const logout = async () => {
    // Simulate logout
    setIsLoading(true);
    
    try {
      // In a real app, this would invalidate the session with an API
      localStorage.removeItem('isAuthenticated');
      
      setUser(null);
      setIsLoading(false);
    } catch (error) {
      console.error('Logout failed:', error);
      setIsLoading(false);
      throw error;
    }
  };
  
  const signup = async (email: string, password: string, username: string) => {
    // Simulate signup
    setIsLoading(true);
    
    try {
      // In a real app, this would create a user with an API
      localStorage.setItem('isAuthenticated', 'true');
      
      setUser({
        id: '1',
        email,
        username,
        name: username,
      });
      
      setIsLoading(false);
    } catch (error) {
      console.error('Signup failed:', error);
      setIsLoading(false);
      throw error;
    }
  };
  
  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: !!user,
        isLoading,
        user,
        login,
        logout,
        signup,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
