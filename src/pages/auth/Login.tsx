// src/pages/auth/Login.tsx

import React, {useState} from 'react';
import {Link} from 'react-router-dom';
import {useTranslation} from 'react-i18next';
import {useAuth} from '@/contexts/auth-context'; // Assurez-vous que le chemin est correct
import AuthLayout from '@/components/layout/AuthLayout';
import {Input} from '@/components/ui/input';
import {Button} from '@/components/ui/button';
import {Label} from '@/components/ui/label';
import {Checkbox} from '@/components/ui/checkbox';
import {useToast} from '@/hooks/use-toast';
import {Apple, Eye, EyeOff, Mail} from 'lucide-react';
import {authService} from '@/services/auth.service'; // Importer pour getErrorMessage

const Login = () => {
    const {t} = useTranslation();
    const {login, isLoading} = useAuth(); // Utiliser isLoading du contexte
    const {toast} = useToast();

    const [emailOrUsername, setEmailOrUsername] = useState(''); // Renommé pour correspondre à l'API
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    // isLoading est maintenant géré par le contexte, plus besoin d'un état local

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        // Pas besoin de setIsLoading(true) ici, le contexte le gère

        try {
            // Appeler la fonction login du contexte
            await login(emailOrUsername, password);
            // La navigation est gérée par le contexte en cas de succès (vers dashboard ou MFA)
            toast({ // Optionnel: Afficher un message de succès si non MFA
                title: "Login initiated",
                description: "Redirecting...",
            });
        } catch (error) {
            console.error('Login component error:', error);
            // Utiliser getErrorMessage pour un message plus clair
            const errorMessage = authService.getErrorMessage(error);
            toast({
                title: t('auth.loginFailed'), // Utiliser i18n
                description: errorMessage,
                variant: 'destructive',
            });
        }
        // Pas besoin de setIsLoading(false) ici
    };

    const handleGoogleLogin = () => {
        // TODO: Implémenter le flux OAuth2 Google complet
        // Pour l'instant, cela pointe vers le backend qui devrait initier le flux
        window.location.href = `${import.meta.env.VITE_API_BASE_URL || '/api/v1'}/oauth2/authorization/google`; // Adapter l'URL si nécessaire
        toast({title: "Redirecting to Google..."});
    };

    const handleAppleLogin = () => {
        // TODO: Implémenter le flux OAuth2 Apple complet
        window.location.href = `${import.meta.env.VITE_API_BASE_URL || '/api/v1'}/oauth2/authorization/apple`; // Adapter l'URL si nécessaire
        toast({title: "Redirecting to Apple..."});
    };

    return (
        <AuthLayout
            title={t('auth.loginTitle')}
            subtitle={t('auth.loginSubtitle')}
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                    {/* Mettre à jour le label si nécessaire pour refléter email OU username */}
                    <Label htmlFor="emailOrUsername">{t('auth.emailOrUsername')}</Label>
                    <Input
                        id="emailOrUsername"
                        type="text" // Changer de 'email' à 'text' pour accepter username
                        placeholder="name@example.com or username"
                        value={emailOrUsername}
                        onChange={(e) => setEmailOrUsername(e.target.value)}
                        required
                        autoComplete="username" // Peut être 'username' ou 'email' selon ce que l'utilisateur tape
                    />
                </div>

                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <Label htmlFor="password">{t('common.password')}</Label>
                        <Link to="/auth/reset-password" className="text-sm text-primary hover:underline">
                            {t('common.forgotPassword')}?
                        </Link>
                    </div>
                    <div className="relative">
                        <Input
                            id="password"
                            type={showPassword ? 'text' : 'password'}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="pr-10"
                            autoComplete="current-password"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus:outline-none"
                            tabIndex={0}
                            aria-label={showPassword ? "Hide password" : "Show password"}
                        >
                            {showPassword ? (
                                <EyeOff className="h-4 w-4"/>
                            ) : (
                                <Eye className="h-4 w-4"/>
                            )}
                        </button>
                    </div>
                </div>

                <div className="flex items-center space-x-2">
                    <Checkbox
                        id="remember"
                        checked={rememberMe}
                        onCheckedChange={(checked) =>
                            setRememberMe(checked === true)
                        }
                    />
                    <label
                        htmlFor="remember"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                        {t('auth.rememberMe')}
                    </label>
                </div>

                {/* Utiliser isLoading du contexte pour désactiver le bouton */}
                <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? t('common.loading') : t('common.login')}
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
                        onClick={handleGoogleLogin}
                        className="flex items-center justify-center gap-2"
                        disabled={isLoading} // Désactiver pendant le chargement
                    >
                        <Mail className="h-4 w-4"/>
                        Google
                    </Button>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={handleAppleLogin}
                        className="flex items-center justify-center gap-2"
                        disabled={isLoading} // Désactiver pendant le chargement
                    >
                        <Apple className="h-4 w-4"/>
                        Apple
                    </Button>
                </div>
            </form>

            <div className="mt-6 text-center">
                <p className="text-sm text-muted-foreground">
                    {t('auth.dontHaveAccount')}{' '}
                    <Link to="/auth/signup" className="text-primary hover:underline font-medium">
                        {t('auth.createAccount')}
                    </Link>
                </p>
            </div>
        </AuthLayout>
    );
};

export default Login;