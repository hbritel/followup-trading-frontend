
import { API_BASE_URL, getDefaultHeaders, handleApiResponse } from './config';

export const apiService = {
  /**
   * Effectue une requête GET
   */
  get: async <T>(endpoint: string): Promise<T> => {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'GET',
      headers: getDefaultHeaders(),
    });
    
    return handleApiResponse(response);
  },
  
  /**
   * Effectue une requête POST
   */
  post: async <T>(endpoint: string, data: any): Promise<T> => {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: getDefaultHeaders(),
      body: JSON.stringify(data),
    });
    
    return handleApiResponse(response);
  },
  
  /**
   * Effectue une requête PUT
   */
  put: async <T>(endpoint: string, data: any): Promise<T> => {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'PUT',
      headers: getDefaultHeaders(),
      body: JSON.stringify(data),
    });
    
    return handleApiResponse(response);
  },
  
  /**
   * Effectue une requête DELETE
   */
  delete: async <T>(endpoint: string): Promise<T> => {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'DELETE',
      headers: getDefaultHeaders(),
    });
    
    return handleApiResponse(response);
  },
  
  /**
   * Effectue un upload de fichier
   */
  uploadFile: async <T>(endpoint: string, file: File, additionalFields?: Record<string, any>): Promise<T> => {
    const formData = new FormData();
    formData.append('file', file);
    
    if (additionalFields) {
      Object.entries(additionalFields).forEach(([key, value]) => {
        formData.append(key, String(value));
      });
    }
    
    // On ne définit pas le Content-Type ici car le navigateur le fait automatiquement avec le boundary
    const headers: Record<string, string> = {};
    const token = localStorage.getItem('auth_token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: headers,
      body: formData,
    });
    
    return handleApiResponse(response);
  },
};
