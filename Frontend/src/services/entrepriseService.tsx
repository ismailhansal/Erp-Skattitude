// src/services/entrepriseService.ts
import axios from 'axios';

const API_URL = 'http://127.0.0.1:8000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Intercepteur pour logger les requêtes (debug)
api.interceptors.request.use(
  (config) => {
    console.log('🚀 Requête API:', config.method?.toUpperCase(), config.url, config.data);
    return config;
  },
  (error) => {
    console.error('❌ Erreur requête:', error);
    return Promise.reject(error);
  }
);

// Intercepteur pour logger les réponses (debug)
api.interceptors.response.use(
  (response) => {
    console.log('✅ Réponse API:', response.status, response.data);
    return response;
  },
  (error) => {
    console.error('❌ Erreur réponse:', error.response?.status, error.response?.data);
    return Promise.reject(error);
  }
);

export interface EntrepriseData {
  id?: number;
  nom: string;
  logo?: string;
  adresse?: string;
  ville?: string;
  telephone_1?: string;
  telephone_2?: string;
  email?: string;
  ICE?: string;
  RC?: string;
  TVA?: string;
  patente?: string;
  CNSS?: string;
  RIB?: string;
  couleur_accent?: string;
}

export const entrepriseService = {
  // Récupérer la configuration de l'entreprise
  getConfiguration: async (): Promise<EntrepriseData> => {
    const response = await api.get('/entreprise');
    return response.data;
  },

  // Sauvegarder l'entreprise (création ou mise à jour automatique)
  saveEntreprise: async (data: Partial<EntrepriseData>): Promise<EntrepriseData> => {
    const response = await api.post('/entreprise', data);
    return response.data;
  },

  // Mettre à jour l'entreprise (méthode alternative avec ID)
  updateEntreprise: async (id: number, data: Partial<EntrepriseData>): Promise<EntrepriseData> => {
    const response = await api.put(`/entreprise/${id}`, data);
    return response.data;
  },

  // Supprimer l'entreprise
  deleteEntreprise: async (id: number): Promise<void> => {
    await api.delete(`/entreprise/${id}`);
  },
};

export default entrepriseService;