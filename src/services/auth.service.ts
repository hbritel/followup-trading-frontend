// src/services/auth.service.ts
import apiClient from './apiClient';
import type {
    ApiErrorResponseDto,
    EmailOtpVerifyRequestDto,
    ForgotPasswordRequestDto,
    LoginRequestDto,
    LoginResponseDto,
    MfaResultDto,
    RefreshTokenRequestDto,
    RegisterRequestDto,
    RegisterResponseDto,
    ResetPasswordRequestDto,
    TokenResponseDto,
    TotpVerifyRequestDto,
    MessageResponseDto,// Pour les réponses simples
    TrustedDeviceRequestDto,
    EmailOtpRequestDto,
    EmailOtpResponseDto,
    MfaDisableRequestDto,
    MfaSetupRequestDto,
    MfaSetupResponseDto, // Pour appareil de confiance
    MfaCompleteRequestDto, MfaRequiredResponseDto
} from '@/types/dto'; // Assurez-vous que le chemin est correct
import {AxiosError} from 'axios';

// Variable pour stocker temporairement le token MFA
let currentMfaToken: string | null = null;

// Fonction pour vérifier le code TOTP
const verifyTotpCode = async (data: TotpVerifyRequestDto): Promise<MfaResultDto> => {
    try {
        const headers: Record<string, string> = {};

        // Utiliser la valeur stockée (qui est maintenant le mfaToken dédié ou mfaTokenId)
        // pour le header X-MFA-Token que le backend attend.
        if (currentMfaToken) {
            headers['X-MFA-Token'] = currentMfaToken; // Envoyer la valeur stockée
            console.log("X-MFA-Token header added for verification:", currentMfaToken);
        } else {
            console.warn("Attempting MFA verification without a stored MFA token/ID.");
            // Vous pourriez vouloir lancer une erreur ici si ce token est obligatoire
            // throw new Error("MFA verification token is missing.");
        }

        // L'API /mfa/totp/verify renvoie directement les tokens en cas de succès (encapsulés dans MfaResult au backend)
        const response = await apiClient.post<MfaResultDto>('/auth/mfa/totp/verify', data, { headers });

        // Effacer le token MFA après utilisation
        currentMfaToken = null;

        return response.data;
    } catch (error) {
        console.error('Verify TOTP code service error:', error);
        throw error;
    }
};

// Fonction pour vérifier le code OTP Email
const verifyEmailOtp = async (data: EmailOtpVerifyRequestDto): Promise<MfaResultDto> => {
    try {
        // L'API /mfa/email/verify renvoie directement les tokens en cas de succès
        const response = await apiClient.post<MfaResultDto>('/auth/mfa/email/verify', data);
        return response.data;
    } catch (error) {
        console.error('Verify Email OTP service error:', error);
        throw error;
    }
};

const loginUser = async (credentials: LoginRequestDto): Promise<LoginResponseDto> => {
    try {
        console.log("Attempting login with:", credentials); // Log de débogage
        // L'empreinte sera ajoutée automatiquement par l'intercepteur
        const response = await apiClient.post<LoginResponseDto>('/auth/login', credentials);
        const responseData = response.data;

        // Utiliser un type guard basé sur une propriété unique à MfaRequiredResponseDto
        if ('mfaTokenId' in responseData) {
            // TypeScript sait maintenant que responseData est MfaRequiredResponseDto
            const mfaResponse = responseData as MfaRequiredResponseDto;

            // Stocker le token MFA pour la vérification ultérieure
            if (mfaResponse.mfaToken) {
                currentMfaToken = mfaResponse.mfaToken;
                console.log("Specific MFA token stored for verification:", currentMfaToken);
            } else if (mfaResponse.mfaTokenId) {
                currentMfaToken = mfaResponse.mfaTokenId;
                console.log("MFA token ID stored for verification:", currentMfaToken);
            } else {
                console.error("MFA required response is missing the expected token/ID field.");
                currentMfaToken = null;
            }

            // Si le backend indique que c'est un nouvel appareil, on pourrait stocker cette info
            // pour l'afficher dans l'UI plus tard
            if ('newDeviceDetected' in mfaResponse && mfaResponse.newDeviceDetected) {
                // Stocker dans sessionStorage pour afficher une notification à l'utilisateur
                sessionStorage.setItem('newDeviceDetected', 'true');
            }
        } else if ('accessToken' in responseData) {
            // Login réussi sans MFA, s'assurer que le token MFA est effacé
            currentMfaToken = null;

            // Si le backend indique que c'est un nouvel appareil, on pourrait stocker cette info
            const tokenResponse = responseData as TokenResponseDto & { newDeviceDetected?: boolean };
            if (tokenResponse.newDeviceDetected) {
                sessionStorage.setItem('newDeviceDetected', 'true');
            }
        } else {
            console.error("Unexpected login response structure:", responseData);
            currentMfaToken = null;
        }

        console.log("Login response received:", response.data); // Log de débogage
        return response.data;
    } catch (error) {
        console.error('Login service error:', error);
        // Renvoie l'erreur pour qu'elle soit traitée dans le contexte/composant
        throw error;
    }
};

const registerUser = async (userData: RegisterRequestDto): Promise<RegisterResponseDto> => {
    try {
        const response = await apiClient.post<RegisterResponseDto>('/auth/register', userData);
        return response.data;
    } catch (error) {
        console.error('Register service error:', error);
        throw error;
    }
};

