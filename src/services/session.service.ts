// src/services/session.service.ts
import apiClient from './apiClient';
import { authService } from './auth.service'; // Pour getErrorMessage
import type {MessageResponseDto, SessionDto} from '@/types/dto'; // Importer si besoin pour revoke

const getActiveSessions = async (): Promise<SessionDto[]> => {
    try {
        const response = await apiClient.get<SessionDto[]>('/users/me/sessions');
        // Trier côté client par sécurité si le backend ne le fait pas toujours
        return response.data.sort((a, b) => {
            if (a.isCurrentSession && !b.isCurrentSession) return -1;
            if (!a.isCurrentSession && b.isCurrentSession) return 1;
            // Trier ensuite par date de dernière utilisation (plus récente en premier)
            return new Date(b.lastUsedAt).getTime() - new Date(a.lastUsedAt).getTime();
        });
    } catch (error) {
        console.error('Get active sessions service error:', error);
        throw error;
    }
};

const revokeSession = async (sessionId: string): Promise<MessageResponseDto> => {
    try {
        // L'API renvoie un message de succès
        const response = await apiClient.delete<MessageResponseDto>(`/auth/sessions/${sessionId}`);
        return response.data;
    } catch (error) {
        console.error(`Revoke session ${sessionId} service error:`, error);
        throw error;
    }
};


export const sessionService = {
    getActiveSessions,
    revokeSession,
    getErrorMessage: authService.getErrorMessage, // Exporter aussi l'erreur
};