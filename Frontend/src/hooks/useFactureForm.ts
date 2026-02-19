import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import { useToast } from '@/hooks/use-toast';

export const useFactureForm = (
  clientId: string, 
  factureId?: string, 
  devisId?: string
) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const isEditFacture = !!factureId;
  const isCreateFromDevis = !!devisId && !factureId;

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

  // Fetch facture (si édition)
  const { data: factureData, isLoading: factureLoading } = useQuery({
    queryKey: ['facture-form', factureId],
    queryFn: async () => {
      const res = await api.get(`/api/clients/${clientId}/factures/${factureId}`);
      return res.data;
    },
    staleTime: Infinity, // ✅ Cache indéfiniment
    gcTime: 24 * 60 * 60 * 1000, // ✅ 24 heures
    enabled: isEditFacture && !!factureId,
  });

  // Fetch devis (si création depuis devis)
  const { data: sourceDevis, isLoading: devisLoading } = useQuery({
    queryKey: ['devis-source', devisId],
    queryFn: async () => {
      const res = await api.get(`/api/clients/${clientId}/devis/${devisId}`);
      return res.data;
    },
    staleTime: Infinity, // ✅ Cache indéfiniment
    gcTime: 24 * 60 * 60 * 1000, // ✅ 24 heures
    enabled: isCreateFromDevis && !!devisId,
  });

  // Mutation save facture
  const saveMutation = useMutation({
    mutationFn: async (payload: any) => {
      if (isEditFacture && factureId) {
        return await api.put(`/api/clients/${clientId}/factures/${factureId}`, payload);
      } else if (isCreateFromDevis && devisId) {
        return await api.post(`/api/clients/${clientId}/devis/${devisId}/factures`, payload);
      } else {
        return await api.post(`/api/clients/${clientId}/factures`, payload);
      }
    },
    onSuccess: (response) => {
      // Invalider les caches
      queryClient.invalidateQueries({ queryKey: ['client-factures', clientId] });
      queryClient.invalidateQueries({ queryKey: ['facture-detail', factureId] });
      queryClient.invalidateQueries({ queryKey: ['devis-factures', clientId, devisId] });
      
      const successMessage = isEditFacture 
        ? 'Facture modifiée avec succès'
        : isCreateFromDevis 
        ? 'Facture créée depuis le devis'
        : 'Facture créée avec succès';

      toast({
        title: 'Succès',
        description: `${successMessage}. N° ${response.data.numero_facture || ''}`,
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erreur',
        description: error.response?.data?.message || 'Une erreur est survenue',
        variant: 'destructive',
      });
    },
  });

  return {
    client,
    factureData,
    sourceDevis,
    isLoading: clientLoading || (isEditFacture && factureLoading) || (isCreateFromDevis && devisLoading),
    saveFacture: saveMutation.mutate,
    isSaving: saveMutation.isPending,
    isEditFacture,
    isCreateFromDevis,
  };
};