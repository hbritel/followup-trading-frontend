// src/services/apiClient.ts
import axios, {type InternalAxiosRequestConfig} from 'axios';
import {config} from '@/config';

// Fonction pour récupérer le token (nous l'implémenterons dans auth-context)
const getAccessToken = (): string | null => {
    try {
        return localStorage.getItem('accessToken');
    } catch (e) {
        console.error('Error reading accessToken from localStorage', e);
        return null;
    }
};

const apiClient = axios.create({
    baseURL: config.apiBaseUrl,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Intercepteur pour ajouter le token JWT aux requêtes sortantes
apiClient.interceptors.request.use(
    (axiosConfig: InternalAxiosRequestConfig) => {
        const token = getAccessToken();
        if (token && axiosConfig.headers) {
            // Ne pas ajouter le header pour les routes d'auth publiques
            const publicAuthPaths = ['/auth/login', '/auth/register', '/auth/refresh-token', '/auth/forgot-password', '/auth/reset-password'];
            const isPublicAuthPath = publicAuthPaths.some(path => axiosConfig.url?.startsWith(path));

            if (!isPublicAuthPath) {
                axiosConfig.headers.Authorization = `Bearer ${token}`;
            }
        }
        // TODO: Ajouter potentiellement l'en-tête X-Fingerprint si nécessaire globalement
        // axiosConfig.headers['X-Fingerprint'] = getDeviceFingerprint();
        return axiosConfig;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// TODO: Ajouter un intercepteur de réponse pour gérer les erreurs 401 (refresh token)

export default apiClient;