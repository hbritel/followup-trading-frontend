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

    // --- TRADE TABLE COLUMN DEFAULTS ---
    tradeColumnDefaults?: string | null; // JSON string of Record<string, boolean>

    // --- NOTIFICATION BADGE ---
    showNotificationBadge: boolean;

    // --- CALENDAR ---
    weekStartDay?: 'sunday' | 'monday' | null; // Default: monday for most locales

    // --- AI COACHING NOTIFICATIONS ---
    briefingReminderEnabled?: boolean;
    debriefReminderEnabled?: boolean;
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

export type ActivityCategory = 'trade' | 'login' | 'broker' | 'setting' | 'sync' | 'journal';

export interface ActivityItemDto {
    id: string;
    timestamp: string;
    type: string;
    category: ActivityCategory;
    title: string;
    description: string;
    icon: string;
    metadata?: Record<string, unknown>;
}

export interface ActivityPageDto {
    content: ActivityItemDto[];
    page: number;
    size: number;
    totalElements: number;
    totalPages: number;
}

export interface ActivitySummaryDto {
    trades: number;
    syncs: number;
    logins: number;
    journal: number;
    tradePnl: number;
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

export type StrategyRuleCategory = 'ENTRY' | 'EXIT' | 'RISK_MANAGEMENT';

export interface StrategyRuleRequestDto {
  id?: string;
  category: StrategyRuleCategory;
  text: string;
  sortOrder: number;
}

export interface StrategyRuleResponseDto {
  id: string;
  category: StrategyRuleCategory;
  text: string;
  sortOrder: number;
}

export interface StrategyResponseDto {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  active: boolean;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
  rules: StrategyRuleResponseDto[];
}

export interface StrategyRequestDto {
  name: string;
  description?: string | null;
  icon?: string | null;
  active?: boolean;
  isDefault?: boolean;
  rules?: StrategyRuleRequestDto[];
}

export interface StrategyStatsDto {
  strategyId: string;
  strategyName: string;
  description: string | null;
  icon: string | null;
  active: boolean;
  isDefault: boolean;
  tradeCount: number;
  winCount: number;
  lossCount: number;
  winRate: number;
  netPnl: number;
  profitFactor: number;
  expectancy: number;
  averageWin: number;
  averageLoss: number;
  bestTrade: number;
  worstTrade: number;
  rules: StrategyRuleResponseDto[];
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

export type JournalSessionLabel = 'MORNING' | 'AFTERNOON' | 'EVENING' | 'REVIEW';

export interface JournalEntryRequestDto {
  date: string;
  mood: number;
  content?: string | null;
  tags?: string | null;
  linkedTradeIds?: string | null;
  brokerConnectionId?: string | null;
  sessionLabel?: JournalSessionLabel | null;
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
  brokerConnectionId?: string | null;
  sessionLabel?: JournalSessionLabel | null;
}

// --- Watchlist types (matches backend WatchlistDto) ---

export interface WatchlistRequestDto {
  name: string;
  description?: string | null;
  icon?: string | null;
}

export interface WatchlistItemRequestDto {
  symbol: string;
  notes?: string | null;
  alertPrice?: number | null;
  alertCondition?: 'ABOVE' | 'BELOW' | 'CROSSES' | null;
  alertName?: string | null;
  notifyEmail?: boolean | null;
  notifyPush?: boolean | null;
}

export interface WatchlistItemResponseDto {
  id: string;
  symbol: string;
  notes: string | null;
  alertPrice: number | null;
  alertId: string | null;
  alertCondition: string | null;
  activeAlertCount: number;
  addedAt: string;
}

export interface WatchlistResponseDto {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  items: WatchlistItemResponseDto[];
  suspendedByPlan: boolean;
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
  sourceWatchlistId: string | null;
  sourceWatchlistName: string | null;
}

// --- Insight types (matches backend InsightDto) ---

export type InsightType = 'PATTERN' | 'STREAK' | 'RISK_WARNING' | 'IMPROVEMENT' | 'MILESTONE' | 'AI_DIGEST';
export type InsightSeverity = 'INFO' | 'WARNING' | 'CRITICAL';

export interface InsightResponseDto {
  id: string;
  type: InsightType;
  severity: InsightSeverity;
  title: string;
  description: string;
  confidence: number;
  data: string | null;
  actionable: boolean;
  dismissed: boolean;
  generatedAt: string;
  expiresAt: string | null;
  relatedTradeIds: string[];
}

// --- Report types (matches backend ReportDto) ---

export type ReportType =
  | 'TRADE_SUMMARY'
  | 'PERFORMANCE'
  | 'DAILY_JOURNAL'
  | 'STRATEGY_BREAKDOWN'
  | 'RISK_REPORT'
  | 'PERFORMANCE_ATTRIBUTION'
  | 'PROP_FIRM_VERIFICATION'
  | 'BEHAVIORAL_ANALYSIS'
  | 'COMMISSION_ANALYSIS'
  | 'TAX_PREVIEW'
  | 'EQUITY_CURVE_ADVANCED'
  | 'BACKTEST_VS_LIVE'
  | 'YEAR_IN_REVIEW';
export type ReportFormat = 'PDF' | 'CSV';
export type ReportStatus = 'PENDING' | 'GENERATING' | 'COMPLETED' | 'FAILED';

export interface ReportRequestDto {
  type: ReportType;
  format: ReportFormat;
  startDate?: string | null;
  endDate?: string | null;
  accountId?: string;
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

export type BacktestStatus = 'NOT_STARTED' | 'ONGOING' | 'FINISHED' | 'FAILED';

export interface BacktestSaveStateRequestDto {
  sessionState: string;
  status?: string;
}

/** Shape of the session state blob persisted as JSON */
export interface BacktestSessionState {
  currentIndex: number;
  timeframe: string;
  trades: Array<{
    id: string;
    direction: 'LONG' | 'SHORT';
    entryPrice: number;
    stopLoss: number;
    takeProfit: number;
    lotSize: number;
    riskPercent: number;
    riskAmount: number;
    rrRatio: number;
    entryTime: number;
    exitPrice?: number;
    exitTime?: number;
    pnl?: number;
    status: 'OPEN' | 'CLOSED_TP' | 'CLOSED_SL' | 'CLOSED_MANUAL';
  }>;
  quickLotSize: string;
}

export interface BacktestUpdateRequestDto {
  name?: string | null;
  symbol?: string | null;
  timeframe?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  icon?: string | null;
}

export interface BacktestRequestDto {
  name: string;
  strategyDefinition: string;
  startDate: string;
  endDate: string;
  strategyId?: string | null;
  symbol?: string | null;
  timeframe?: string | null;
  initialCapital?: number | null;
  icon?: string | null;
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
  strategyId: string | null;
  symbol: string | null;
  timeframe: string | null;
  initialCapital: number | null;
  sessionState: string | null;
  icon: string | null;
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

export interface OhlcvCandleDto {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface IndicatorPointDto {
  timestamp: number;
  value: number;
}

export interface MarketHistoryResponseDto {
  candles: OhlcvCandleDto[];
  indicators: Record<string, IndicatorPointDto[]>;
}

// --- Trade Replay types (matches backend TradeReplayDto) ---

export interface TradeReplayResponseDto {
  tradeId: string;
  symbol: string;
  direction: string;
  entryPrice: number;
  exitPrice: number;
  stopLoss: number | null;
  takeProfit: number | null;
  entryDate: string;
  exitDate: string;
  quantity: number;
  profitLoss: number;
  interval: string;
  candles: OhlcvCandleDto[];
}

// --- Time metrics types (matches backend MonthlyPerformance / DayOfWeekPerformance / HourOfDayPerformance) ---

export interface MonthlyPerformanceDto {
  year: number;
  month: number;
  startDate: string;
  endDate: string;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  profitLoss: number;
  averageEquity: number;
  winRate: number;
}

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

// --- Insights Metrics types ---

export interface SymbolPerformanceDto {
  symbol: string;
  tradeCount: number;
  winRate: number;
  totalPnl: number;
  averagePnl: number;
  averageHoldingTimeMinutes: number;
  profitFactor: number;
  bestTrade: number;
  worstTrade: number;
}

export interface HeatmapCellDto {
  dayOfWeek: string;
  hour: number;
  tradeCount: number;
  totalPnl: number;
  winRate: number;
}

export interface SessionPerformanceDto {
  session: string;
  tradeCount: number;
  winRate: number;
  totalPnl: number;
  averagePnl: number;
  profitFactor: number;
}

export interface TradeFrequencyPointDto {
  date: string;
  tradeCount: number;
  totalPnl: number;
}

export interface RollingMetricPointDto {
  tradeIndex: number;
  date: string;
  value: number;
}

export type RollingMetric = 'WIN_RATE' | 'PROFIT_FACTOR' | 'EXPECTANCY';

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
  analysis: string;
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
  scheduledTime?: string | null;
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

export type PlanName = 'FREE' | 'STARTER' | 'PRO' | 'ELITE' | 'TEAM';

export interface UsageDto {
  connectionsUsed: number;
  connectionsMax: number;
  tradesUsed: number;
  tradesMax: number;
  aiMessagesToday: number;
  aiMessagesMax: number;
  alertsUsed: number;
  alertsMax: number;
  reportsThisMonth: number;
  reportsMax: number;
  backtestingEnabled: boolean;
  strategiesUsed: number;
  strategiesMax: number;
  tagsUsed: number;
  tagsMax: number;
  watchlistsUsed: number;
  watchlistsMax: number;
}

export interface SubscriptionDto {
  plan: string;
  planDisplayName: string;
  status: string;
  billingInterval: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  monthlyPriceUsd: number;
  annualMonthlyPriceUsd: number;
  usage: UsageDto;
  dunningStep?: number;
  gracePeriodEndsAt?: string;
}

export interface PlanDto {
  name: string;
  displayName: string;
  monthlyPriceUsd: number;
  annualMonthlyPriceUsd: number;
  maxBrokerConnections: number;
  maxTrades: number;
  maxAiMessagesPerDay: number;
  maxAlerts: number;
  maxReportsPerMonth: number;
  backtestingEnabled: boolean;
  publicProfileEnabled: boolean;
  features: string[];
  maxStrategies: number;
  maxTags: number;
  maxWatchlists: number;
  maxSymbolsPerWatchlist: number;
  tradeReplayEnabled: boolean;
  taxPreviewEnabled: boolean;
  fullTaxReportEnabled: boolean;
  csvExportEnabled: boolean;
  advancedMetricsEnabled: boolean;
  scheduledReportsEnabled: boolean;
  marketFeedEnabled: boolean;
  economicCalendarEnabled: boolean;
  websocketEnabled: boolean;
  maxOhlcvHistoryDays: number;
  maxBacktestSessions: number;
  maxManualSyncsPerDay: number;
  autoSyncFrequencyDays: number;
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

// --- Social Trading types ---

export interface UserFollowDto {
  id: string;
  username: string;
  level: string;
  badgeCount: number;
  followerCount: number;
  isFollowing: boolean;
}

export interface SharedStrategyDto {
  id: string;
  userId: string;
  creatorUsername: string;
  title: string;
  description: string;
  strategyData: Record<string, unknown> | null;
  likes: number;
  copies: number;
  likedByMe: boolean;
  createdAt: string;
  historicalWinRate: number | null;
  historicalProfitFactor: number | null;
  tradeCount: number;
  avgRMultiple: number | null;
  suitableMarkets: string | null;
  price: number | null;
  purchasedByMe: boolean;
}

export interface FeedItemDto {
  id: string;
  userId: string;
  username: string;
  level: string;
  type: 'STRATEGY_SHARED' | 'BADGE_EARNED' | 'MILESTONE';
  content: string;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface ShareStrategyRequestDto {
  title: string;
  description: string;
  strategyId: string;
  suitableMarkets?: string;
}

// --- Tax Reporting types ---

export type TaxJurisdiction = 'US' | 'UK' | 'DE' | 'FR' | 'CA' | 'AU' | 'MA' | 'OTHER';
export type HoldingPeriod = 'SHORT_TERM' | 'LONG_TERM';

export interface TaxLotDto {
  tradeId: string;
  symbol: string;
  acquiredDate: string;
  soldDate: string;
  proceeds: number;
  costBasis: number;
  gain: number;
  holdingPeriod: HoldingPeriod;
  isWashSale: boolean;
  washSaleAdjustment: number;
}

export interface WashSaleDto {
  originalTradeId: string;
  replacementTradeId: string;
  symbol: string;
  lossAmount: number;
  adjustmentAmount: number;
  washSaleDate: string;
}

export interface TaxReportDto {
  jurisdiction: TaxJurisdiction;
  year: number;
  totalProceeds: number;
  totalCostBasis: number;
  totalGain: number;
  totalShortTermGain: number;
  totalLongTermGain: number;
  totalWins: number;
  totalLosses: number;
  tradeCount: number;
  washSaleCount: number;
  washSaleAdjustment: number;
  estimatedTax: number;
  lots: TaxLotDto[];
  generatedAt: string;
}

// ── Economic Calendar ──────────────────────────────────────
export type EconomicEventImpact = 'HIGH' | 'MEDIUM' | 'LOW';

export interface EconomicEvent {
  id: string;
  title: string;
  country: string;       // ISO 3166-1 alpha-2: "US", "EU", "GB", "JP", "CA", "AU", "CH", "NZ", "CN"
  currency: string;      // "USD", "EUR", "GBP", "JPY", "CAD", "AUD", "CHF", "NZD", "CNY"
  date: string;          // ISO date "2026-03-24"
  time: string;          // "HH:mm" or "All Day"
  impact: EconomicEventImpact;
  previous: string | null;  // e.g. "3.2%", "256K"
  forecast: string | null;
  actual: string | null;
  description?: string;
}

export interface EconomicCalendarFilters {
  dateRange: 'today' | 'tomorrow' | 'this_week' | 'next_week' | 'custom';
  startDate?: string;
  endDate?: string;
  currencies: string[];
  impacts: EconomicEventImpact[];
}

// === Compliance ===

export type ComplianceStatus = 'FOLLOWED' | 'NOT_FOLLOWED' | 'NOT_APPLICABLE';

export interface RuleComplianceRequest {
  strategyRuleId: string;
  status: ComplianceStatus;
  note?: string;
}

export interface RuleComplianceResponse {
  id: string;
  strategyRuleId: string;
  status: ComplianceStatus;
  note?: string;
  filledAt?: string;
}

export interface StrategyComplianceStatsDto {
  strategyId: string;
  strategyName: string;
  totalTrades: number;
  tradesWithComplianceData: number;
  overallAdherence: number;
  adherentWinRate: number;
  nonAdherentWinRate: number;
  perRuleStats: RuleComplianceStatDto[];
}

export interface RuleComplianceStatDto {
  ruleId: string;
  ruleText: string;
  category: string;
  followedCount: number;
  notFollowedCount: number;
  naCount: number;
  followRate: number;
  avgPnlWhenFollowed?: number;
  avgPnlWhenNotFollowed?: number;
}

// ── Market Feed ────────────────────────────────────────────
export type MarketFeedSource = 'REDDIT' | 'TWITTER' | 'RSS' | 'NEWS_API';
export type MarketFeedCategory = 'FOREX' | 'CRYPTO' | 'STOCKS' | 'COMMODITIES' | 'MACRO' | 'ALL';

export interface MarketFeedItemDto {
  id: string;
  source: MarketFeedSource;
  category: MarketFeedCategory;
  title: string;
  summary: string;
  url: string;
  imageUrl?: string;
  author?: string;
  subreddit?: string;  // Reddit only
  symbols?: string[];  // Mentioned tickers: ["GOLD", "EURUSD"]
  sentiment?: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  score?: number;      // Reddit upvotes or engagement score
  publishedAt: string;
}

export interface MarketFeedSourceConfig {
  id: string;
  source: MarketFeedSource;
  sourceKey: string;
  label: string;
  enabled: boolean;
  categories: MarketFeedCategory[];
}

// ── AI Coach types ──────────────────────────────────────────

export interface BehavioralAlertResponseDto {
  id: string;
  type: string;
  title: string;
  message: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  dismissed: boolean;
  triggerTradeId?: string;
  connectionId?: string;
  createdAt: string;
}

export interface TiltScoreResponseDto {
  score: number;
  factors: string;
  scoreDate: string;
  thresholdLabel: 'GREEN' | 'YELLOW' | 'ORANGE' | 'RED';
  connectionId?: string;
}

export interface BriefingResponseDto {
  id: string;
  briefingDate: string;
  content: string;
  warnings?: string;
  strengths?: string;
  propFirmStatus?: string;
  status: 'GENERATED' | 'VIEWED' | 'DISMISSED';
  generatedAt: string;
  viewedAt?: string;
}

export interface SessionDebriefResponseDto {
  id: string;
  sessionDate: string;
  summary: string;
  sessionScore?: number;
  tradesCount?: number;
  sessionPnl?: number;
  winRate?: number;
  strengths?: string;
  improvements?: string;
  tomorrowRecommendation?: string;
  generatedAt: string;
}

export interface PsychologyEntryRequestDto {
  emotionAfter: string;
  emotionBefore?: string;
  confidence?: number;
  notes?: string;
}

export interface PsychologyEntryResponseDto {
  id: string;
  tradeId: string;
  emotionBefore?: string;
  emotionAfter: string;
  confidence?: number;
  notes?: string;
  createdAt: string;
}

export interface PsychologyCorrelationResponseDto {
  entries: Array<{
    emotion: string;
    tradeCount: number;
    winRate: number;
    avgPnl: number;
  }>;
}

export interface UserAiConfigRequestDto {
  providerType: string;
  baseUrl?: string;
  apiKey?: string;
  modelName: string;
  maxTokens?: number;
  temperature?: number;
}

export interface UserAiConfigResponseDto {
  providerType: string;
  baseUrl?: string;
  maskedApiKey?: string;
  modelName: string;
  maxTokens?: number;
  temperature?: number;
  active: boolean;
  createdAt: string;
}

export interface AiProviderTestResultDto {
  success: boolean;
  message: string;
  latencyMs: number;
}

export interface DisclaimerStatusDto {
  accepted: boolean;
  version: string;
}

export interface SessionSummaryResponseDto {
  todayTradesCount: number;
  todayPnl: number;
  todayWinRate: number;
  activeAlertCount: number;
  tiltScore: number;
}

// ── Admin Billing DTOs ───────────────────────────────────────────────────────

export interface AdminRevenueDto {
  mrr: number;
  arr: number;
  revenue30d: number;
  revenue60d: number;
  revenue90d: number;
}

export interface AdminInvoiceDto {
  id: string;
  customerEmail: string;
  status: string;
  amount: number;
  currency: string;
  createdAt: string;
  invoicePdfUrl: string;
}

export interface AdminTaxLineDto {
  jurisdiction: string;
  country: string;
  taxRate: number;
  amountCollected: number;
  currency: string;
}

export interface AdminDunningUserDto {
  userId: string;
  email: string;
  plan: string;
  dunningStep: number;
  gracePeriodEndsAt: string;
  daysRemaining: number;
}

export interface AdminCouponDto {
  id: string;
  percentOff?: number;
  amountOff?: number;
  currency?: string;
  duration: string;
  maxRedemptions?: number;
  timesRedeemed: number;
  valid: boolean;
}

export interface AdminMetricsDto {
  churnRate: number;
  conversionRate: number;
  arpu: number;
  estimatedLtv: number;
  totalPaidUsers: number;
  totalFreeUsers: number;
}

export interface PlaybookSuggestionDto {
  id: string;
  userId: string;
  strategyId?: string;
  type: 'PREMATURE_EXIT' | 'STOP_TOO_WIDE' | 'STOP_TOO_TIGHT' | 'BEST_TIME_FILTER' | 'SYMBOL_FOCUS';
  title: string;
  description: string;
  currentBehavior: string;
  suggestedAction: string;
  expectedImprovement: number;
  confidence: number;
  sampleSize: number;
  status: 'PENDING' | 'APPLIED' | 'DISMISSED';
  accountIds?: string[];
  appliedAt?: string;
  dismissedAt?: string;
  createdAt: string;
  /**
   * `true` when the wording was produced by the LLM.
   * `false` when the LLM was unavailable and the suggestion was built from a
   * hardcoded fallback template — the underlying metrics are still real, only
   * the phrasing is templated.
   */
  aiGenerated: boolean;
}

export interface TradePlanRequestDto {
  symbol: string;
  direction: 'LONG' | 'SHORT';
  entryPrice: number;
  stopLoss: number;
  takeProfit: number;
  quantity?: number;
  strategyId?: string;
  plannedEntryTime?: string;
  accountId?: string;
}

export interface TradePlanFactorDto {
  value: number;
  score: number;
  weight: number;
  sampleSize: number;
  label: string;
}

export interface TradePlanScoreResponseDto {
  score: number;
  insufficientData: boolean;
  sampleSize: number;
  confidence: number;
  riskRewardRatio: number;
  suggestedSize: number;
  factors: Record<string, TradePlanFactorDto>;
  warnings: string[];
}

// --- Public Profile / Social ---

export interface VerifiedProfileDto {
  username: string;
  bio?: string;
  isVerified: boolean;
  showRealPnl: boolean;
  showSymbols: boolean;
  showStrategies: boolean;
  showEquityCurve: boolean;
  totalTrades: number;
  winRate?: number;
  totalReturnPercent?: number;
  profitFactor?: number;
  sharpeRatio?: number;
  tradingDayCount: number;
  bestMonthPercent?: number;
  worstMonthPercent?: number;
  verificationHash?: string;
  lastVerifiedAt?: string;
  createdAt: string;
}

export interface CreateProfileRequestDto {
  username: string;
  bio?: string;
}

export interface UpdateProfileRequestDto {
  bio?: string;
  showRealPnl?: boolean;
  showSymbols?: boolean;
  showStrategies?: boolean;
  showEquityCurve?: boolean;
}

export interface EquityCurvePointDto {
  date: string;
  value: number;
}

// --- Leaderboard ---

export interface LeaderboardEntryDto {
  rank: number;
  username: string;
  level: string;
  xp: number;
  badgeCount: number;
  winRate?: number;
  sharpeRatio?: number;
  criteriaValue: number;
  criteriaLabel: string;
  isVerified: boolean;
}

export interface LeaderboardResponseDto {
  type: string;
  entries: LeaderboardEntryDto[];
  totalEntries: number;
  page: number;
  size: number;
}

// ── Mentor / Copy-Trading DTOs ──────────────────────────────

export interface MentorInstanceDto {
  id: string;
  brandName: string;
  logoUrl?: string;
  primaryColor: string;
  description?: string;
  inviteCode: string;
  maxStudents: number;
  currentStudents: number;
  active: boolean;
  createdAt: string;
  // Public profile (M9)
  slug?: string | null;
  publicProfileEnabled?: boolean;
  publicHeadline?: string | null;
  publicBio?: string | null;
  publicCredentials?: string | null;
  publicYearsTrading?: number | null;
  // Phase 2 trust & policies
  cancellationPolicy?: MentorCancellationPolicy | null;
  showStatsPublicly?: boolean;
  acceptNewEnabled?: boolean;
  verified?: boolean;
  verifiedAt?: string | null;
}

export interface MentorStudentDto {
  studentUserId: string;
  username: string;
  shareMetrics: boolean;
  shareTrades: boolean;
  sharePsychology: boolean;
  joinedAt: string;
}

export interface CreateInstanceRequestDto {
  brandName: string;
  description?: string;
  logoUrl?: string;
  primaryColor?: string;
}

export interface JoinInstanceRequestDto {
  inviteCode: string;
}

export interface UpdateSharingRequestDto {
  shareMetrics?: boolean;
  shareTrades?: boolean;
  sharePsychology?: boolean;
}

export type MentorAtRiskReason = 'LOW_WIN_RATE' | 'LOSING_STREAK' | 'TILT_SPIKE';

export interface MentorAtRiskStudentDto {
  studentUserId: string;
  username: string;
  winRate: number | null;
  reason: MentorAtRiskReason;
}

export interface MentorMetricsSummaryDto {
  totalStudents: number;
  maxStudents: number;
  activeToday: number;
  avgWinRate: number | null;
  atRiskCount: number;
  sharingMetrics: number;
  sharingTrades: number;
  sharingPsychology: number;
  atRiskStudents?: MentorAtRiskStudentDto[];
}

// ── Mentor Cohorts (M5) ─────────────────────────────────────

export interface MentorCohortDto {
  id: string;
  instanceId: string;
  name: string;
  color: string | null;
  description: string | null;
  memberCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCohortRequestDto {
  name: string;
  color?: string;
  description?: string;
}

export interface UpdateCohortRequestDto {
  name?: string;
  color?: string;
  description?: string;
}

// ── Mentor Activity Feed (M7) ───────────────────────────────

export type MentorActivityEventType =
  | 'STUDENT_JOINED'
  | 'STUDENT_LEFT'
  | 'TRADE_CLOSED'
  | 'TRADE_OPENED'
  | 'PSYCH_LOGGED';

export interface MentorActivityEventDto {
  id: string;
  eventType: MentorActivityEventType;
  studentUserId: string;
  username: string;
  payload: Record<string, unknown> | null;
  occurredAt: string;
}

export interface MentorStudentTradeDto {
  id?: string | number;
  symbol?: string;
  direction?: string;
  type?: string;
  pnl?: number | null;
  profit?: number | null;
  openTime?: string;
}

export interface MentorStudentPsychologyDto {
  id?: string | number;
  emotion?: string;
  note?: string;
  date?: string;
}

// Mentor announcements & student notes (Iteration A)
export interface MentorAnnouncementDto {
  id: string;
  instanceId: string;
  title: string | null;
  body: string;
  pinned: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAnnouncementRequestDto {
  title?: string;
  body: string;
  pinned?: boolean;
}

export interface UpdateAnnouncementRequestDto {
  title?: string;
  body?: string;
  pinned?: boolean;
}

export interface MentorStudentNoteDto {
  id: string;
  studentUserId: string;
  body: string;
  createdAt: string;
  updatedAt: string;
  visibleToStudent: boolean;
}

export interface StudentMentorHubDto {
  instance: MentorInstanceDto;
  announcements: MentorAnnouncementDto[];
  sharedNotes: MentorStudentNoteDto[];
  shareMetrics: boolean;
  shareTrades: boolean;
  sharePsychology: boolean;
  joinedAt: string;
  // Monetization (M10)
  subscriptionRequired?: boolean;
  subscription?: {
    status: 'ACTIVE' | 'PAST_DUE' | 'CANCELED' | 'INCOMPLETE';
    currentPeriodEnd: string | null;
  } | null;
}

// ── Mentor Iteration C: Public profile (M9) + Stripe Connect (M10) ──

export interface MentorTestimonialPublicDto {
  username: string;
  rating: number;
  body: string;
  createdAt: string;
}

export interface MentorPublicProfileDto {
  brandName: string;
  logoUrl: string | null;
  primaryColor: string | null;
  slug: string;
  headline: string | null;
  bio: string | null;
  credentials: string | null;
  yearsTrading: number | null;
  studentsCount: number;
  maxStudents: number;
  testimonials: MentorTestimonialPublicDto[];
  acceptsNewStudents: boolean;
  isCfdContext?: boolean;
  pricing: {
    currency: string;
    monthlyAmount: number;
    stripePriceId: string;
  } | null;
  // Phase 2 additions
  verified: boolean;
  cancellationPolicy: MentorCancellationPolicy;
  showStatsPublicly: boolean;
  stats: MentorPublicStatsDto | null;
  faq: MentorFaqDto[];
  hasContactForm: boolean;
}

// ── Mentor public disclaimer / checkout (Phase 0) ────────────────────────────

export type DisclaimerType =
  | 'RISK_DISCLOSURE'
  | 'NOT_FINANCIAL_ADVICE'
  | 'COOLING_OFF_WAIVER_EU'
  | 'MENTOR_TERMS';

export interface DisclaimerAckResponse {
  acknowledgmentIds: string[];
}

export interface PublicCheckoutResponse {
  checkoutUrl: string;
}

export interface UpdatePublicProfileRequestDto {
  slug?: string;
  headline?: string;
  bio?: string;
  credentials?: string;
  yearsTrading?: number;
  enabled?: boolean;
}

export interface MentorTestimonialDto {
  id: string;
  studentUserId: string;
  username: string;
  rating: number;
  body: string;
  approved: boolean;
  createdAt: string;
}

export interface StudentTestimonialRequestDto {
  rating?: number;
  body?: string;
}

export interface MentorConnectStatusDto {
  accountId: string | null;
  chargesEnabled: boolean;
  detailsSubmitted: boolean;
}

export interface MentorPricingDto {
  defaultPriceCents: number | null;
  currency: string | null;
  connectAccountReady: boolean;
}

export interface SetDefaultPricingRequestDto {
  priceCents: number;
  currency: string;
}

export interface MentorStudentPricingDto {
  studentUserId: string;
  priceCents: number | null;
  waived: boolean;
}

export interface SetStudentPricingRequestDto {
  priceCents?: number;
  waived?: boolean;
}

export type MentorSubscriptionStatus = 'ACTIVE' | 'PAST_DUE' | 'CANCELED' | 'INCOMPLETE';

export interface MentorSubscriptionDto {
  id: string;
  studentUserId: string;
  username: string;
  status: MentorSubscriptionStatus;
  currentPeriodEnd: string | null;
  canceledAt: string | null;
}

export interface MentorOnboardUrlDto {
  url: string;
}

export interface MentorCheckoutUrlDto {
  checkoutUrl: string;
}

// Study Groups (Phase 3E)
export type GroupType = 'OPEN' | 'INVITE_ONLY' | 'MENTOR_LED';
export type GroupRole = 'OWNER' | 'MODERATOR' | 'MEMBER';

export interface StudyGroupDto {
  id: string;
  name: string;
  description: string | null;
  ownerUsername: string;
  type: GroupType;
  maxMembers: number;
  memberCount: number;
  inviteCode: string | null;
  isActive: boolean;
  createdAt: string;
  isMember: boolean;
}

export interface GroupMemberDto {
  id: string;
  userId: string;
  username: string;
  role: GroupRole;
  joinedAt: string;
}

export interface CreateGroupRequestDto {
  name: string;
  description?: string;
  type: GroupType;
}

// ── Prop Firm B2B (Phase 5.1) ─────────────────────────────────────

export interface PropFirmTenantDto {
  id: string;
  firmCode: string;
  firmName: string;
  adminEmail: string;
  apiKey: string;
  logoUrl: string | null;
  primaryColor: string | null;
  isActive: boolean;
  maxTraders: number;
  createdAt: string;
}

export interface TraderSummaryDto {
  userId: string;
  username: string;
  label: string | null;
  winRate: number | null;
  totalReturn: number | null;
  maxDrawdown: number | null;
  tradeCount: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export interface PropFirmDashboardDto {
  activeTraders: number;
  passedEvaluations: number;
  failedEvaluations: number;
  avgWinRate: number | null;
  avgDrawdown: number | null;
  topPerformers: TraderSummaryDto[];
  atRiskTraders: TraderSummaryDto[];
}

export interface AddTraderRequestDto {
  userId: string;
  label?: string;
}

export interface CreateTenantRequestDto {
  firmCode: string;
  firmName: string;
  adminEmail: string;
}


// --- Options Spreads (Phase 6.1) ---

export type SpreadType =
  | 'VERTICAL_CALL'
  | 'VERTICAL_PUT'
  | 'STRADDLE'
  | 'STRANGLE'
  | 'IRON_CONDOR'
  | 'IRON_BUTTERFLY'
  | 'BUTTERFLY_CALL'
  | 'BUTTERFLY_PUT'
  | 'CALENDAR'
  | 'DIAGONAL'
  | 'COVERED_CALL'
  | 'PROTECTIVE_PUT'
  | 'COLLAR'
  | 'CUSTOM';

export type SpreadStatus = 'OPEN' | 'CLOSED' | 'EXPIRED';

export interface SpreadLegDto {
  id: string;
  tradeId: string;
  legType: 'LONG_CALL' | 'SHORT_CALL' | 'LONG_PUT' | 'SHORT_PUT' | 'STOCK';
  strike: number;
  quantity: number;
  premium: number | null;
  sortOrder: number;
  delta?: number | null;
  gamma?: number | null;
  theta?: number | null;
  vega?: number | null;
  impliedVol?: number | null;
  spotAtEntry?: number | null;
}

export type SpreadSource = 'AUTO' | 'MANUAL';

export interface OptionSpreadDto {
  id: string;
  spreadType: SpreadType;
  underlying: string;
  expirationDate: string | null;
  netPremium: number | null;
  maxProfit: number | null;
  maxLoss: number | null;
  breakevenLow: number | null;
  breakevenHigh: number | null;
  realizedPnl: number | null;
  status: SpreadStatus;
  detectedAt: string;
  closedAt?: string | null;
  source?: SpreadSource;
  rolledFromId?: string | null;
  legs: SpreadLegDto[];
}

export interface CreateSpreadLegRequestDto {
  tradeId: string;
  legType: SpreadLegDto['legType'];
  strike: number;
  quantity: number;
  premium: number | null;
  sortOrder?: number;
}

export interface CreateSpreadRequestDto {
  spreadType: SpreadType;
  underlying: string;
  expirationDate: string | null;
  legs: CreateSpreadLegRequestDto[];
}

export interface OptionPortfolioGreeksDto {
  openSpreadCount: number;
  legsWithGreeks: number;
  totalDelta: number | null;
  totalGamma: number | null;
  totalTheta: number | null;
  totalVega: number | null;
}

export interface OptionSpreadAnalyticsDto {
  overall: {
    total: number;
    openCount: number;
    closedCount: number;
    expiredCount: number;
    totalRealized: number | null;
    winRate: number | null;
  };
  perType: Array<{
    spreadType: string;
    count: number;
    totalPnl: number | null;
    avgPnl: number | null;
    winRate: number | null;
    avgHoldDays: number | null;
  }>;
  perUnderlying: Array<{
    underlying: string;
    count: number;
    totalPnl: number | null;
  }>;
}

// --- Developer API (Phase 6.4) ---

export interface DeveloperApiKeyDto {
  id: string;
  name: string;
  apiKey: string;
  scopes: string;
  rateLimit: number;
  isActive: boolean;
  lastUsedAt: string | null;
  createdAt: string;
}

export interface ApiKeyCreatedDto extends DeveloperApiKeyDto {
  secret: string;
}

export interface CreateApiKeyRequestDto {
  name: string;
  scopes: string;
}

// --- Strategy Purchases (Phase 6.5) ---

export interface StrategyPurchaseDto {
  id: string;
  sharedStrategyId: string;
  buyerId: string;
  sellerId: string;
  price: number;
  platformFee: number;
  sellerPayout: number;
  status: string;
  purchasedAt: string;
}

export interface EarningsDto {
  totalEarnings: number;
  pendingPayout: number;
  totalSales: number;
}

// ── Mentor Directory (Phase 1) ────────────────────────────────────────────────

export type MentorTagCategory = 'asset_class' | 'style' | 'focus';

export interface MentorTagDto {
  slug: string;
  category: MentorTagCategory;
  labelEn: string;
  labelFr?: string;
  labelEs?: string;
  sortOrder: number;
}

export interface DirectoryCardDto {
  id: string;
  slug: string;
  brandName: string;
  logoUrl?: string | null;
  primaryColor?: string | null;
  publicHeadline?: string | null;
  publicYearsTrading?: number | null;
  defaultMonthlyPriceCents?: number | null;
  defaultCurrency?: string | null;
  maxStudents: number;
  studentCount: number;
  avgRating: number;
  testimonialCount: number;
  tagSlugs: string[];
  languageCodes: string[];
  monetized: boolean;
  acceptsNewStudents: boolean;
  createdAt: string;
  // Phase 2 addition
  verified?: boolean;
}

export interface DirectoryPageDto {
  content: DirectoryCardDto[];
  totalElements: number;
  page: number;
  size: number;
  totalPages: number;
}

export type DirectorySortKey =
  | 'RELEVANCE'
  | 'NEWEST'
  | 'MOST_STUDENTS'
  | 'HIGHEST_RATED'
  | 'LOWEST_PRICE';

export interface DirectoryQuery {
  q?: string;
  tags?: string[];
  langs?: string[];
  minPrice?: number;
  maxPrice?: number;
  acceptsNew?: boolean;
  monetizedOnly?: boolean;
  verifiedOnly?: boolean;
  sort?: DirectorySortKey;
  page?: number;
  size?: number;
}

export interface LanguageOptionsDto {
  used: string[];
  allowed: string[];
}

// ── Phase 2: Trust & Conversion ─────────────────────────────────────────────

export interface MentorFaqDto {
  id: string;
  question: string;
  answer: string;
  sortOrder: number;
}

export interface MentorFaqMutation {
  question: string;
  answer: string;
}

export interface MentorPublicStatsDto {
  lookbackDays: number;
  tradeCount: number;
  winRate: number | null;
  profitFactor: number | null;
  avgRMultiple: number | null;
  insufficientData: boolean;
}

export type MentorCancellationPolicy =
  | 'PLATFORM_DEFAULT'
  | 'STRICT_NONE'
  | 'FLEXIBLE_7D'
  | 'FLEXIBLE_14D';

export interface MentorContactLeadDto {
  id: string;
  visitorEmail: string;
  message: string;
  consentVersion: string;
  createdAt: string;
  readAt: string | null;
}

export interface MentorContactSubmission {
  email: string;
  message: string;
  consentVersion: string;
}

export type MentorJurisdictionMode = 'ALLOW' | 'DENY';

export interface MentorJurisdictionRuleDto {
  countryCode: string;
  mode: MentorJurisdictionMode;
}

export type MentorComplaintCategory =
  | 'MISLEADING_CREDENTIALS'
  | 'SCAM'
  | 'HARASSMENT'
  | 'COPYRIGHT'
  | 'ILLEGAL_CONTENT'
  | 'MINOR_ABUSE'
  | 'IMPERSONATION'
  | 'OTHER';

export type MentorComplaintStatus =
  | 'OPEN'
  | 'UNDER_REVIEW'
  | 'RESOLVED_REMOVED'
  | 'RESOLVED_REJECTED';

export interface MentorComplaintSubmission {
  reporterEmail?: string;
  category: MentorComplaintCategory;
  description: string;
  evidenceUrl?: string;
}

export interface MentorComplaintDto {
  id: string;
  mentorInstanceId: string;
  reporterEmail: string | null;
  category: MentorComplaintCategory;
  description: string;
  evidenceUrl: string | null;
  status: MentorComplaintStatus;
  adminNotes: string | null;
  createdAt: string;
  resolvedAt: string | null;
}

export interface VerificationCandidateDto {
  instanceId: string;
  brandName: string;
  reasonsMet: string[];
}
