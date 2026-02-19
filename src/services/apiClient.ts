// src/services/apiClient.ts
import axios, {AxiosError, type InternalAxiosRequestConfig} from 'axios';
import {config} from '@/config';
import { fingerprintService } from './fingerprint.service';
import { authService } from './auth.service'; // Importer pour refreshToken
import { jwtDecode } from 'jwt-decode'; // Pour vérifier l'expiration

// Helper pour vérifier l'expiration (peut être partagé)
const isTokenExpired = (token: string | null): boolean => {
    if (!token) return true;
    try {
        const decoded: { exp: number } = jwtDecode(token);
        return decoded.exp < Date.now() / 1000;
    } catch { return true; }
};

// // Fonction pour récupérer le token (nous l'implémenterons dans auth-context)
// const getAccessToken = (): string | null => {
//     try {
//         return localStorage.getItem('accessToken');
//     } catch (e) {
//         console.error('Error reading accessToken from localStorage', e);
//         return null;
//     }
// };

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
    // Rediriger vers login. Attention : ne pas appeler navigate() directement ici.
    // L'intercepteur est en dehors du contexte React Router.
    // La meilleure solution est de déclencher un événement ou d'utiliser le AuthContext.
    // Pour l'instant, on logue et on laisse les composants gérer la redirection
    // suite à l'échec de la requête.
    console.error("Refresh token failed or missing. User should be logged out.");
    window.location.href = '/auth/login'; // Redirection simple pour l'exemple
};

const apiClient = axios.create({
    baseURL: config.apiBaseUrl,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Intercepteur pour ajouter le token JWT aux requêtes sortantes
apiClient.interceptors.request.use(
    async (axiosConfig: InternalAxiosRequestConfig) => {
        const token = getAccessToken();
        if (token && axiosConfig.headers) {
            // Ne pas ajouter le header pour les routes d'auth publiques
            const publicAuthPaths = ['/auth/login', '/auth/register', '/auth/refresh-token', '/auth/forgot-password', '/auth/reset-password'];
            const isPublicAuthPath = publicAuthPaths.some(path => axiosConfig.url?.startsWith(path));

            if (!isPublicAuthPath) {
                axiosConfig.headers.Authorization = `Bearer ${token}`;
            }
        }
        // Ajouter l'empreinte d'appareil à toutes les requêtes
        try {
            const fingerprint = await fingerprintService.getFingerprint();
            if (fingerprint && axiosConfig.headers) {
                axiosConfig.headers['X-Fingerprint'] = fingerprint;
            }
        } catch (error) {
            console.error('Error getting fingerprint for request:', error);
            // Continuer sans empreinte en cas d'erreur
        }
        return axiosConfig;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// --- INTERCEPTEUR DE RÉPONSE POUR REFRESH TOKEN ---
let isRefreshing = false; // Drapeau pour éviter les appels de refresh multiples
let failedQueue: Array<{ resolve: (value?: any) => void; reject: (reason?: any) => void }> = [];

const processQueue = (error: any, token: string | null = null) => {
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
    response => response, // Si la réponse est OK, ne rien faire
    async (error: AxiosError) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

        // Vérifier si l'erreur est 401 et que ce n'est pas une tentative de refresh qui a échoué
        if (error.response?.status === 401 && !originalRequest._retry) {
            if (isRefreshing) {
                // Si déjà en train de rafraîchir, mettre la requête en attente
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                }).then(token => {
                    if (originalRequest.headers) {
                        originalRequest.headers['Authorization'] = 'Bearer ' + token;
                    }
                    return apiClient(originalRequest); // Réessayer avec le nouveau token
                }).catch(err => {
                    return Promise.reject(err);
                });
            }

            originalRequest._retry = true; // Marquer comme une tentative de retry
            isRefreshing = true;

            const refreshToken = getRefreshToken();
            if (refreshToken && !isTokenExpired(refreshToken)) {
                try {
                    console.log("Attempting token refresh via interceptor...");
                    const rs = await authService.refreshToken({ refreshToken }); // Utiliser le service
                    const { accessToken: newAccessToken, refreshToken: newRefreshToken } = rs;

                    setTokens(newAccessToken, newRefreshToken); // Sauvegarder les nouveaux tokens

                    console.log("Token refreshed successfully via interceptor.");
                    if (originalRequest.headers) {
                        originalRequest.headers['Authorization'] = 'Bearer ' + newAccessToken;
                    }
                    processQueue(null, newAccessToken); // Traiter la file d'attente avec succès
                    return apiClient(originalRequest); // Réessayer la requête originale

                } catch (refreshError) {
                    console.error("Refresh token failed in interceptor:", refreshError);
                    processQueue(refreshError, null); // Traiter la file d'attente avec erreur
                    clearTokensAndRedirect(); // Déconnecter l'utilisateur
                    return Promise.reject(refreshError);
                } finally {
                    isRefreshing = false;
                }
            } else {
                console.log("No valid refresh token available for refresh.");
                isRefreshing = false; // Réinitialiser si pas de refresh token valide
                clearTokensAndRedirect();
                return Promise.reject(error); // Rejeter l'erreur originale 401
            }
        }

        // --- Rate Limiting (429) ---
        if (error.response?.status === 429) {
            const retryAfter = error.response.headers['retry-after'];
            const seconds = retryAfter ? parseInt(retryAfter, 10) : 60;
            const rateLimitError = Object.assign(new Error(
                `Rate limit exceeded. Please try again in ${seconds} seconds.`
            ), { isRateLimited: true, retryAfterSeconds: seconds, originalError: error });
            return Promise.reject(rateLimitError);
        }

        // --- Circuit Breaker / Service Unavailable (503) ---
        if (error.response?.status === 503) {
            const cbError = Object.assign(new Error(
                'Broker service is temporarily unavailable. Please try again later.'
            ), { isServiceUnavailable: true, originalError: error });
            return Promise.reject(cbError);
        }

        return Promise.reject(error); // Pour les autres erreurs
    }
);
// --- FIN INTERCEPTEUR ---

export default apiClient;