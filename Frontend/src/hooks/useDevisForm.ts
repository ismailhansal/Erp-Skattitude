import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import { useToast } from '@/hooks/use-toast';

export const useDevisForm = (clientId: string, devisId?: string) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const isEdit = !!devisId;

  // Fetch client
  const { data: client, isLoading: clientLoading } = useQuery({
    queryKey: ['client', clientId],
    queryFn: async () => {
      const res = await api.get(`/api/clients/${clientId}`);
      return res.data;
    },
    staleTime: Infinity, // ✅ Cache indéfiniment
    gcTime: 24 * 60 * 60 * 1000, // ✅ 24 heures
    enabled: !!clientId,
  });

  // Fetch devis (si édition)
  const { data: devisData, isLoading: devisLoading } = useQuery({
    queryKey: ['devis-form', devisId],
    queryFn: async () => {
      const res = await api.get(`/api/devis/${devisId}`);
      return res.data;
    },
            staleTime: Infinity, // ✅ Cache indéfiniment
    gcTime: 24 * 60 * 60 * 1000, // ✅ 24 heures
    enabled: isEdit,
  });

  // Mutation create/update
  const saveMutation = useMutation({
    mutationFn: async (payload: any) => {
      if (isEdit) {
        return await api.put(`/api/devis/${devisId}`, payload);
      } else {
        return await api.post(`/api/clients/${clientId}/devis`, payload);
      }
    },
    onSuccess: () => {
      // Invalider les caches pour rafraîchir les données
      queryClient.invalidateQueries({ queryKey: ['client-devis', clientId] });
      queryClient.invalidateQueries({ queryKey: ['devis-detail', devisId] });
      
      toast({
        title: isEdit ? 'Devis modifié' : 'Devis créé',
        description: 'Opération réussie',
      });
    },
    onError: () => {
      toast({
        title: 'Erreur',
        description: 'Erreur lors de la sauvegarde',
        variant: 'destructive',
      });
    },
  });

  return {
    client,
    devisData,
    isLoading: clientLoading || (isEdit && devisLoading),
    saveDevis: saveMutation.mutate,
    isSaving: saveMutation.isPending,
  };
};