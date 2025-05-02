// src/services/apiClient.ts
import axios, {type InternalAxiosRequestConfig} from 'axios';
import {config} from '@/config';
import { fingerprintService } from './fingerprint.service';

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

// TODO: Ajouter un intercepteur de réponse pour gérer les erreurs 401 (refresh token)

export default apiClient;