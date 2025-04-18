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
    MfaCompleteRequestDto
} from '@/types/dto'; // Assurez-vous que le chemin est correct
import {AxiosError} from 'axios';
// ...

// Fonction pour vérifier le code TOTP
const verifyTotpCode = async (data: TotpVerifyRequestDto): Promise<MfaResultDto> => {
    try {
        // L'API /mfa/totp/verify renvoie directement les tokens en cas de succès (encapsulés dans MfaResult au backend)
        const response = await apiClient.post<MfaResultDto>('/auth/mfa/totp/verify', data);
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
        const response = await apiClient.post<LoginResponseDto>('/auth/login', credentials);
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

const setupMfa = async (data: MfaSetupRequestDto): Promise<MfaSetupResponseDto> => {
    try {
        const response = await apiClient.post<MfaSetupResponseDto>('/auth/mfa/setup', data);
        return response.data;
    } catch (error) {
        console.error('Setup MFA service error:', error);
        throw error;
    }
};

const initMfaSetup = async (userId: string): Promise<MfaSetupResponseDto> => {
    try {
        const response = await apiClient.post<MfaSetupResponseDto>('/auth/mfa/init', { userId });
        return response.data; // Contient qrCodeUri et secret
    } catch (error) {
        console.error('Init MFA setup service error:', error);
        throw error;
    }
};
  
const completeMfaSetup = async (userId: string, verificationCode: string): Promise<MessageResponseDto> => {
    try {
        const response = await apiClient.post<MessageResponseDto>('/auth/mfa/complete', { 
            userId,
            verificationCode 
        });
        return response.data; // Message de succès
    } catch (error) {
        console.error('Complete MFA setup service error:', error);
        throw error;
    }
};

const disableMfa = async (data: MfaDisableRequestDto): Promise<MessageResponseDto> => {
    try {
        // Renvoie un message de succès
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
    setupMfa,
    initMfaSetup,
    completeMfaSetup, 
    disableMfa,
    sendEmailOtp,
    addTrustedDevice,
    getErrorMessage // Exporter la fonction utilitaire d'erreur
};