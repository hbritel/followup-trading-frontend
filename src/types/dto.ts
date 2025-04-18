// src/types/dto.ts

// Corresponds à AuthDto.java
export interface LoginRequestDto {
    usernameOrEmail: string;
    password: string;
}

export interface RegisterRequestDto {
    username: string;
    email: string;
    password: string;
    fullName: string;
}

export interface RefreshTokenRequestDto {
    refreshToken: string;
}

export interface MfaVerifyRequestDto {
    userId: string; // ou mfaTokenId selon l'endpoint
    code: string;
}

export interface ForgotPasswordRequestDto {
    email: string;
}

export interface ResetPasswordRequestDto {
    token: string;
    newPassword: string;
}

// Corresponds à TokenDto.java
export interface TokenResponseDto {
    accessToken: string;
    refreshToken: string;
    tokenType: string;
}

// Structure générique pour les réponses d'erreur basée sur ErrorResponse.java
export interface ApiErrorResponseDto {
    status: number;
    errorCode?: string;
    message: string; // Message principal pour le développeur ou fallback
    path?: string;
    timestamp?: string;
    requestId?: string;
    validationErrors?: { [key: string]: string }; // Pour les erreurs de validation
}

// Réponse de /register
export interface RegisterResponseDto {
    userId: string;
    username: string;
    email: string;
    fullName: string;
}

// Réponse de /users/me
export interface UserProfileDto {
    id: string;
    username: string;
    email: string;
    fullName: string | null;
    profilePictureUrl: string | null;
    preferredCurrency: string | null;
    timezone: string | null;
    enabled: boolean;
    mfaEnabled: boolean;
    roles: string[];
    provider: string | null; // 'LOCAL', 'GOOGLE', 'APPLE'
    lastLoginAt: string | null; // ISO Date string
    createdAt: string; // ISO Date string
    updatedAt: string; // ISO Date string
}

// Réponse de /users/me/preferences
export interface UserPreferencesDto {
    defaultCurrency: string | null;
    timezone: string | null;
    theme: string | null; // 'light', 'dark', 'system'
    defaultDateRange: string | null; // '1d', '1w', '1m', ...
    pushNotificationsEnabled: boolean;
    emailNotificationsEnabled: boolean;
    performanceReportFrequency: string | null; // 'DAILY', 'WEEKLY', ...
    dateFormat: string | null;
    numberFormat: string | null;
    updatedAt: string; // ISO Date string
}

export interface TotpVerifyRequestDto {
    userId: string;
    code: string;
}

export interface EmailOtpVerifyRequestDto {
    otpTokenId: string; // L'ID du token OTP envoyé par email
    code: string;
}

// La réponse en cas de succès de vérification MFA (similaire à TokenResponseDto)
export interface MfaResultDto {
    accessToken: string;
    refreshToken: string;
    tokenType?: string; // Optionnel, peut ne pas être renvoyé ici
}

// Basé sur UserDto.ChangePasswordRequest
export interface ChangePasswordRequestDto { // <-- Vérifiez le mot-clé 'export'
    currentPassword: string;
    newPassword: string;
    // Ces champs sont dans le DTO Java mais ne sont peut-être pas envoyés depuis le front
    // Si non envoyés, commentez-les ou rendez-les optionnels. Le backend les récupère via HttpServletRequest.
    // ipAddress?: string;
    // userAgent?: string;
}

// --- DTOs MFA ---

// Requête pour démarrer la configuration MFA (AuthDto.MfaSetupRequest)
export interface MfaSetupRequestDto {
    userId: string;
}

// Réponse de la configuration MFA (AuthDto.MfaSetupResponse)
export interface MfaSetupResponseDto {
    secret: string;
    qrCodeUri: string;
}

// Requête pour désactiver MFA (AuthDto.MfaDisableRequest)
export interface MfaDisableRequestDto {
    userId: string;
    password: string; // Nécessite le mot de passe pour confirmer
}

// Requête pour envoyer un OTP par email (AuthDto.EmailOtpRequest)
export interface EmailOtpRequestDto {
    userId: string;
    email: string; // L'email où envoyer le code
}

// Réponse de l'envoi d'OTP par email (AuthDto.EmailOtpResponse)
export interface EmailOtpResponseDto {
    otpTokenId: string; // ID unique du token OTP généré
    message: string;
}

// Requête de vérification TOTP (AuthDto.TotpVerifyRequest) - DÉJÀ AJOUTÉ NORMALEMENT
export interface TotpVerifyRequestDto {
    userId: string;
    code: string;
}

// Requête de vérification OTP Email (AuthDto.EmailOtpVerifyRequest) - DÉJÀ AJOUTÉ NORMALEMENT
export interface EmailOtpVerifyRequestDto {
    otpTokenId: string; // L'ID reçu dans EmailOtpResponseDto
    code: string;
}

// Réponse de vérification MFA réussie (MfaResult -> contient les tokens) - DÉJÀ AJOUTÉ NORMALEMENT
export interface MfaResultDto {
    accessToken: string;
    refreshToken: string;
    tokenType?: string;
}

// Mettre à jour MfaRequiredResponseDto si le backend renvoie aussi userId
// Ceci est CRUCIAL pour l'étape de vérification TOTP
export interface MfaRequiredResponseDto {
    mfaTokenId: string; // Identifiant temporaire de session MFA
    userId: string;     // <-- ASSUMPTION: Le backend renvoie aussi l'ID de l'utilisateur
                        //     Si ce n'est pas le cas, il faudra le récupérer autrement dans MFA.tsx
}


// --- DTOs Utilisateur existants ---
// UserProfileDto, UserPreferencesDto, ChangePasswordRequestDto, etc.

// Requête d'ajout d'appareil de confiance (AuthDto.TrustedDeviceRequest)
export interface TrustedDeviceRequestDto {
    userId: string;
    deviceName: string;
    mfaExemptDays: number;
    // fingerprint sera ajouté via header X-Fingerprint
}

// Réponse générique avec message (AuthDto.MessageResponse)
export interface MessageResponseDto {
    message: string;
}

export interface MfaCompleteRequestDto {
    userId: string;
    verificationCode: string;
}

// Mettre à jour LoginResponseDto si MfaResultDto remplace TokenResponseDto pour la vérification MFA
export type LoginResponseDto = TokenResponseDto | MfaRequiredResponseDto;
// Ou si le résultat de verifyMfa est différent :
export type VerifyMfaResponseDto = MfaResultDto; // Ou un type spécifique si la structure diffère