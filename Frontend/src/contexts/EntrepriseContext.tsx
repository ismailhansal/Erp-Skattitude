// src/contexts/EntrepriseContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import api from "@/lib/axios";
import { useAuth } from './AuthContext';

export interface ConfigurationEntreprise {
  id?: number;
  nom?: string;
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
  logo?: string;
  mentions_legales?: string;
  couleur_accent?: string;
}

interface EntrepriseContextType {
  config: ConfigurationEntreprise | null;
  loading: boolean;
  reloadConfig: () => Promise<void>;
}

const EntrepriseContext = createContext<EntrepriseContextType>({
  config: null,
  loading: true,
  reloadConfig: async () => {},
});

// Clé pour localStorage
const STORAGE_KEY = 'entreprise_couleur_accent';

export const EntrepriseProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [config, setConfig] = useState<ConfigurationEntreprise | null>(null);
  const [loading, setLoading] = useState(true);
  const { isAuthenticated } = useAuth();

  // Fonction pour convertir HEX en HSL (format Tailwind)
  const hexToHSL = (hex: string): string => {
    hex = hex.replace('#', '');
    
    const r = parseInt(hex.substring(0, 2), 16) / 255;
    const g = parseInt(hex.substring(2, 4), 16) / 255;
    const b = parseInt(hex.substring(4, 6), 16) / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      
      switch (max) {
        case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
        case g: h = ((b - r) / d + 2) / 6; break;
        case b: h = ((r - g) / d + 4) / 6; break;
      }
    }

    h = Math.round(h * 360);
    s = Math.round(s * 100);
    l = Math.round(l * 100);

    return `${h} ${s}% ${l}%`;
  };

  // Fonction pour appliquer la couleur accent
  const applyAccentColor = (color: string, saveToStorage = true) => {
    if (!color) return;
    
    try {
      const hsl = hexToHSL(color);
      document.documentElement.style.setProperty('--primary', hsl);
      
      // Sauvegarder dans localStorage pour la prochaine fois
      if (saveToStorage) {
        localStorage.setItem(STORAGE_KEY, color);
      }
      
      console.log('🎨 Couleur accent appliquée:', color, '→', hsl);
    } catch (error) {
      console.error('Erreur lors de l\'application de la couleur:', error);
    }
  };

  // Appliquer la couleur sauvegardée IMMÉDIATEMENT au chargement
  useEffect(() => {
    const savedColor = localStorage.getItem(STORAGE_KEY);
    if (savedColor) {
      console.log('🎨 Couleur restaurée depuis localStorage:', savedColor);
      applyAccentColor(savedColor, false); // false = ne pas re-sauvegarder
    }
  }, []); // Exécuté une seule fois au montage

  const fetchConfig = async () => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await api.get<ConfigurationEntreprise[]>('/api/entreprise');
      
      // Le backend retourne un array, prendre le premier élément
      const configData = Array.isArray(response.data) ? response.data[0] : response.data;
      
      setConfig(configData);

      // Appliquer la couleur si elle existe (et la sauvegarder)
      if (configData?.couleur_accent) {
        applyAccentColor(configData.couleur_accent, true);
      }
    } catch (error) {
      console.error("Erreur lors du chargement de la configuration entreprise:", error);
      setConfig(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, [isAuthenticated]);

  // Appliquer la couleur quand elle change (depuis l'API)
  useEffect(() => {
    if (config?.couleur_accent) {
      applyAccentColor(config.couleur_accent, true);
    }
  }, [config?.couleur_accent]);

  return (
    <EntrepriseContext.Provider value={{ config, loading, reloadConfig: fetchConfig }}>
      {children}
    </EntrepriseContext.Provider>
  );
};

// Hook pour accéder au contexte
export const useEntrepriseContext = () => {
  const context = useContext(EntrepriseContext);
  if (!context) {
    throw new Error("useEntrepriseContext doit être utilisé dans un EntrepriseProvider");
  }
  return context;
};

// Hook pour accéder directement à la config (peut retourner null)
export const useEntreprise = () => {
  const { config } = useEntrepriseContext();
  return config;
};