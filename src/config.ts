// src/config.ts
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL as string;

if (!API_BASE_URL) {
    console.warn(
        "VITE_API_BASE_URL is not defined. Using default fallback: /api/v1 (ensure proxy is configured if needed)."
    );
}

export const config = {
    apiBaseUrl: API_BASE_URL || '/api/v1', // Fallback si non défini
};

console.log("API Base URL:", config.apiBaseUrl); // Pour vérifier au démarrage