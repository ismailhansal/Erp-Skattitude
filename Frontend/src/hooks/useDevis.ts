import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import { useToast } from '@/hooks/use-toast';

export const useDevis = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch tous les devis
  const { data: devisList = [], isLoading: devisLoading } = useQuery({
    queryKey: ['all-devis'],
    queryFn: async () => {
      const res = await api.get('/api/devis');
      return res.data
        .map((d: any) => ({
          ...d,
          id: d.id.toString(),
          clientId: d.client_id,
          numero: d.numero_devis,
          totalTTC: Number(d.total_ttc) || 0,
          dateCreation: d.created_at ? new Date(d.created_at) : null,
          dateEvenement: d.date_evenement ? new Date(d.date_evenement) : null,
          estFacture: d.statut === 'facturé',
          statut: d.statut,
        }))
        .sort((a: any, b: any) => (b.dateCreation?.getTime() ?? 0) - (a.dateCreation?.getTime() ?? 0));
    },
    staleTime: Infinity, // ✅ Cache indéfiniment
    gcTime: 24 * 60 * 60 * 1000, // ✅ 24 heures
  });

  // Fetch clients map
  const clientsIds = Array.from(new Set(devisList.map((d: any) => d.clientId)));
  
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
  });

  // Delete devis
  const deleteMutation = useMutation({
    mutationFn: async ({ clientId, devisId }: { clientId: number; devisId: string }) => {
      await api.delete(`/api/clients/${clientId}/devis/${devisId}`);
      return devisId;
    },
    onSuccess: (devisId) => {
      queryClient.setQueryData(['all-devis'], (old: any[] = []) =>
        old.filter((d) => d.id !== devisId)
      );
      toast({
        title: 'Devis supprimé',
        description: 'Le devis a été supprimé avec succès.',
        variant: 'destructive',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erreur',
        description: error.response?.data?.message || 'Erreur lors de la suppression du devis',
        variant: 'destructive',
      });
    },
  });

  return {
    devisList,
    clientsMap,
    isLoading: devisLoading || clientsLoading,
    deleteDevis: deleteMutation.mutate,
  };
};