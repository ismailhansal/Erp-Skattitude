import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import { useToast } from '@/hooks/use-toast';

export const useFactures = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch toutes les factures
  const { data: facturesList = [], isLoading: facturesLoading } = useQuery({
    queryKey: ['all-factures'],
    queryFn: async () => {
      const res = await api.get('/api/factures');
      return res.data
        .map((f: any) => ({
          ...f,
          id: f.id.toString(),
          clientId: f.client_id,
          numero: f.numero_facture,
          totalTTC: Number(f.total_ttc) || 0,
          estPayee: f.statut === 'payé',
          dateFacturation: f.created_at ? new Date(f.created_at) : null,
          dateEcheance: f.date_echeance ? new Date(f.date_echeance) : null,
          statut: f.statut,
        }))
        .sort((a: any, b: any) => (b.dateFacturation?.getTime() ?? 0) - (a.dateFacturation?.getTime() ?? 0));
    },
   staleTime: Infinity, // ✅ Cache indéfiniment
    gcTime: 24 * 60 * 60 * 1000, // ✅ 24 heures
  });

  // Fetch clients map
  const clientsIds = Array.from(new Set(facturesList.map((f: any) => f.clientId)));
  
  const { data: clientsMap = {}, isLoading: clientsLoading } = useQuery({
    queryKey: ['clients-map', clientsIds],
    queryFn: async () => {
      const clientsMapTemp: Record<number, any> = {};
      await Promise.all(
        clientsIds.map(async (id: number) => {
          const res = await api.get(`/api/clients/${id}`);
          clientsMapTemp[id] = { ...res.data, id: Number(res.data.id) };
        })
      );
      return clientsMapTemp;
    },
    staleTime: Infinity, // ✅ Cache indéfiniment
    gcTime: 24 * 60 * 60 * 1000, // ✅ 24 heures
    enabled: clientsIds.length > 0,
  });

  // Delete facture
  const deleteMutation = useMutation({
    mutationFn: async ({ clientId, factureId }: { clientId: number; factureId: string }) => {
      await api.delete(`/api/clients/${clientId}/factures/${factureId}`);
      return factureId;
    },
    onSuccess: (factureId) => {
      queryClient.setQueryData(['all-factures'], (old: any[] = []) =>
        old.filter((f) => f.id !== factureId)
      );
      toast({
        title: 'Facture supprimée',
        description: 'La facture a été supprimée avec succès.',
        variant: 'destructive',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erreur',
        description: error.response?.data?.message || 'Erreur lors de la suppression de la facture',
        variant: 'destructive',
      });
    },
  });

  return {
    facturesList,
    clientsMap,
    isLoading: facturesLoading || clientsLoading,
    deleteFacture: deleteMutation.mutate,
  };
};