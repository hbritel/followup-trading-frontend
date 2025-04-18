
import React, { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/auth-context';
import AuthLayout from '@/components/layout/AuthLayout';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';

const ResetPassword = () => {
  const { t } = useTranslation();
  const { resetPassword } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  useEffect(() => {
    if (!token) {
      toast({
        title: 'Invalid reset link',
        description: 'The password reset link is invalid or expired. Please request a new one.',
        variant: 'destructive',
      });
      navigate('/auth/login');
    }
  }, [token, toast, navigate]);
  
  const passwordSchema = z.object({
    password: z.string()
      .min(8, { message: 'Password must be at least 8 characters long' })
      .regex(/[A-Z]/, { message: 'Password must contain at least one uppercase letter' })
      .regex(/[a-z]/, { message: 'Password must contain at least one lowercase letter' })
      .regex(/[0-9]/, { message: 'Password must contain at least one number' })
      .regex(/[^A-Za-z0-9]/, { message: 'Password must contain at least one special character' }),
    confirmPassword: z.string(),
  }).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

  const form = useForm<z.infer<typeof passwordSchema>>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });
  
  const handleSubmit = async (values: z.infer<typeof passwordSchema>) => {
    if (!token) return;
    
    setIsLoading(true);
    
    try {
      // Call resetPassword with both token and new password
      await resetPassword(token, values.password);
      setIsSubmitted(true);
      toast({
        title: 'Password reset successful',
        description: 'Your password has been reset successfully. You can now login with your new password.',
      });
    } catch (error) {
      console.error('Reset password error:', error);
      toast({
        title: 'Reset failed',
        description: 'An error occurred while resetting your password. The link may have expired.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <AuthLayout
      title={t('auth.resetTitle')}
      subtitle={t('auth.resetSubtitle')}
    >
      {isSubmitted ? (
        <div className="text-center">
          <div className="mb-4 rounded-full p-3 bg-primary/10 text-primary mx-auto w-16 h-16 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold mb-2">{t('auth.passwordResetSuccess')}</h3>
          <p className="text-muted-foreground mb-6">
            {t('auth.passwordResetSuccessDescription')}
          </p>
          <Button asChild className="w-full">
            <Link to="/auth/login">{t('auth.proceedToLogin')}</Link>
          </Button>
        </div>
      ) : (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormItem>
              <FormLabel>{t('auth.newPassword')}</FormLabel>
              <FormControl>
                <Input
                  {...form.register('password')}
                  type="password"
                  autoComplete="new-password"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
            
            <FormItem>
              <FormLabel>{t('auth.confirmPassword')}</FormLabel>
              <FormControl>
                <Input
                  {...form.register('confirmPassword')}
                  type="password" 
                  autoComplete="new-password"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
            
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? t('common.loading') : t('auth.resetPassword')}
            </Button>
            
            <div className="text-center mt-4">
              <Link
                to="/auth/login"
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                {t('common.back')} {t('auth.toLogin')}
              </Link>
            </div>
          </form>
        </Form>
      )}
    </AuthLayout>
  );
};

export default ResetPassword;
