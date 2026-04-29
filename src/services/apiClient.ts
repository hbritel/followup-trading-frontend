// src/services/apiClient.ts
import axios, {AxiosError, type InternalAxiosRequestConfig} from 'axios';
import {config} from '@/config';
import { fingerprintService } from './fingerprint.service';
import { authService } from './auth.service';
import { jwtDecode } from 'jwt-decode';
import { toast } from 'sonner';

// Helper to check token expiration
const isTokenExpired = (token: string | null): boolean => {
    if (!token) return true;
    try {
        const decoded: { exp: number } = jwtDecode(token);
        return decoded.exp < Date.now() / 1000;
    } catch { return true; }
};

// Returns true if the token will expire within the given margin (seconds)
const isTokenExpiringSoon = (token: string | null, marginSeconds = 60): boolean => {
    if (!token) return true;
    try {
        const decoded: { exp: number } = jwtDecode(token);
        return decoded.exp < (Date.now() / 1000) + marginSeconds;
    } catch { return true; }
};

const getAccessToken = (): string | null => localStorage.getItem('accessToken');
const getRefreshToken = (): string | null => localStorage.getItem('refreshToken');
const setTokens = (accessToken: string, refreshToken?: string): void => {
    localStorage.setItem('accessToken', accessToken);
    if (refreshToken) {
        localStorage.setItem('refreshToken', refreshToken);
    }
};
const clearTokensAndRedirect = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    console.error("Refresh token failed or missing. User should be logged out.");
    window.location.href = '/auth/login';
};

/**
 * Extracts a user-friendly error message from an API error response.
 */
export const getApiErrorMessage = (error: unknown): string => {
    if (error instanceof AxiosError) {
        // Try to get message from backend error response body
        const data = error.response?.data;
        if (data) {
            if (typeof data === 'string') return data;
            if (data.message) return data.message;
            if (data.error) return data.error;
        }
        if (error.message) return error.message;
    }
    if (error instanceof Error) {
        return error.message;
    }
    return 'An unexpected error occurred. Please try again.';
};

