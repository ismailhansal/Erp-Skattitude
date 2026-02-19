import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import { useToast } from '@/hooks/use-toast';

export const useClientDetail = (clientId: string) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch client
  const { data: client, isLoading: clientLoading } = useQuery({
    queryKey: ['client', clientId],
    queryFn: async () => {
      const res = await api.get(`/api/clients/${clientId}`);
      return { ...res.data, id: res.data.id.toString() };
    },
    staleTime: Infinity, // ✅ Cache indéfiniment
    gcTime: 24 * 60 * 60 * 1000, // ✅ 24 heures
  });

  // Fetch devis du client
  const { data: devis = [], isLoading: devisLoading } = useQuery({
    queryKey: ['client-devis', clientId],
    queryFn: async () => {
      const res = await api.get(`/api/clients/${clientId}/devis`);
      return res.data
        .map((d: any) => ({
          ...d,
          id: d.id.toString(),
          numero: d.numero_devis || '',
          totalTTC: Number(d.total_ttc) || 0,
          description: d.lignes?.length
            ? d.lignes[0].description + (d.lignes.length > 1 ? ` (+${d.lignes.length - 1} autre${d.lignes.length > 2 ? 's' : ''})` : '')
            : 'Aucune prestation',
          dateCreation: d.created_at ? new Date(d.created_at) : null,
          dateEvenement: d.date_evenement ? new Date(d.date_evenement) : null,
          estFacture: d.statut === 'facturé',
          statut: d.statut,
        }))
        .sort((a: any, b: any) => (b.dateCreation?.getTime() ?? 0) - (a.dateCreation?.getTime() ?? 0));
    },
    staleTime: 24 * 60 * 60 * 1000, // 24h
    enabled: !!clientId,
  });

  // Fetch factures du client
  const { data: factures = [], isLoading: facturesLoading } = useQuery({
    queryKey: ['client-factures', clientId],
    queryFn: async () => {
      const res = await api.get(`/api/clients/${clientId}/factures`);
      return res.data
        .map((f: any) => ({
          ...f,
          id: f.id.toString(),
          numero: f.numero_facture || '',
          totalTTC: Number(f.total_ttc) || 0,
          description: f.lignes?.length
            ? f.lignes[0].description + (f.lignes.length > 1 ? ` (+${f.lignes.length - 1} autre${f.lignes.length > 2 ? 's' : ''})` : '')
            : 'Aucune prestation',
          dateFacturation: f.created_at ? new Date(f.created_at) : null,
          dateEcheance: f.date_echeance ? new Date(f.date_echeance) : null,
          estPayee: f.statut === 'payé',
          statut: f.statut,
        }))
        .sort((a: any, b: any) => (b.dateFacturation?.getTime() ?? 0) - (a.dateFacturation?.getTime() ?? 0));
    },
    staleTime: 24 * 60 * 60 * 1000, // 24h
    enabled: !!clientId,
  });

  // Delete devis
  const deleteDevisMutation = useMutation({
    mutationFn: async (devisId: string) => {
      await api.delete(`/api/clients/${clientId}/devis/${devisId}`);
      return devisId;
    },
    onSuccess: (devisId) => {
      queryClient.setQueryData(['client-devis', clientId], (old: any[] = []) =>
        old.filter((d) => d.id !== devisId)
      );
      toast({ title: 'Devis supprimé', description: 'Le devis a été supprimé avec succès.', variant: 'destructive' });
    },
    onError: () => {
      toast({ title: 'Erreur', description: 'Erreur lors de la suppression du devis', variant: 'destructive' });
    },
  });

  // Delete facture
  const deleteFactureMutation = useMutation({
    mutationFn: async (factureId: string) => {
      await api.delete(`/api/clients/${clientId}/factures/${factureId}`);
      return factureId;
    },
    onSuccess: (factureId) => {
      queryClient.setQueryData(['client-factures', clientId], (old: any[] = []) =>
        old.filter((f) => f.id !== factureId)
      );
      toast({ title: 'Facture supprimée', description: 'La facture a été supprimée avec succès.', variant: 'destructive' });
    },
    onError: () => {
      toast({ title: 'Erreur', description: 'Erreur lors de la suppression de la facture', variant: 'destructive' });
    },
  });

  return {
    client,
    devis,
    factures,
    isLoading: clientLoading || devisLoading || facturesLoading,
    deleteDevis: deleteDevisMutation.mutate,
    deleteFacture: deleteFactureMutation.mutate,
  };
};