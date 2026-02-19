import { useQuery } from '@tanstack/react-query';
import api from '@/lib/axios';

export const useDevisDetail = (clientId: string, devisId: string) => {
  const { data: devis, isLoading: devisLoading } = useQuery({
    queryKey: ['devis-detail', devisId],
    queryFn: async () => {
      const res = await api.get(`/api/clients/${clientId}/devis/${devisId}`);
      const d = res.data;
      
      const dateCreation = d.created_at ? new Date(d.created_at) : new Date();
      const dateEvenement = d.date_evenement ? new Date(d.date_evenement) : new Date();
      
      const lignes = d.lignes?.map((ligne: any) => ({
        id: ligne.id || Math.random(),
        description: String(ligne.description || ''),
        quantiteHotesses: Number(ligne.quantite) || Number(ligne.quantite_hotesses) || 1,
        nombreJours: Number(ligne.nombre_jours) || 1,
        prixUnitaire: Number(ligne.prix_unitaire) || 0,
        tva: Number(ligne.tva) || 20,
      })) || [];

      return {
        ...d,
        dateCreation,
        dateEvenement,
        estFacture: d.statut === 'facturé',
        lignes,
        sousTotal: Number(d.sous_total) || 0,
        montantTva: Number(d.montant_tva) || 0,
        totalTTC: Number(d.total_ttc) || 0,
      };
    },
   staleTime: Infinity, // ✅ Cache indéfiniment
    gcTime: 24 * 60 * 60 * 1000, // ✅ 24 heures
    enabled: !!clientId && !!devisId,
  });

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

  const { data: facturesAssociees = [], isLoading: facturesLoading } = useQuery({
    queryKey: ['devis-factures', clientId, devisId],
    queryFn: async () => {
      const res = await api.get(`/api/clients/${clientId}/devis/${devisId}/factures`);
      
      let facturesData = [];
      if (Array.isArray(res.data)) {
        facturesData = res.data;
      } else if (res.data?.id) {
        facturesData = [res.data];
      }

      return facturesData.map((f) => ({
        ...f,
        id: String(f.id || ''),
        date_facture: f.date_facture ? new Date(f.date_facture) : null,
        date_echeance: f.date_echeance ? new Date(f.date_echeance) : null,
        total_ttc: Number(f.total_ttc) || 0,
      }));
    },
    staleTime: Infinity, // ✅ Cache indéfiniment
    gcTime: 24 * 60 * 60 * 1000, // ✅ 24 heures
    enabled: !!clientId && !!devisId,
  });

  return {
    devis,
    client,
    facturesAssociees,
    isLoading: devisLoading || clientLoading || facturesLoading,
  };
};