// src/context/EntrepriseContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import axios from "axios";

export interface ConfigurationEntreprise {
  nomEntreprise: string;
  adresse: string;
  ville: string;
  telephone1: string;
  telephone2?: string;
  email: string;
  logo?: string;
  mentionsLegales?: string;
  couleurAccent?: string;
}

interface EntrepriseContextType {
  config: ConfigurationEntreprise | null;
  reloadConfig: () => void;
}

const EntrepriseContext = createContext<EntrepriseContextType>({
  config: null,
  reloadConfig: () => {},
});

export const EntrepriseProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [config, setConfig] = useState<ConfigurationEntreprise | null>(null);

  const fetchConfig = async () => {
    try {
      const response = await axios.get<ConfigurationEntreprise>("/api/entreprise");
      setConfig(response.data);
    } catch (error) {
      console.error("Erreur lors du chargement de la configuration entreprise:", error);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  return (
    <EntrepriseContext.Provider value={{ config, reloadConfig: fetchConfig }}>
      {children}
    </EntrepriseContext.Provider>
  );
};

// Hook pratique pour l’utiliser
export const useEntreprise = () => {
  const context = useContext(EntrepriseContext);
  if (!context) {
    throw new Error("useEntreprise doit être utilisé dans un EntrepriseProvider");
  }
  return context.config!;
};

