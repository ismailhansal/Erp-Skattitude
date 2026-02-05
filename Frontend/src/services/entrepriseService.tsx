// src/services/entrepriseService.ts
import api from '@/lib/axios';

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
    const response = await api.get('/api/entreprise');
    return response.data;
  },

  // Sauvegarder l'entreprise (création ou mise à jour automatique)
  saveEntreprise: async (data: Partial<EntrepriseData>): Promise<EntrepriseData> => {
    const response = await api.post('/api/entreprise', data);
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