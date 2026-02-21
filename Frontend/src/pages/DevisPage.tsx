import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, MoreHorizontal, Eye, Edit, Trash2, Receipt } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { DataTable } from '@/components/ui/data-table';
import { StatusBadge } from '@/components/ui/status-badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import api from '@/lib/axios'; // ← Votre instance configurée
import { format, isBefore } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Devis, Client } from '@/types';
import { useToast } from '@/hooks/use-toast';

const DevisPage: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [devisList, setDevisList] = useState<Devis[]>([]);
  const [clientsMap, setClientsMap] = useState<Record<number, Client>>({});
  const [loading, setLoading] = useState(true);
  const today = new Date();

  // Format montant
  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('fr-MA', { style: 'currency', currency: 'MAD' }).format(amount);

  // Fetch tous les devis + clients
  useEffect(() => {
    const fetchDevis = async () => {
      try {
        const devisRes = await api.get<any[]>('/api/devis');
        const clientsIds = Array.from(new Set(devisRes.data.map(d => d.client_id)));
        
        // Fetch info clients
        const clientsMapTemp: Record<number, Client> = {};
        await Promise.all(clientsIds.map(async (id) => {
          const res = await api.get<Client>(`/api/clients/${id}`);
          clientsMapTemp[id] = {
            ...res.data,
            id: Number(res.data.id),
          };
        }));

        setClientsMap(clientsMapTemp);

        // Map devis
       setDevisList(
  devisRes.data
    .map(d => ({
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
    // 🔥 TRI PAR DATE DE CRÉATION (DESC)
    .sort(
      (a, b) =>
        (b.dateCreation?.getTime() ?? 0) -
        (a.dateCreation?.getTime() ?? 0)
    )
);


        setLoading(false);
      } catch (err) {
        console.error(err);
        toast({ title: 'Erreur', description: 'Impossible de charger les devis', variant: 'destructive' });
        setLoading(false);
      }
    };

    fetchDevis();
  }, []);

  // Fonction pour supprimer un devis
  const handleDeleteDevis = async (devis: Devis & { client: Client }) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce devis ?')) {
      return;
    }

    try {
      console.log(`🗑️ Suppression du devis ${devis.id} pour le client ${devis.clientId}`);
      
      await api.delete(`/api/clients/${devis.clientId}/devis/${devis.id}`);
      
      // Mettre à jour la liste locale
      setDevisList(prev => prev.filter(d => d.id !== devis.id));
      
      console.log('✅ Devis supprimé avec succès');
      toast({
        title: 'Devis supprimé',
        description: 'Le devis a été supprimé avec succès.',
        variant: 'destructive',
      });
    } catch (err: any) {
      console.error('❌ Erreur lors de la suppression:', err);
      console.error('Réponse serveur:', err.response?.data);
      toast({
        title: 'Erreur',
        description: err.response?.data?.message || 'Erreur lors de la suppression du devis',
        variant: 'destructive',
      });
    }
  };

  // Ajoute info client à chaque devis
  const devisWithClient = devisList.map(d => ({
    ...d,
    client: clientsMap[d.clientId],
  }));

  const filteredDevis = devisWithClient.filter(
    (devis) =>
      devis.numero.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (devis.client?.nom_societe || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const columns = [
    {
      key: 'numero',
      header: 'N° Devis',
      render: (item: Devis & { client: Client }) => (
        <span className="font-mono font-medium text-foreground">{item.numero}</span>
      ),
    },
    {
      key: 'client',
      header: 'Client',
      render: (item: Devis & { client: Client }) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/clients/${item.clientId}`);
          }}
          className="text-primary hover:underline font-medium"
        >
          {item.client?.nom_societe || '—'}
        </button>
      ),
    },
    {
      key: 'totalTTC',
      header: 'Montant',
      render: (item: Devis) => <span className="font-semibold">{formatCurrency(item.totalTTC)}</span>,
    },
    {
      key: 'dateCreation',
      header: 'Création',
      render: (item: Devis) =>
        item.dateCreation ? format(item.dateCreation, 'dd MMM yyyy', { locale: fr }) : '-',
    },
    {
      key: 'dateEvenement',
      header: 'Événement',
      render: (item: Devis) => {
        if (!item.dateEvenement) return '-';
        const isPast = !item.estFacture && isBefore(item.dateEvenement, today);
        return (
          <span className={isPast ? 'text-destructive font-medium' : ''}>
            {format(item.dateEvenement, 'dd MMM yyyy', { locale: fr })}
          </span>
        );
      },
    },
    {
      key: 'status',
      header: 'Statut',
      render: (item: Devis) => {
        if (!item.dateEvenement) return <StatusBadge variant="pending" />;
        const isPast = isBefore(item.dateEvenement, today);
        if (item.estFacture) return <StatusBadge variant="invoiced" />;
        if (isPast) return <StatusBadge variant="toInvoice" />;
        return <StatusBadge variant="pending" />;
      },
    },
    {
      key: 'actions',
      header: '',
      className: 'w-12',
      render: (item: Devis & { client: Client }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" onClick={(e) => e.stopPropagation()}>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/clients/${item.clientId}/devis/${item.id}`);
              }}
            >
              <Eye className="h-4 w-4 mr-2" />
              Voir
            </DropdownMenuItem>

            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/clients/${item.clientId}/devis/${item.id}/edit`);
              }}
            >
              <Edit className="h-4 w-4 mr-2" />
              Modifier
            </DropdownMenuItem>

            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteDevis(item);
              }}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Supprimer
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  if (loading)
    return <p className="text-center mt-10">Chargement des devis...</p>;

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Devis"
        description="Gérez tous vos devis clients"
        actions={
          <Button onClick={() => navigate('/devis/nouveau')}>
            <Plus className="h-4 w-4 mr-2" />
            Nouveau devis
          </Button>
        }
      />

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher par numéro ou client..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <DataTable
        data={filteredDevis}
        columns={columns}
        onRowClick={(item) => navigate(`/clients/${item.clientId}/devis/${item.id}`)}
        emptyMessage="Aucun devis trouvé"
      />
    </div>
  );
};

export default DevisPage;