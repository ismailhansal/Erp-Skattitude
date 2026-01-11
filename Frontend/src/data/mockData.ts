import { Client, Devis, Facture, ConfigurationEntreprise } from '@/types';

export const mockClients: Client[] = [
  {
    id: '1',
    societe: 'Événements Royale',
    adresse: '123 Avenue Mohammed V',
    ville: 'Casablanca',
    codePostal: '20000',
    pays: 'Maroc',
    ice: '001234567890123',
    telephone: '+212 522 123 456',
    email: 'contact@royale-events.ma',
    createdAt: new Date('2024-01-15'),
  },
  {
    id: '2',
    societe: 'Luxury Events Marrakech',
    adresse: '45 Rue Yves Saint Laurent',
    ville: 'Marrakech',
    codePostal: '40000',
    pays: 'Maroc',
    ice: '001234567890124',
    telephone: '+212 524 789 012',
    email: 'info@luxury-marrakech.ma',
    createdAt: new Date('2024-02-20'),
  },
  {
    id: '3',
    societe: 'Corporate Solutions',
    adresse: '88 Boulevard Zerktouni',
    ville: 'Casablanca',
    codePostal: '20100',
    pays: 'Maroc',
    ice: '001234567890125',
    telephone: '+212 522 456 789',
    email: 'corporate@solutions.ma',
    createdAt: new Date('2024-03-10'),
  },
];

export const mockDevis: Devis[] = [
  {
    id: '1',
    numero: 'DEV/2026/0001',
    clientId: '1',
    lignes: [
      {
        id: '1',
        description: 'Hôtesses accueil salon automobile',
        quantiteHotesses: 4,
        nombreJours: 3,
        prixUnitaire: 800,
        tva: 20,
      },
    ],
    dateCreation: new Date('2026-01-05'),
    dateEvenement: new Date('2026-01-20'),
    conditionReglement: '30 jours fin de mois',
    sousTotal: 9600,
    montantTva: 1920,
    totalTTC: 11520,
    estFacture: true,
  },
  {
    id: '2',
    numero: 'DEV/2026/0002',
    clientId: '2',
    lignes: [
      {
        id: '2',
        description: 'Animation événement corporate',
        quantiteHotesses: 6,
        nombreJours: 2,
        prixUnitaire: 900,
        tva: 20,
      },
    ],
    dateCreation: new Date('2026-01-08'),
    dateEvenement: new Date('2026-01-25'),
    conditionReglement: 'À réception',
    sousTotal: 10800,
    montantTva: 2160,
    totalTTC: 12960,
    estFacture: false,
  },
  {
    id: '3',
    numero: 'DEV/2026/0003',
    clientId: '3',
    lignes: [
      {
        id: '3',
        description: 'Hôtesses conférence internationale',
        quantiteHotesses: 8,
        nombreJours: 1,
        prixUnitaire: 750,
        tva: 20,
      },
    ],
    dateCreation: new Date('2026-01-02'),
    dateEvenement: new Date('2026-01-08'),
    conditionReglement: '15 jours',
    sousTotal: 6000,
    montantTva: 1200,
    totalTTC: 7200,
    estFacture: false,
  },
];

export const mockFactures: Facture[] = [
  {
    id: '1',
    numero: 'FAC/2026/0001',
    devisId: '1',
    clientId: '1',
    lignes: [
      {
        id: '1',
        description: 'Hôtesses accueil salon automobile',
        quantiteHotesses: 4,
        nombreJours: 3,
        prixUnitaire: 800,
        tva: 20,
      },
    ],
    dateFacturation: new Date('2026-01-06'),
    dateEcheance: new Date('2026-02-06'),
    conditionReglement: '30 jours fin de mois',
    sousTotal: 9600,
    montantTva: 1920,
    totalTTC: 11520,
    estPayee: true,
  },
  {
    id: '2',
    numero: 'FAC/2026/0002',
    clientId: '2',
    lignes: [
      {
        id: '2',
        description: 'Coordination lancement produit',
        quantiteHotesses: 5,
        nombreJours: 2,
        prixUnitaire: 850,
        tva: 20,
      },
    ],
    dateFacturation: new Date('2026-01-03'),
    dateEcheance: new Date('2026-01-18'),
    conditionReglement: '15 jours',
    sousTotal: 8500,
    montantTva: 1700,
    totalTTC: 10200,
    estPayee: false,
  },
  {
    id: '3',
    numero: 'FAC/2026/0003',
    clientId: '3',
    lignes: [
      {
        id: '3',
        description: 'Hôtesses accueil VIP',
        quantiteHotesses: 2,
        nombreJours: 1,
        prixUnitaire: 1000,
        tva: 20,
      },
    ],
    dateFacturation: new Date('2025-12-20'),
    dateEcheance: new Date('2026-01-05'),
    conditionReglement: '15 jours',
    sousTotal: 2000,
    montantTva: 400,
    totalTTC: 2400,
    estPayee: false,
  },
];

export const mockConfiguration: ConfigurationEntreprise = {
  logo: '/logo.png',
  nomEntreprise: 'Skattitude',
  adresse: '25 Rue des Fleurs',
  ville: 'Casablanca 20000',
  ice: '002547896321458',
  rib: 'MA64 0011 0000 0000 1234 5678 9012',
  rc: '456789',
  tva: '20%',
  cnss: '1234567',
  numeroTva: 'MA123456789',
  patente: '789654123',
  telephone1: '+212 522 123 456',
  telephone2: '+212 661 789 012',
  email: 'contact@skattitude.ma',
  couleurAccent: '#a06565',
  mentionsLegales: 'SARL au capital de 100 000 MAD - RC Casablanca 456789 - IF 123456789 - Patente 789654123 - CNSS 1234567',
};

// Helper function to get client by ID
export const getClientById = (id: string): Client | undefined => {
  return mockClients.find(c => c.id === id);
};

// Enrich devis and factures with client data
export const getDevisWithClient = (): (Devis & { client: Client })[] => {
  return mockDevis.map(d => ({
    ...d,
    client: getClientById(d.clientId)!,
  }));
};

export const getFacturesWithClient = (): (Facture & { client: Client })[] => {
  return mockFactures.map(f => ({
    ...f,
    client: getClientById(f.clientId)!,
  }));
};
