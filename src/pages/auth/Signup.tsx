// src/pages/auth/Signup.tsx

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/auth-context';
import AuthLayout from '@/components/layout/AuthLayout';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast'; // Utiliser le hook standard
import { Eye, EyeOff, Apple, Mail } from 'lucide-react';
import { authService } from '@/services/auth.service';
import { AxiosError } from 'axios'; // Importer AxiosError
import type { ApiErrorResponseDto } from '@/types/dto';
import {Alert, AlertDescription} from "@/components/ui/alert.tsx"; // Importer type d'erreur

const Signup = () => {
    const { t } = useTranslation();
    const { signup, isLoading } = useAuth(); // Récupérer isLoading du contexte
    const { toast } = useToast();
    const navigate = useNavigate();

    const [fullName, setFullName] = useState('');
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    // Utiliser isLoading du contexte, plus besoin d'un état local
    const [errors, setErrors] = useState<{
        username?: string;
        password?: string;
        email?: string;
        confirmPassword?: string;
        // Ajouter une clé pour les erreurs générales non liées à un champ
        form?: string;
    }>({});

    const validateForm = () => {
        // ... (Validation côté client existante reste la même)
        // ... (Retourne true si valide, false sinon)
        const newErrors: typeof errors = {};

        if (username.length < 3 || username.length > 50) {
            newErrors.username = t('auth.usernameLength');
        }
        if (!/\S+@\S+\.\S+/.test(email)) {
            newErrors.email = t('auth.invalidEmail');
        }
        const passwordRegex = /^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*[@#$%^&+=!])(?=\S+$).{8,}$/;
        if (!passwordRegex.test(password)) {
            newErrors.password = t('auth.passwordRequirements');
        }
        if (password !== confirmPassword) {
            newErrors.confirmPassword = t('auth.passwordsDoNotMatch');
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrors({}); // Reset errors

        if (!validateForm()) {
            return;
        }

        // Pas besoin de setIsLoading(true) ici, le contexte gère

        try {
            // Appeler la fonction signup du contexte
            const response = await signup(fullName, email, password, username);

            // Si la fonction réussit (ne lève pas d'erreur), afficher succès et rediriger
            toast({
                title: t('auth.signupSuccessTitle'),
                description: t('auth.signupSuccessDesc'),
            });
            // Rediriger vers la page de LOGIN après inscription réussie
            navigate('/auth/login');

        } catch (error) {
            console.error('Signup component error:', error);
            const errorMessage = authService.getErrorMessage(error);

            // Essayer d'extraire les erreurs de validation spécifiques du backend
            let backendValidationErrors: Record<string, string> | undefined;
            if (error instanceof AxiosError) {
                const errorData = error.response?.data as ApiErrorResponseDto;
                if (errorData?.validationErrors) {
                    backendValidationErrors = errorData.validationErrors;
                } else if (errorData?.message) {
                    // Si pas d'erreur de validation, afficher le message général comme erreur de formulaire
                    setErrors(prev => ({...prev, form: errorData.message}));
                }
            }

            // Mettre à jour l'état des erreurs avec les erreurs backend s'il y en a
            if (backendValidationErrors) {
                setErrors(prev => ({ ...prev, ...backendValidationErrors }));
            }

            // Afficher le toast d'erreur principal
            toast({
                title: t('auth.signupFailed'),
                description: errorMessage, // Message formaté (peut inclure les détails de validation)
                variant: 'destructive',
            });
        }
        // Pas besoin de setIsLoading(false) ici
    };

    const handleGoogleSignup = () => {
        window.location.href = `${import.meta.env.VITE_API_BASE_URL || '/api/v1'}/oauth2/authorization/google`;
        toast({title: "Redirecting to Google..."});
    };

    const handleAppleSignup = () => {
        window.location.href = `${import.meta.env.VITE_API_BASE_URL || '/api/v1'}/oauth2/authorization/apple`;
        toast({title: "Redirecting to Apple..."});
    };

    return (
        <AuthLayout
            title={t('auth.signupTitle')}
            subtitle={t('auth.signupSubtitle')}
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Afficher l'erreur générale du formulaire si elle existe */}
                {errors.form && (
                    <Alert variant="destructive">
                        <AlertDescription>{errors.form}</AlertDescription>
                    </Alert>
                )}
                {/* --- Champs du formulaire --- */}
                {/* Nom Complet */}
                <div className="space-y-2">
                    <Label htmlFor="fullName">{t('auth.fullName')}</Label>
                    <Input id="fullName" type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} required autoComplete="name" />
                    {/* Afficher l'erreur spécifique à ce champ s'il y en a une (si le backend la renvoie) */}
                    {/* {errors.fullName && <p className="text-sm text-destructive">{errors.fullName}</p>} */}
                    {/* Pas d'erreur spécifique pour fullName dans la validation client actuelle */}
                </div>

                {/* Nom d'utilisateur */}
                <div className="space-y-2">
                    <Label htmlFor="username">{t('auth.username')}</Label>
                    <Input id="username" type="text" value={username} onChange={(e) => setUsername(e.target.value)} required autoComplete="username" />
                    {errors.username && <p className="text-sm text-destructive">{errors.username}</p>}
                </div>

                {/* Email */}
                <div className="space-y-2">
                    <Label htmlFor="email">{t('common.email')}</Label>
                    <Input id="email" type="email" placeholder="name@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
                    {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
                </div>

                {/* Mot de passe */}
                <div className="space-y-2">
                    <Label htmlFor="password">{t('common.password')}</Label>
                    <div className="relative">
                        <Input id="password" type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} required className="pr-10" autoComplete="new-password" />
                        {/* ... bouton oeil ... */}
                    </div>
                    {errors.password && <p className="text-sm text-destructive whitespace-pre-line">{errors.password}</p>}
                </div>

                {/* Confirmation Mot de passe */}
                <div className="space-y-2">
                    <Label htmlFor="confirmPassword">{t('common.confirmPassword')}</Label>
                    <Input id="confirmPassword" type={showPassword ? 'text' : 'password'} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required autoComplete="new-password" />
                    {errors.confirmPassword && <p className="text-sm text-destructive">{errors.confirmPassword}</p>}
                </div>

                {/* Bouton S'inscrire */}
                <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? t('common.loading') : t('common.signup')}
                </Button>

                <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-border"></div>
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">
              {t('auth.orContinueWith')}
            </span>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={handleGoogleSignup}
                        className="flex items-center justify-center gap-2"
                        disabled={isLoading}
                    >
                        <Mail className="h-4 w-4"/>
                        Google
                    </Button>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={handleAppleSignup}
                        className="flex items-center justify-center gap-2"
                        disabled={isLoading}
                    >
                        <Apple className="h-4 w-4"/>
                        Apple
                    </Button>
                </div>
            </form>

            <div className="mt-6 text-center">
                <p className="text-sm text-muted-foreground">
                    {t('auth.alreadyHaveAccount')}{' '}
                    <Link to="/auth/login" className="text-primary hover:underline font-medium">
                        {t('common.login')}
                    </Link>
                </p>
            </div>
        </AuthLayout>
    );
};

export default Signup;