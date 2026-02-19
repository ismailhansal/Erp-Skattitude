import { useQuery } from '@tanstack/react-query';
import api from '@/lib/axios';

export const useDashboard = () => {
  // Fetch factures
  const { data: factures = [], isLoading: facturesLoading } = useQuery({
    queryKey: ['dashboard-factures'],
    queryFn: async () => {
      const res = await api.get('/api/factures');
      return res.data;
    },
    staleTime: Infinity, // ✅ Cache indéfiniment
    gcTime: 24 * 60 * 60 * 1000, // ✅ 24 heures
  });

  // Fetch devis
  const { data: devis = [], isLoading: devisLoading } = useQuery({
    queryKey: ['dashboard-devis'],
    queryFn: async () => {
      const res = await api.get('/api/devis');
      return res.data;
    },
    staleTime: Infinity, // ✅ Cache indéfiniment
    gcTime: 24 * 60 * 60 * 1000, // ✅ 24 heures
  });

  // Fetch clients
  const { data: clients = [], isLoading: clientsLoading } = useQuery({
    queryKey: ['dashboard-clients'],
    queryFn: async () => {
      const res = await api.get('/api/clients');
      return res.data;
    },
    staleTime: Infinity, // ✅ Cache indéfiniment
    gcTime: 24 * 60 * 60 * 1000, // ✅ 24 heures
  });

  const isLoading = facturesLoading || devisLoading || clientsLoading;

  // Helper pour récupérer un client
  const getClient = (clientId: number) => {
    return clients.find((c: any) => c.id === clientId) || { 
      id: clientId, 
      nom_societe: 'Client inconnu' 
    };
  };

  return {
    factures,
    devis,
    clients,
    isLoading,
    getClient,
  };
};