const apiClient = axios.create({
    baseURL: config.apiBaseUrl,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Proactive token refresh — shared promise to avoid concurrent refreshes
let proactiveRefreshPromise: Promise<string | null> | null = null;

async function ensureFreshToken(): Promise<string | null> {
    const token = getAccessToken();
    if (!token) return null;

    // Token is still fresh (>60s left) — use it as-is
    if (!isTokenExpiringSoon(token, 60)) return token;

    // Token is expired or about to expire — try refresh
    if (proactiveRefreshPromise) return proactiveRefreshPromise;

    const refreshTokenValue = getRefreshToken();
    if (!refreshTokenValue || isTokenExpired(refreshTokenValue)) return token; // Let the 401 interceptor handle it

    proactiveRefreshPromise = (async () => {
        try {
            const rs = await authService.refreshToken({ refreshToken: refreshTokenValue });
            setTokens(rs.accessToken, rs.refreshToken);
            return rs.accessToken;
        } catch {
            return token; // Fall back to the old token, 401 interceptor will handle
        } finally {
            proactiveRefreshPromise = null;
        }
    })();

    return proactiveRefreshPromise;
}

// Request interceptor -- adds JWT token and device fingerprint
apiClient.interceptors.request.use(
    async (axiosConfig: InternalAxiosRequestConfig) => {
        const publicAuthPaths = ['/auth/login', '/auth/register', '/auth/refresh-token', '/auth/forgot-password', '/auth/reset-password'];
        const isPublicAuthPath = publicAuthPaths.some(path => axiosConfig.url?.startsWith(path));

        if (!isPublicAuthPath) {
            const token = await ensureFreshToken();
            if (token && axiosConfig.headers) {
                axiosConfig.headers.Authorization = `Bearer ${token}`;
            }
        }
        // Add device fingerprint to all requests
        try {
            const fingerprint = await fingerprintService.getFingerprint();
            if (fingerprint && axiosConfig.headers) {
                axiosConfig.headers['X-Fingerprint'] = fingerprint;
            }
        } catch (error) {
            console.error('Error getting fingerprint for request:', error);
        }
        return axiosConfig;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// --- RESPONSE INTERCEPTOR ---
let isRefreshing = false;
let failedQueue: Array<{ resolve: (value?: string | null) => void; reject: (reason?: unknown) => void }> = [];

const processQueue = (error: unknown, token: string | null = null) => {
    failedQueue.forEach(prom => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });
    failedQueue = [];
};

apiClient.interceptors.response.use(
    response => response,
    async (error: AxiosError) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

        // --- Network error (no response at all) ---
        if (!error.response) {
            toast.error('Connection lost. Please check your internet connection and try again.');
            return Promise.reject(error);
        }

        const status = error.response.status;

        // --- 401 Unauthorized: attempt token refresh ---
        if (status === 401 && !originalRequest._retry) {
            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                }).then(token => {
                    if (originalRequest.headers) {
                        originalRequest.headers['Authorization'] = 'Bearer ' + token;
                    }
                    return apiClient(originalRequest);
                }).catch(err => {
                    return Promise.reject(err);
                });
            }

            originalRequest._retry = true;
            isRefreshing = true;

            const refreshToken = getRefreshToken();
            if (refreshToken && !isTokenExpired(refreshToken)) {
                try {
                    console.log("Attempting token refresh via interceptor...");
                    const rs = await authService.refreshToken({ refreshToken });
                    const { accessToken: newAccessToken, refreshToken: newRefreshToken } = rs;

                    setTokens(newAccessToken, newRefreshToken);

                    console.log("Token refreshed successfully via interceptor.");
                    if (originalRequest.headers) {
                        originalRequest.headers['Authorization'] = 'Bearer ' + newAccessToken;
                    }
                    processQueue(null, newAccessToken);
                    return apiClient(originalRequest);

                } catch (refreshError) {
                    console.error("Refresh token failed in interceptor:", refreshError);
                    processQueue(refreshError, null);
                    clearTokensAndRedirect();
                    return Promise.reject(refreshError);
                } finally {
                    isRefreshing = false;
                }
            } else {
                console.log("No valid refresh token available for refresh.");
                isRefreshing = false;
                clearTokensAndRedirect();
                return Promise.reject(error);
            }
        }

        // --- 403 Forbidden ---
        if (status === 403) {
            toast.error('Access denied. You do not have permission to perform this action.');
            return Promise.reject(error);
        }

        // --- 402 Payment Required: plan limit reached on a gated action ---
        // Backend sends { code: 'PLAN_LIMIT_EXCEEDED', details: { action, currentCount, limit, plan, upgradeUrl } }.
        // Surface the toast once; let the calling code decide whether to show a
        // richer in-page upgrade CTA (our AI coach page does exactly that).
        if (status === 402) {
            const details = error.response?.data?.details ?? {};
            const action = typeof details.action === 'string' ? details.action : 'this action';
            const current = details.currentCount ?? '?';
            const limit = details.limit ?? '?';
            toast.error(
                `You've reached your plan's limit for ${action} (${current}/${limit}). Upgrade or ask support for a bonus.`,
                { duration: 6000 }
            );
            const planErr = Object.assign(new Error('PLAN_LIMIT_EXCEEDED'), {
                isPlanLimitExceeded: true,
                planLimitDetails: details,
                originalError: error,
            });
            return Promise.reject(planErr);
        }

        // --- 429 Rate Limited ---
        if (status === 429) {
            const retryAfter = error.response.headers['retry-after'];
            const seconds = retryAfter ? parseInt(retryAfter, 10) : 60;
            toast.error(`Rate limit exceeded. Please try again in ${seconds} seconds.`);
            const rateLimitError = Object.assign(new Error(
                `Rate limit exceeded. Please try again in ${seconds} seconds.`
            ), { isRateLimited: true, retryAfterSeconds: seconds, originalError: error });
            return Promise.reject(rateLimitError);
        }

        // --- 503 Service Unavailable / Circuit Breaker ---
        if (status === 503) {
            // Feature-flag gates (e.g. mentorship master switch OFF) also return
            // 503. Those are expected by callers that probe the surface on every
            // page load — surfacing a toast every time would spam the user.
            const responseBody = error.response?.data as
                | { error?: string; errorCode?: string }
                | undefined;
            const code = responseBody?.errorCode ?? responseBody?.error;
            const isFeatureGated = code === 'MENTORSHIP_DISABLED';
            if (!isFeatureGated) {
                toast.error('Service is temporarily unavailable. Please try again later.');
            }
            const cbError = Object.assign(new Error(
                'Service is temporarily unavailable. Please try again later.'
            ), {
                isServiceUnavailable: true,
                isFeatureDisabled: isFeatureGated,
                errorCode: code,
                originalError: error,
            });
            return Promise.reject(cbError);
        }

        // --- 500 Internal Server Error ---
        if (status >= 500) {
            toast.error('A server error occurred. Please try again later.');
            return Promise.reject(error);
        }

        // For all other errors (400, 404, 409, 422, etc.), let the calling code handle them
        return Promise.reject(error);
    }
);
// --- END INTERCEPTOR ---

export default apiClient;
