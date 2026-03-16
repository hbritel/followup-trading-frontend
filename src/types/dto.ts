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

// --- Performance & Dashboard types ---

/** Matches backend DailyPerformanceResponse */
export interface DailyPerformanceDto {
  date: string;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  profitLoss: number;
  equity: number;
  winRate: number;
  drawdownPercent: number;
}

/** Matches backend OpenPositionResponse */
export interface OpenPositionDto {
  tradeId: string;
  symbol: string;
  entryDate: string;
  entryPrice: number;
  currentPrice: number;
  quantity: number;
  direction: string;
  unrealizedPnL: number;
  unrealizedPnLPercentage: number;
}

// --- Strategy types (matches backend StrategyDto) ---

export interface StrategyResponseDto {
  id: string;
  name: string;
  description: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface StrategyRequestDto {
  name: string;
  description?: string | null;
  active?: boolean;
}

// --- Tag types (matches backend TagDto) ---

export interface TagResponseDto {
  id: number;
  name: string;
  color: string;
  createdAt: string;
  updatedAt: string;
}

export interface TagRequestDto {
  name: string;
  color: string;
}

// --- Journal types (matches backend JournalDto) ---

export interface JournalEntryRequestDto {
  date: string;
  mood: number;
  content?: string | null;
  tags?: string | null;
  linkedTradeIds?: string | null;
}

export interface JournalEntryResponseDto {
  id: string;
  date: string;
  mood: number;
  content: string | null;
  tags: string | null;
  linkedTradeIds: string | null;
  createdAt: string;
  updatedAt: string;
}

// --- Watchlist types (matches backend WatchlistDto) ---

export interface WatchlistRequestDto {
  name: string;
  description?: string | null;
}

export interface WatchlistItemRequestDto {
  symbol: string;
  notes?: string | null;
  alertPrice?: number | null;
}

export interface WatchlistItemResponseDto {
  id: string;
  symbol: string;
  notes: string | null;
  alertPrice: number | null;
  addedAt: string;
}

export interface WatchlistResponseDto {
  id: string;
  name: string;
  description: string | null;
  items: WatchlistItemResponseDto[];
  createdAt: string;
  updatedAt: string;
}

// --- Alert types (matches backend AlertDto) ---

export type AlertType = 'PRICE' | 'DRAWDOWN' | 'PROFIT_TARGET' | 'WIN_RATE' | 'CUSTOM';
export type AlertCondition = 'ABOVE' | 'BELOW' | 'CROSSES' | 'PERCENT_CHANGE';
export type AlertStatus = 'ACTIVE' | 'TRIGGERED' | 'EXPIRED' | 'DISABLED';

export interface AlertRequestDto {
  name: string;
  type: AlertType;
  symbol?: string | null;
  condition: AlertCondition;
  threshold: number;
  status?: AlertStatus | null;
  notifyEmail: boolean;
  notifyPush: boolean;
}

export interface AlertResponseDto {
  id: string;
  userId: string;
  name: string;
  type: AlertType;
  symbol: string | null;
  condition: AlertCondition;
  threshold: number;
  currentValue: number | null;
  status: AlertStatus;
  message: string | null;
  triggeredAt: string | null;
  expiresAt: string | null;
  notifyEmail: boolean;
  notifyPush: boolean;
  createdAt: string;
  updatedAt: string;
}

// --- Insight types (matches backend InsightDto) ---

export type InsightType = 'PATTERN' | 'STREAK' | 'RISK_WARNING' | 'IMPROVEMENT' | 'MILESTONE';

export interface InsightResponseDto {
  id: string;
  type: InsightType;
  title: string;
  description: string;
  confidence: number;
  data: string | null;
  actionable: boolean;
  dismissed: boolean;
  generatedAt: string;
  expiresAt: string | null;
}

// --- Report types (matches backend ReportDto) ---

export type ReportType = 'TRADE_SUMMARY' | 'PERFORMANCE' | 'TAX_PREVIEW';
export type ReportFormat = 'PDF' | 'CSV';
export type ReportStatus = 'PENDING' | 'GENERATING' | 'COMPLETED' | 'FAILED';

export interface ReportRequestDto {
  type: ReportType;
  format: ReportFormat;
  startDate?: string | null;
  endDate?: string | null;
}

export interface ReportResponseDto {
  id: string;
  type: ReportType;
  title: string;
  format: ReportFormat;
  status: ReportStatus;
  fileUrl: string | null;
  generatedAt: string | null;
  createdAt: string;
}

// --- Backtest types (matches backend BacktestDto) ---

export type BacktestStatus = 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';

export interface BacktestRequestDto {
  name: string;
  strategyDefinition: string;
  startDate: string;
  endDate: string;
}

export interface BacktestResponseDto {
  id: string;
  userId: string;
  name: string;
  strategyDefinition: string;
  status: BacktestStatus;
  startDate: string;
  endDate: string;
  createdAt: string;
  completedAt: string | null;
  totalTrades: number | null;
  winningTrades: number | null;
  losingTrades: number | null;
  winRate: number | null;
  totalPnl: number | null;
  maxDrawdown: number | null;
  sharpeRatio: number | null;
  averageRMultiple: number | null;
  monteCarloP5: number | null;
  monteCarloP50: number | null;
  monteCarloP95: number | null;
}

// --- Trade Replay types (matches backend TradeReplayDto) ---

export interface TimelinePointDto {
  timestamp: string;
  price: number;
  unrealizedPnl: number;
  annotation: string | null;
}

export interface TradeReplayResponseDto {
  tradeId: string;
  symbol: string;
  direction: string;
  entryPrice: number;
  exitPrice: number;
  entryDate: string;
  exitDate: string;
  quantity: number;
  profitLoss: number;
  timelinePoints: TimelinePointDto[];
}

// --- Time metrics types (matches backend DayOfWeekPerformance / HourOfDayPerformance) ---

export interface DayOfWeekPerformanceDto {
  dayOfWeek: number;
  dayName: string;
  wins: number;
  losses: number;
  totalPnl: number;
}

export interface HourOfDayPerformanceDto {
  hour: number;
  timeLabel: string;
  wins: number;
  losses: number;
  totalPnl: number;
}

// --- AI Trading Coach types ---

export interface AiChatMessageResponseDto {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
}

export interface AiDigestResponseDto {
  id: string;
  content: string;
  weekStart: string;
  weekEnd: string;
  generatedAt: string;
}

export interface AiAnalysisResponseDto {
  tradeId: string;
  summary: string;
  strengths: string[];
  improvements: string[];
  riskAssessment: string;
  generatedAt: string;
}

// --- Trade Import ---

export interface TradeImportResultDto {
  totalParsed: number;
  imported: number;
  skippedDuplicates: number;
  errors: number;
  errorDetails: string[];
}

// --- Notifications ---

export interface NotificationDto {
  id: string;
  type: string; // ALERT_TRIGGERED, SYNC_COMPLETED, TRADE_IMPORTED, BROKER_DISCONNECTED, WEEKLY_DIGEST, NEW_LOGIN_DETECTED, JOURNAL_REMINDER
  title: string;
  message: string;
  read: boolean;
  priority: string; // HIGH, NORMAL, LOW
  link?: string;
  createdAt: string;
}

export interface NotificationPreferenceDto {
  id: string;
  eventType: string;
  inAppEnabled: boolean;
  emailEnabled: boolean;
}

// --- Gamification types ---

export interface GamificationProfileDto {
  xp: number;
  level: string;
  levelName: string;
  currentStreak: number;
  longestStreak: number;
  xpToNextLevel: number;
  xpProgress: number; // 0-100
  badgeCount: number;
  publicProfile: boolean;
  username: string | null;
}

export interface BadgeDto {
  badgeType: string;
  category: string; // TRADING, DISCIPLINE, PERFORMANCE
  title: string;
  description: string;
  iconName: string;
  unlockedAt: string | null; // null = locked
}

export interface LeaderboardEntryDto {
  rank: number;
  username: string;
  levelName: string;
  xp: number;
  badgeCount: number;
  winRate: number;
  sharpeRatio: number;
}

export interface PublicProfileDto {
  username: string;
  levelName: string;
  xp: number;
  badges: BadgeDto[];
  winRate: number;
  sharpeRatio: number;
  totalTrades: number;
}

export interface UpdatePublicProfileRequestDto {
  publicProfile: boolean;
  username?: string | null;
}

// --- Subscription / Billing types ---

export interface UsageDto {
  connections: { current: number; max: number };
  trades: { current: number; max: number };
  aiMessages: { today: number; max: number };
  alerts: { current: number; max: number };
  reports: { thisMonth: number; max: number };
}

export interface SubscriptionDto {
  plan: 'FREE' | 'PRO' | 'ENTERPRISE';
  status: 'ACTIVE' | 'PAST_DUE' | 'CANCELED' | 'TRIALING';
  billingInterval: 'MONTHLY' | 'ANNUAL' | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  usage: UsageDto;
}

export interface PlanDto {
  name: string;
  displayName: string;
  monthlyPrice: number;
  annualPrice: number;
  features: string[];
  limits: Record<string, number>;
}

export interface CheckoutResponseDto {
  checkoutUrl: string;
}

export interface PortalResponseDto {
  portalUrl: string;
}

// --- Onboarding DTOs ---

export interface OnboardingStatusDto {
  completedSteps: string[];
  currentStep: string;
  completed: boolean;
}
