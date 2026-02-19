import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import { useToast } from '@/hooks/use-toast';

export const useFactureDetail = (clientId: string, factureId: string) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: facture, isLoading } = useQuery({
    queryKey: ['facture-detail', factureId],
    queryFn: async () => {
      const res = await api.get(`/api/clients/${clientId}/factures/${factureId}`);
      return res.data;
    },
    staleTime: Infinity, // ✅ Cache indéfiniment
    gcTime: 24 * 60 * 60 * 1000, // ✅ 24 heures
    enabled: !!clientId && !!factureId,
  });

  const marquerPayeeMutation = useMutation({
    mutationFn: async () => {
      await api.put(`/api/clients/${clientId}/factures/${factureId}/mark-paid`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['facture-detail', factureId] });
      toast({
        title: 'Facture marquée comme payée',
        description: `La facture a été marquée comme payée.`,
      });
    },
    onError: () => {
      toast({
        title: 'Erreur',
        description: 'Impossible de marquer la facture comme payée.',
        variant: 'destructive',
      });
    },
  });

  return {
    facture,
    isLoading,
    marquerPayee: marquerPayeeMutation.mutate,
  };
};