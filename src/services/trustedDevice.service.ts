// src/services/trustedDevice.service.ts
import apiClient from './apiClient';
import { authService } from './auth.service';
import type {
    MessageResponseDto,
    TrustedDeviceDto,
    TrustedDeviceRequestDto,
    TrustedDeviceUpdateDto
} from '@/types/dto';

// Récupère tous les appareils de confiance de l'utilisateur
const getAllTrustedDevices = async (): Promise<TrustedDeviceDto[]> => {
    try {
        const response = await apiClient.get<TrustedDeviceDto[]>('/trusted-devices');
        return response.data;
    } catch (error) {
        console.error('Get trusted devices service error:', error);
        throw error;
    }
};

// Ajoute un nouvel appareil de confiance
const addTrustedDevice = async (request: Omit<TrustedDeviceRequestDto, 'userId'>): Promise<TrustedDeviceDto> => {
    try {
        const response = await apiClient.post<TrustedDeviceDto>(
            '/trusted-devices',
            request
        );
        return response.data;
    } catch (error) {
        console.error('Add trusted device service error:', error);
        throw error;
    }
};

// Met à jour un appareil de confiance
const updateTrustedDevice = async (deviceId: string, request: TrustedDeviceUpdateDto): Promise<TrustedDeviceDto> => {
    try {
        const response = await apiClient.put<TrustedDeviceDto>(
            `/trusted-devices/${deviceId}`,
            request
        );
        return response.data;
    } catch (error) {
        console.error(`Update trusted device ${deviceId} service error:`, error);
        throw error;
    }
};

// Révoque un appareil de confiance
const revokeTrustedDevice = async (deviceId: string): Promise<MessageResponseDto> => {
    try {
        const response = await apiClient.delete<MessageResponseDto>(`/trusted-devices/${deviceId}`);
        return response.data;
    } catch (error) {
        console.error(`Revoke trusted device ${deviceId} service error:`, error);
        throw error;
    }
};

// Révoque tous les appareils de confiance
const revokeAllTrustedDevices = async (): Promise<MessageResponseDto> => {
    try {
        const response = await apiClient.delete<MessageResponseDto>('/trusted-devices');
        return response.data;
    } catch (error) {
        console.error('Revoke all trusted devices service error:', error);
        throw error;
    }
};

export const trustedDeviceService = {
    getAllTrustedDevices,
    addTrustedDevice,
    updateTrustedDevice,
    revokeTrustedDevice,
    revokeAllTrustedDevices,
    getErrorMessage: authService.getErrorMessage, // Réutiliser la fonction du service d'authentification
};