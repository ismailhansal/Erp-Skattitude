import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MoreHorizontal, Eye, Edit, Trash2, Send, Printer, Loader2 } from 'lucide-react';
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
import { Facture, Client } from '@/types';
import { useFactures } from '@/hooks/useFactures';
import { useToast } from '@/hooks/use-toast';

const FacturesPage: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const today = new Date();

  // ✅ Hook React Query
  const { facturesList, clientsMap, isLoading, deleteFacture } = useFactures();

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('fr-MA', { style: 'currency', currency: 'MAD' }).format(amount);

  const handleDeleteFacture = async (facture: Facture & { client: Client }) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette facture ?')) {
      return;
    }
    deleteFacture({ clientId: facture.clientId, factureId: facture.id });
  };

  const handleRelancer = async (facture: Facture & { client: Client }) => {
    toast({
      title: 'Relance envoyée',
      description: `Une relance a été envoyée à ${facture.client.email || facture.client.nom_societe}`,
    });
  };

  const handlePrintPDF = async (facture: Facture & { client: Client }) => {
    window.open(`http://127.0.0.1:8000/api/factures/${facture.id}/pdf`, '_blank');
    toast({
      title: 'PDF généré',
      description: 'Le PDF de la facture a été ouvert dans un nouvel onglet.',
    });
  };

  // Ajoute info client à chaque facture
  const facturesWithClient = facturesList.map((f: any) => ({
    ...f,
    client: clientsMap[f.clientId],
  }));

  const filteredFactures = facturesWithClient.filter(
    (facture: any) =>
      facture.numero.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (facture.client?.nom_societe || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const columns = [
    {
      key: 'numero',
      header: 'N° Facture',
      render: (item: Facture & { client: Client }) => (
        <span className="font-mono font-medium text-foreground">{item.numero}</span>
      ),
    },
    {
      key: 'client',
      header: 'Client',
      render: (item: Facture & { client: Client }) => (
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
      render: (item: Facture) => (
        <span className="font-semibold">{formatCurrency(item.totalTTC)}</span>
      ),
    },
    {
      key: 'dateFacturation',
      header: 'Date',
      render: (item: Facture) =>
        item.dateFacturation ? format(item.dateFacturation, 'dd MMM yyyy', { locale: fr }) : '-',
    },
    {
      key: 'dateEcheance',
      header: 'Échéance',
      render: (item: Facture) => {
        if (!item.dateEcheance) return '-';
        const isOverdue = !item.estPayee && isBefore(item.dateEcheance, today);
        return (
          <span className={isOverdue ? 'text-destructive font-medium' : ''}>
            {format(item.dateEcheance, 'dd MMM yyyy', { locale: fr })}
          </span>
        );
      },
    },
    {
      key: 'status',
      header: 'Statut',
      render: (item: Facture) => {
        if (!item.dateEcheance) return <StatusBadge variant="unpaid" />;
        const isOverdue = !item.estPayee && isBefore(item.dateEcheance, today);
        return <StatusBadge variant={item.estPayee ? 'paid' : isOverdue ? 'overdue' : 'unpaid'} />;
      },
    },
    {
      key: 'actions',
      header: '',
      className: 'w-12',
      render: (item: Facture & { client: Client }) => (
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
                navigate(`/clients/${item.clientId}/factures/${item.id}`);
              }}
            >
              <Eye className="h-4 w-4 mr-2" />
              Voir
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/clients/${item.clientId}/factures/${item.id}/edit`);
              }}
            >
              <Edit className="h-4 w-4 mr-2" />
              Modifier
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                handlePrintPDF(item);
              }}
            >
              <Printer className="h-4 w-4 mr-2" />
              Imprimer PDF
            </DropdownMenuItem>
            {!item.estPayee && (
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  handleRelancer(item);
                }}
              >
                <Send className="h-4 w-4 mr-2" />
                Relancer
              </DropdownMenuItem>
            )}
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteFacture(item);
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
          <p className="text-sm text-muted-foreground">Chargement des factures...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader 
        title="Factures" 
        description="Gérez toutes les factures clients" 
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
        data={filteredFactures}
        columns={columns}
        onRowClick={(item) => navigate(`/clients/${item.clientId}/factures/${item.id}`)}
        emptyMessage="Aucune facture trouvée"
      />
    </div>
  );
};

export default FacturesPage;