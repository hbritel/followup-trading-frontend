
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthProvider as AuthContextProvider } from '@/contexts/auth-context';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  
  return (
    <AuthContextProvider>
      {children}
    </AuthContextProvider>
  );
};
