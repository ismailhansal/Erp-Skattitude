export interface Client {
  id: string;
  nom_societe: string;
  adresse: string;
  ville: string;
  pays: string;
  ice: string;
  telephone: string;
  email: string;
  created_at: string;
  updated_at: string;
  devis?: Devis[];
  factures?: Facture[];
}

export interface LigneDocument {
  id: string;
  description: string;
  quantiteHotesses: number;
  nombreJours: number;
  prixUnitaire: number | ''

  tva: number; // 0 or 20
}

export interface Devis {
  id: string;
  numero: string;
  description?: string; // ⚠️ AJOUTÉ
  clientId: string;
  client?: Client;
  lignes: LigneDocument[];
  dateCreation: Date;
  dateEvenement: Date;
  conditionReglement: string;
  bonCommande?: string;
  sousTotal: number;
  montantTva: number;
  totalTTC: number;
  estFacture: boolean;
}

export interface Facture {
  id: string;
  numero: string;
  description?: string; // ⚠️ AJOUTÉ
  devisId?: string;
  devis?: Devis;
  clientId: string;
  client?: Client;
  lignes: LigneDocument[];
  dateFacturation: Date;
  dateEcheance: Date;
  conditionReglement: string;
  sousTotal: number;
  montantTva: number;
  totalTTC: number;
  estPayee: boolean;
}

export interface BonLivraison {
  id: string;
  numero: string;
  devisId: string;
  clientId: string;
  client?: Client;
  lignes: LigneDocument[];
  dateCreation: Date;
}

export interface ConfigurationEntreprise {
  logo: string;
  nomEntreprise: string;
  adresse: string;
  ville: string;
  ice: string;
  rib: string;
  rc: string;
  tva: string;
  cnss: string;
  numeroTva: string;
  patente: string;
  telephone1: string;
  telephone2: string;
  email: string;
  couleurAccent: string;
  mentionsLegales: string;
}

export type UserRole = 'admin' | 'utilisateur';

export interface User {
  id: string;
  email: string;
  role: UserRole;
}