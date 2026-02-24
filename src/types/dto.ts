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
    phone: string | null;
    tradingBio: string | null;
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
    mobilePushNotificationsEnabled: boolean;
    browserPushNotificationsEnabled: boolean;
    priceAlertsEnabled: boolean;
    tradeConfirmationsEnabled: boolean;
    newsAlertsEnabled: boolean;
    earningsAnnouncementsEnabled: boolean;
    accountActivityNotificationsEnabled: boolean;
    emailNotificationsEnabled: boolean;
    performanceReportFrequency: string | null; // 'DAILY', 'WEEKLY', ...
    dateFormat: string | null;
    numberFormat: string | null;
    inactivityTimeoutMinutes?: number | null;
    updatedAt: string; // ISO Date string

    // --- NOUVEAUX CHAMPS POUR L'APPARENCE ---
    accentColor?: string | null;       // ex: 'blue', 'green', etc. ou null
    fontSize?: string | null;          // ex: 'small', 'medium', 'large' ou null
    layoutDensity?: string | null;     // ex: 'compact', 'comfortable', 'spacious' ou null

    // --- NOUVEAUX CHAMPS POUR LES GRAPHIQUES ---
    defaultChartStyle?: string | null; // ex: 'candle', 'bar', 'line', 'area' ou null
    defaultChartInterval?: string | null;// ex: '1', '5', 'D', 'W' ou null
    showChartVolume: boolean;         // Pas besoin de null si valeur par défaut existe (true/false)
    showExtendedHours: boolean;       // Idem

    // --- NOUVEAUX CHAMPS POUR LE PROFIL TRADING ---
    experienceLevel?: string | null;
    yearsTrading?: string | null;
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
export interface ChangePasswordRequestDto {
    currentPassword: string;
    newPassword: string;
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

// Requête de vérification TOTP (AuthDto.TotpVerifyRequest)
export interface TotpVerifyRequestDto {
    userId: string;
    code: string;
}

// Requête de vérification OTP Email (AuthDto.EmailOtpVerifyRequest)
export interface EmailOtpVerifyRequestDto {
    otpTokenId: string; // L'ID reçu dans EmailOtpResponseDto
    code: string;
}

// Réponse de vérification MFA réussie (MfaResult -> contient les tokens)
export interface MfaResultDto {
    accessToken: string;
    refreshToken: string;
    tokenType?: string;
}

// Mettre à jour MfaRequiredResponseDto si le backend renvoie aussi userId
// Ceci est CRUCIAL pour l'étape de vérification TOTP
export interface MfaRequiredResponseDto {
    mfaTokenId: string; // Identifiant temporaire de session MFA
    userId: string;
    mfaToken?: string; // <-- Si le backend renvoie maintenant ce champ spécifique
                       //     Rendez-le optionnel (?) si ce n'est pas garanti.
                       //     Si mfaToken REMPLACE mfaTokenId, ajustez en conséquence.
}

// Interface correspondant à SessionDto.java
export interface SessionDto {
    id: string;
    ipAddress: string | null; // Rendre nullable si le backend peut renvoyer null
    userAgent: string | null; // Rendre nullable
    createdAt: string; // ISO Date string
    lastUsedAt: string; // ISO Date string
    expiresAt: string; // ISO Date string
    isCurrentSession: boolean;
    // deviceName?: string | null; // Ajouter si le backend les inclut
}

// DTO pour les appareils de confiance
export interface TrustedDeviceDto {
    id: string;
    name: string;
    fingerprint: string;
    lastIpAddress: string | null;
    lastUserAgent: string | null;
    lastUsedAt: string; // ISO Date string
    createdAt: string; // ISO Date string
    isMfaExempt: boolean;
    mfaExemptUntil: string | null; // ISO Date string
    isCurrentDevice: boolean;
}

// DTO pour la mise à jour d'un appareil de confiance
export interface TrustedDeviceUpdateDto {
    deviceName?: string;
    mfaExemptDays?: number;
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

// --- Activity DTOs ---

export type ActivityCategory = 'trade' | 'login' | 'broker' | 'setting';

export interface ActivityItemDto {
    id: string;
    timestamp: string;
    type: string;
    category: ActivityCategory;
    title: string;
    description: string;
    icon: string;
}

export interface ActivityPageDto {
    content: ActivityItemDto[];
    page: number;
    size: number;
    totalElements: number;
    totalPages: number;
}