const refreshToken = async (tokenData: RefreshTokenRequestDto): Promise<TokenResponseDto> => {
    try {
        const response = await apiClient.post<TokenResponseDto>('/auth/refresh-token', tokenData);
        return response.data;
    } catch (error) {
        console.error('Refresh token service error:', error);
        throw error;
    }
};

const forgotPassword = async (emailData: ForgotPasswordRequestDto): Promise<void> => {
    try {
        // Le backend renvoie 200 OK avec un message, pas de données spécifiques attendues ici
        await apiClient.post('/auth/forgot-password', emailData);
    } catch (error) {
        console.error('Forgot password service error:', error);
        // Ne pas rejeter l'erreur ici pour masquer l'existence de l'email, comme le fait le backend
        // Le message de succès sera affiché dans le composant quoi qu'il arrive
        console.warn("Forgot password request completed (potential error hidden for security).");
    }
};

const resetPassword = async (resetData: ResetPasswordRequestDto): Promise<void> => {
    try {
        // Le backend renvoie 200 OK avec un message
        await apiClient.post('/auth/reset-password', resetData);
    } catch (error) {
        console.error('Reset password service error:', error);
        throw error;
    }
};

const logoutUser = async (refreshTokenValue: string | null, userId: string): Promise<void> => {
    if (!refreshTokenValue) {
        console.warn("No refresh token provided for logout API call.");
        return; // Ou rejeter une erreur si nécessaire
    }
    try {
        await apiClient.post('/auth/logout', {refreshToken: refreshTokenValue, userId: userId});
        console.log("Logout API call successful.");
    } catch (error) {
        // Ne pas bloquer la déconnexion côté client même si l'appel API échoue
        console.error('Logout service error (client-side logout will proceed):', error);
    }
};


// Fonction utilitaire pour extraire un message d'erreur plus utile d'AxiosError
const getErrorMessage = (error: unknown): string => {
    if (error instanceof AxiosError) {
        const responseData = error.response?.data as ApiErrorResponseDto;
        if (responseData && responseData.message) {
            // Si des erreurs de validation spécifiques existent, les formater
            if (responseData.validationErrors && Object.keys(responseData.validationErrors).length > 0) {
                const validationMessages = Object.entries(responseData.validationErrors)
                    .map(([field, message]) => `${field}: ${message}`)
                    .join(', ');
                return `${responseData.message}. Details: ${validationMessages}`;
            }
            return responseData.message; // Message d'erreur du backend
        }
        if (error.message) {
            return error.message; // Message d'erreur générique d'Axios
        }
    }
    return 'An unexpected error occurred.'; // Fallback
};

// --- Fonctions MFA ---

// const setupMfa = async (data: MfaSetupRequestDto): Promise<MfaSetupResponseDto> => {
//     try {
//         const response = await apiClient.post<MfaSetupResponseDto>('/auth/mfa/setup', data);
//         return response.data;
//     } catch (error) {
//         console.error('Setup MFA service error:', error);
//         throw error;
//     }
// };

const initMfaSetup = async (userId: string): Promise<MfaSetupResponseDto> => {
    try {
        const response = await apiClient.post<MfaSetupResponseDto>('/auth/mfa/setup', { userId });
        return response.data;
    } catch (error) {
        console.error('Init MFA setup service error:', error);
        throw error;
    }
};

const completeMfaSetup = async (userId: string, verificationCode: string): Promise<MessageResponseDto> => {
    try {
        // Le type de requête est MfaCompleteRequestDto
        const data: MfaCompleteRequestDto = { userId, verificationCode };
        // Dans l'app mobile ou navigateur
        console.log("Temps client (ms): " + Date.now());
        console.log("Période TOTP actuelle: " + Math.floor(Date.now() / 1000 / 30)); // 30 secondes est la période standard
        const response = await apiClient.post<MessageResponseDto>('/auth/mfa/complete', data);
        return response.data; // Renvoie un message de succès
    } catch (error) {
        console.error('Complete MFA setup service error:', error);
        throw error;
    }
};

const disableMfa = async (data: MfaDisableRequestDto): Promise<MessageResponseDto> => {
    try {
        const response = await apiClient.post<MessageResponseDto>('/auth/mfa/disable', data);
        return response.data;
    } catch (error) {
        console.error('Disable MFA service error:', error);
        throw error;
    }
};

const sendEmailOtp = async (data: EmailOtpRequestDto): Promise<EmailOtpResponseDto> => {
    try {
        const response = await apiClient.post<EmailOtpResponseDto>('/auth/mfa/email/send', data);
        return response.data;
    } catch (error) {
        console.error('Send Email OTP service error:', error);
        throw error;
    }
};

// verifyTotpCode et verifyEmailOtp devraient déjà exister suite à la correction précédente

// --- Appareil de Confiance ---
const addTrustedDevice = async (data: TrustedDeviceRequestDto, fingerprint: string): Promise<MessageResponseDto> => {
    try {
        // L'empreinte est envoyée via un header
        const response = await apiClient.post<MessageResponseDto>(
            '/auth/trusted-device/add',
            data,
            { headers: { 'X-Fingerprint': fingerprint } } // Ajout du header spécifique ici
        );
        return response.data;
    } catch (error) {
        console.error('Add trusted device service error:', error);
        throw error;
    }
}


export const authService = {
    loginUser,
    registerUser,
    refreshToken,
    forgotPassword,
    resetPassword,
    logoutUser,
    verifyTotpCode,
    verifyEmailOtp,
    // setupMfa,
    initMfaSetup,
    completeMfaSetup, 
    disableMfa,
    sendEmailOtp,
    addTrustedDevice,
    getErrorMessage // Exporter la fonction utilitaire d'erreur
};