import React, { useState } from 'react';
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
import { mockDevis, getClientById } from '@/data/mockData';
import { format, isBefore } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Devis, Client } from '@/types';
import { useToast } from '@/hooks/use-toast';

const DevisPage: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [devisList, setDevisList] = useState(mockDevis);
  const today = new Date();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-MA', {
      style: 'currency',
      currency: 'MAD',
    }).format(amount);
  };

  const devisWithClient = devisList.map((d) => ({
    ...d,
    client: getClientById(d.clientId)!,
  }));

  const filteredDevis = devisWithClient.filter(
    (devis) =>
      devis.numero.toLowerCase().includes(searchQuery.toLowerCase()) ||
      devis.client.societe.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDelete = (devis: Devis) => {
    setDevisList((prev) => prev.filter((d) => d.id !== devis.id));
    toast({
      title: 'Devis supprimé',
      description: `Le devis ${devis.numero} a été supprimé.`,
      variant: 'destructive',
    });
  };

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
          {item.client.societe}
        </button>
      ),
    },
    {
      key: 'totalTTC',
      header: 'Montant',
      render: (item: Devis) => (
        <span className="font-semibold">{formatCurrency(item.totalTTC)}</span>
      ),
    },
    {
      key: 'dateCreation',
      header: 'Création',
      render: (item: Devis) => format(item.dateCreation, 'dd MMM yyyy', { locale: fr }),
    },
    {
      key: 'dateEvenement',
      header: 'Événement',
      render: (item: Devis) => {
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
            <DropdownMenuItem onClick={() => navigate(`/devis/${item.id}`)}>
              <Eye className="h-4 w-4 mr-2" />
              Voir
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate(`/devis/${item.id}/edit`)}>
              <Edit className="h-4 w-4 mr-2" />
              Modifier
            </DropdownMenuItem>
            {!item.estFacture && (
              <DropdownMenuItem onClick={() => navigate(`/devis/${item.id}/facturer`)}>
                <Receipt className="h-4 w-4 mr-2" />
                Créer facture
              </DropdownMenuItem>
            )}
            <DropdownMenuItem
              onClick={() => handleDelete(item)}
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

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Devis"
        description="Gérez vos devis clients"
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
        onRowClick={(item) => navigate(`/devis/${item.id}`)}
        emptyMessage="Aucun devis trouvé"
      />
    </div>
  );
};

export default DevisPage;
