// src/hooks/useFingerprint.ts
import { useEffect } from 'react';
import { fingerprintService } from '@/services/fingerprint.service';

export const useFingerprint = () => {
    useEffect(() => {
        const initFingerprint = async () => {
            try {
                await fingerprintService.generateFingerprint();
            } catch (error) {
                console.error('Failed to initialize fingerprint:', error);
            }
        };

        initFingerprint();
    }, []);
};