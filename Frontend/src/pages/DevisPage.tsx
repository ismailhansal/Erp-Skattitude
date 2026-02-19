import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, MoreHorizontal, Eye, Edit, Trash2, Loader2 } from 'lucide-react';
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
import { format, isBefore } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Devis, Client } from '@/types';
import { useDevis } from '@/hooks/useDevis';

const DevisPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const today = new Date();

  // ✅ Hook React Query
  const { devisList, clientsMap, isLoading, deleteDevis } = useDevis();

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('fr-MA', { style: 'currency', currency: 'MAD' }).format(amount);

  const handleDeleteDevis = async (devis: Devis & { client: Client }) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce devis ?')) {
      return;
    }
    deleteDevis({ clientId: devis.clientId, devisId: devis.id });
  };

  // Ajoute info client à chaque devis
  const devisWithClient = devisList.map((d: any) => ({
    ...d,
    client: clientsMap[d.clientId],
  }));

  const filteredDevis = devisWithClient.filter(
    (devis: any) =>
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="text-sm text-muted-foreground">Chargement des devis...</p>
        </div>
      </div>
    );
  }

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