import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import { Client } from '@/types';
import { useToast } from '@/hooks/use-toast';

export const useClients = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // ✅ Fetch clients avec cache
  const { data: clients = [], isLoading, error } = useQuery({
    queryKey: ['clients'],
    queryFn: async () => {
      const res = await api.get<Client[]>('/api/clients');
      return res.data.map(c => ({ ...c, id: c.id.toString() }));
    },
    staleTime: 5 * 60 * 1000, // ← CACHE 5 MINUTES (pas de refetch pendant 5min)
    gcTime: 10 * 60 * 1000, // ← Garde en mémoire 10 minutes
  });

  // ✅ Créer un client
  const createMutation = useMutation({
    mutationFn: async (data: Partial<Client>) => {
      const res = await api.post<Client>('/api/clients', data);
      return { ...res.data, id: res.data.id.toString() };
    },
    onSuccess: (newClient) => {
      // Mettre à jour le cache local SANS refetch
      queryClient.setQueryData<Client[]>(['clients'], (old = []) => [...old, newClient]);
      
      toast({
        title: 'Client créé',
        description: `${newClient.nom_societe} a été ajouté.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erreur',
        description: error.response?.data?.message || 'Erreur lors de la création',
        variant: 'destructive',
      });
    },
  });

  // ✅ Modifier un client
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Client> }) => {
      const res = await api.put<Client>(`/api/clients/${id}`, data);
      return { ...res.data, id: res.data.id.toString() };
    },
    onSuccess: (updatedClient) => {
      // Mettre à jour le cache local
      queryClient.setQueryData<Client[]>(['clients'], (old = []) =>
        old.map(c => (c.id === updatedClient.id ? updatedClient : c))
      );
      
      toast({
        title: 'Client modifié',
        description: `${updatedClient.nom_societe} a été mis à jour.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erreur',
        description: error.response?.data?.message || 'Erreur lors de la modification',
        variant: 'destructive',
      });
    },
  });

  // ✅ Supprimer un client
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/api/clients/${id}`);
      return id;
    },
    onSuccess: (deletedId) => {
      // Retirer du cache local
      queryClient.setQueryData<Client[]>(['clients'], (old = []) =>
        old.filter(c => c.id !== deletedId)
      );
      
      toast({
        title: 'Client supprimé',
        description: 'Le client a été supprimé.',
        variant: 'destructive',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erreur',
        description: 'Impossible de supprimer le client',
        variant: 'destructive',
      });
    },
  });

  return {
    clients,
    isLoading,
    error,
    createClient: createMutation.mutate,
    updateClient: updateMutation.mutate,
    deleteClient: deleteMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
};