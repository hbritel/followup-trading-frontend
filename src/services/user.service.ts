// src/services/user.service.ts
import apiClient from './apiClient';
import type { UserProfileDto, UserPreferencesDto, ChangePasswordRequestDto } from '@/types/dto'; // Ajustez le chemin si nécessaire
import { AxiosError } from 'axios';
import { authService } from './auth.service'; // Pour getErrorMessage

const getUserProfile = async (): Promise<UserProfileDto> => {
    try {
        // L'intercepteur Axios ajoutera le token automatiquement
        const response = await apiClient.get<UserProfileDto>('/users/me');
        return response.data;
    } catch (error) {
        console.error('Get user profile service error:', error);
        // Peut-être déclencher une déconnexion si 401 non géré par l'intercepteur
        // if (error instanceof AxiosError && error.response?.status === 401) {
        //    // déclencher logout globalement ?
        // }
        throw error;
    }
};

const getUserPreferences = async (): Promise<UserPreferencesDto> => {
    try {
        const response = await apiClient.get<UserPreferencesDto>('/users/me/preferences');
        return response.data;
    } catch (error) {
        console.error('Get user preferences service error:', error);
        throw error;
    }
};

const updateUserPreferences = async (preferences: Partial<UserPreferencesDto>): Promise<UserPreferencesDto> => {
    try {
        const response = await apiClient.put<UserPreferencesDto>('/users/me/preferences', preferences);
        return response.data;
    } catch (error) {
        console.error('Update user preferences service error:', error);
        throw error;
    }
};

const changePassword = async (passwords: ChangePasswordRequestDto): Promise<void> => {
    try {
        // Le backend répond par 200 OK ou une erreur (401 si currentPassword est faux)
        await apiClient.post('/users/me/change-password', passwords);
    } catch (error) {
        console.error('Change password service error:', error);
        throw error; // L'erreur sera traitée dans le composant (e.g., ChangePasswordDialog)
    }
}


// Ajoutez d'autres fonctions userService ici si nécessaire (updateProfile, etc.)

export const userService = {
    getUserProfile,
    getUserPreferences,
    updateUserPreferences,
    changePassword,
    // Exposer getErrorMessage ici aussi peut être utile
    getErrorMessage: authService.getErrorMessage,
};