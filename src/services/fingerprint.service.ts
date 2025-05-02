// src/services/fingerprint.service.ts
import FingerprintJS from '@fingerprintjs/fingerprintjs';

let cachedFingerprint: string | null = null;
let fingerprintPromise: Promise<string> | null = null;

// Génère une empreinte d'appareil unique basée sur plusieurs caractéristiques
const generateFingerprint = async (): Promise<string> => {
    // Si nous avons déjà une empreinte en cache, la retourner
    if (cachedFingerprint) {
        return cachedFingerprint;
    }

    // Si une génération est déjà en cours, attendre ce résultat
    if (fingerprintPromise) {
        return fingerprintPromise;
    }

    // Sinon, initialiser une nouvelle génération
    fingerprintPromise = initFingerprintGeneration();

    try {
        const fingerprint = await fingerprintPromise;
        cachedFingerprint = fingerprint;
        return fingerprint;
    } catch (error) {
        console.error('Error generating fingerprint:', error);
        // En cas d'erreur, générer une empreinte de secours basée sur l'UA et une valeur aléatoire
        const fallbackFingerprint = `fb-${navigator.userAgent}-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
        cachedFingerprint = fallbackFingerprint;
        return fallbackFingerprint;
    } finally {
        fingerprintPromise = null;
    }
};

// Initialise la génération d'empreinte via la bibliothèque FingerprintJS
const initFingerprintGeneration = async (): Promise<string> => {
    try {
        const fpPromise = FingerprintJS.load();
        const fp = await fpPromise;
        const result = await fp.get();
        // Utiliser le visitorId comme empreinte principale
        return result.visitorId;
    } catch (error) {
        console.error('FingerprintJS error:', error);
        throw error;
    }
};

// Récupère l'empreinte actuelle (la génère si nécessaire)
const getFingerprint = async (): Promise<string> => {
    if (!cachedFingerprint) {
        return generateFingerprint();
    }
    return cachedFingerprint;
};

// Ajoute l'empreinte aux en-têtes de requêtes Axios
const addFingerprintToRequest = async (config: any): Promise<any> => {
    try {
        const fingerprint = await getFingerprint();
        if (!config.headers) {
            config.headers = {};
        }
        config.headers['X-Fingerprint'] = fingerprint;
        return config;
    } catch (error) {
        console.error('Error adding fingerprint to request:', error);
        return config;
    }
};

export const fingerprintService = {
    generateFingerprint,
    getFingerprint,
    addFingerprintToRequest,
};