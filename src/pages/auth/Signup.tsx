// src/pages/auth/Signup.tsx

import React, {useState} from 'react';
import {Link, useNavigate} from 'react-router-dom'; // Importer useNavigate
import {useTranslation} from 'react-i18next';
import {useAuth} from '@/contexts/auth-context'; // Assurez-vous que le chemin est correct
import AuthLayout from '@/components/layout/AuthLayout';
import {Input} from '@/components/ui/input';
import {Button} from '@/components/ui/button';
import {Label} from '@/components/ui/label';
import {useToast} from '@/hooks/use-toast';
import {Apple, Eye, EyeOff, Mail} from 'lucide-react';
import {authService} from '@/services/auth.service'; // Importer pour getErrorMessage

const Signup = () => {
    const {t} = useTranslation();
    const {signup, isLoading} = useAuth(); // Utiliser signup et isLoading du contexte
    const {toast} = useToast();
    const navigate = useNavigate(); // Pour la redirection après succès

    const [fullName, setFullName] = useState(''); // Renommé pour correspondre à l'API (fullName)
    const [username, setUsername] = useState(''); // Ajout du champ username
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    // isLoading est géré par le contexte
    const [errors, setErrors] = useState<{ // Garder la validation côté client
        username?: string;
        password?: string;
        email?: string;
        confirmPassword?: string;
    }>({});

    const validateForm = () => {
        const newErrors: typeof errors = {};

        if (username.length < 3 || username.length > 50) {
            newErrors.username = t('auth.usernameLength'); // Ajouter cette traduction
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
        setErrors({}); // Réinitialiser les erreurs avant de valider/soumettre

        if (!validateForm()) {
            return;
        }

        // Pas besoin de setIsLoading(true)

        try {
            // Appeler la fonction signup du contexte
            const response = await signup(fullName, email, password, username);

            if (response) { // Vérifier si la réponse n'est pas null
                toast({
                    title: t('auth.signupSuccessTitle'), // Ajouter cette traduction
                    description: t('auth.signupSuccessDesc'), // Ajouter cette traduction
                });
                // Rediriger vers la page de login après inscription réussie
                navigate('/auth/login');
            } else {
                // Ce cas ne devrait pas arriver si signup lève une erreur, mais par sécurité
                toast({
                    title: t('auth.signupFailed'),
                    description: "An unexpected issue occurred.",
                    variant: 'destructive',
                });
            }
        } catch (error) {
            console.error('Signup component error:', error);
            const errorMessage = authService.getErrorMessage(error);

            // Essayer d'extraire les erreurs de validation spécifiques du backend si disponibles
            if (error instanceof Error && (error as any).response?.data?.validationErrors) {
                const backendErrors = (error as any).response.data.validationErrors;
                setErrors(prev => ({...prev, ...backendErrors})); // Fusionner avec les erreurs client potentielles
            }

            toast({
                title: t('auth.signupFailed'),
                description: errorMessage,
                variant: 'destructive',
            });
        }
        // Pas besoin de setIsLoading(false)
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
                <div className="space-y-2">
                    <Label htmlFor="fullName">{t('auth.fullName')}</Label> {/* Utiliser i18n */}
                    <Input
                        id="fullName"
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        required
                        autoComplete="name"
                    />
                    {/* Pas d'erreur spécifique pour fullName dans la validation client actuelle */}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="username">{t('auth.username')}</Label> {/* Utiliser i18n */}
                    <Input
                        id="username"
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                        autoComplete="username"
                    />
                    {errors.username && (
                        <p className="text-sm text-destructive">{errors.username}</p>
                    )}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="email">{t('common.email')}</Label>
                    <Input
                        id="email"
                        type="email"
                        placeholder="name@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        autoComplete="email"
                    />
                    {errors.email && (
                        <p className="text-sm text-destructive">{errors.email}</p>
                    )}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="password">{t('common.password')}</Label>
                    <div className="relative">
                        <Input
                            id="password"
                            type={showPassword ? 'text' : 'password'}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="pr-10"
                            autoComplete="new-password"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus:outline-none"
                            tabIndex={-1}
                            aria-label={showPassword ? "Hide password" : "Show password"}
                        >
                            {showPassword ? (
                                <EyeOff className="h-4 w-4"/>
                            ) : (
                                <Eye className="h-4 w-4"/>
                            )}
                        </button>
                    </div>
                    {errors.password && (
                        // Afficher l'erreur sur plusieurs lignes si nécessaire
                        <p className="text-sm text-destructive whitespace-pre-line">{errors.password}</p>
                    )}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="confirmPassword">{t('common.confirmPassword')}</Label>
                    <Input
                        id="confirmPassword"
                        // Utiliser le même état showPassword pour les deux champs
                        type={showPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        autoComplete="new-password"
                    />
                    {errors.confirmPassword && (
                        <p className="text-sm text-destructive">{errors.confirmPassword}</p>
                    )}
                </div>

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