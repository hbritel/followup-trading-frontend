
import React from 'react';
import { LanguageSwitcher } from '@/components/ui/language-switcher';
import { useTranslation } from 'react-i18next';

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
}

const AuthLayout: React.FC<AuthLayoutProps> = ({ 
  children,
  title,
  subtitle
}) => {
  const { t } = useTranslation();
  
  return (
    <div className="flex min-h-screen bg-background">
      <div className="hidden md:flex md:w-1/2 bg-primary/10 items-center justify-center p-10">
        <div className="max-w-md">
          <div className="relative w-20 h-20 flex items-center justify-center rounded-xl bg-primary text-3xl font-bold text-white mb-8">DN</div>
          <h1 className="text-4xl font-bold mb-6">Followup Trading</h1>
          <p className="text-lg text-muted-foreground">
            Streamline your trading workflow, track performance, and make data-driven decisions.
          </p>
        </div>
      </div>
      
      <div className="flex flex-col w-full md:w-1/2 p-6 sm:p-10">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-2 md:hidden">
            <div className="relative w-10 h-10 flex items-center justify-center rounded-xl bg-primary text-lg font-bold text-white">DN</div>
            <span className="text-xl font-semibold">DashNest</span>
          </div>
          <div className="ml-auto">
            <LanguageSwitcher />
          </div>
        </div>
        
        <div className="flex-1 flex flex-col justify-center max-w-md mx-auto w-full">
          <div className="mb-8">
            <h2 className="text-3xl font-bold">{title}</h2>
            {subtitle && <p className="text-muted-foreground mt-2">{subtitle}</p>}
          </div>
          
          {children}
        </div>
        
        <div className="mt-8 text-center text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} Followup Trading. All rights reserved.
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
