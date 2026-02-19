import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FileText, Receipt, Plus, ArrowLeft, Loader2 } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { StatusBadge } from '@/components/ui/status-badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Devis, Facture } from '@/types';
import { format, isBefore } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Eye, Edit, Trash2 } from 'lucide-react';
import { useClientDetail } from '@/hooks/useClientDetail';

const ClientVente: React.FC = () => {
  const { clientId } = useParams<{ clientId: string }>();
  const navigate = useNavigate();
  const today = new Date();

  // ✅ Hook React Query - Réutilisation du même hook que ClientDetail
  const { client, devis, factures, isLoading, deleteDevis, deleteFacture } = useClientDetail(clientId!);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('fr-MA', { style: 'currency', currency: 'MAD' }).format(amount);

  const handleDeleteDevis = async (devisId: string) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce devis ?')) {
      return;
    }
    deleteDevis(devisId);
  };

  const handleDeleteFacture = async (factureId: string) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette facture ?')) {
      return;
    }
    deleteFacture(factureId);
  };

  const devisColumns = [
    { 
      key: 'numero', 
      header: 'N° Devis', 
      render: (item: Devis) => <span className="font-mono font-medium">{item.numero}</span> 
    },
    { 
      key: 'totalttc', 
      header: 'Montant', 
      render: (item: Devis) => formatCurrency(item.totalTTC) 
    },
    { 
      key: 'dateCreation', 
      header: 'Création', 
      render: (item: Devis) => item.dateCreation ? format(item.dateCreation, 'dd MMM yyyy', { locale: fr }) : '-'
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
      } 
    },
    { 
      key: 'status', 
      header: 'Statut', 
      render: (item: Devis) => {
        if (!item.dateEvenement) return <StatusBadge variant="pending" />;
        const isPast = !item.estFacture && isBefore(item.dateEvenement, today);
        if (item.estFacture) return <StatusBadge variant="invoiced" />;
        if (isPast) return <StatusBadge variant="toInvoice" />;
        return <StatusBadge variant="pending" />;
      } 
    },
    {
      key: 'actions',
      header: '',
      className: 'w-12',
      render: (item: Devis) => (
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
                navigate(`/clients/${clientId}/devis/${item.id}`);
              }}
            >
              <Eye className="h-4 w-4 mr-2" />
              Voir
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/clients/${clientId}/devis/${item.id}/edit`);
              }}
            >
              <Edit className="h-4 w-4 mr-2" />
              Modifier
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteDevis(item.id);
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

  const facturesColumns = [
    { 
      key: 'numero', 
      header: 'N° Facture', 
      render: (item: Facture) => <span className="font-mono font-medium">{item.numero}</span> 
    },
    { 
      key: 'totalttc', 
      header: 'Montant', 
      render: (item: Facture) => formatCurrency(item.totalTTC) 
    },
    { 
      key: 'dateFacturation', 
      header: 'Date', 
      render: (item: Facture) => item.dateFacturation ? format(item.dateFacturation, 'dd MMM yyyy', { locale: fr }) : '-'
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
      } 
    },
    { 
      key: 'status', 
      header: 'Statut', 
      render: (item: Facture) => {
        if (!item.dateEcheance) return <StatusBadge variant={item.estPayee ? 'paid' : 'unpaid'} />;
        const isOverdue = !item.estPayee && isBefore(item.dateEcheance, today);
        return <StatusBadge variant={item.estPayee ? 'paid' : isOverdue ? 'overdue' : 'unpaid'} />;
      } 
    },
    {
      key: 'actions',
      header: '',
      className: 'w-12',
      render: (item: Facture) => (
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
                navigate(`/clients/${clientId}/factures/${item.id}`);
              }}
            >
              <Eye className="h-4 w-4 mr-2" />
              Voir
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/clients/${clientId}/factures/${item.id}/edit`);
              }}
            >
              <Edit className="h-4 w-4 mr-2" />
              Modifier
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteFacture(item.id);
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
          <p className="text-sm text-muted-foreground">Chargement des ventes...</p>
        </div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <p className="text-muted-foreground">Client non trouvé</p>
        <Button variant="outline" onClick={() => navigate('/clients')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour aux clients
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title={`Ventes - ${client.nom_societe}`}
        description="Gérez les devis et factures du client"
        showBack
        backPath={`/clients/${clientId}`}
        actions={
          <Button onClick={() => navigate(`/clients/${clientId}/devis/nouveau`)}>
            <Plus className="h-4 w-4 mr-2" />
            Nouveau devis
          </Button>
        }
      />

      <Tabs defaultValue="all" className="space-y-6">
        <TabsList>
          <TabsTrigger value="all">Tout</TabsTrigger>
          <TabsTrigger value="devis">Devis ({devis.length})</TabsTrigger>
          <TabsTrigger value="factures">Factures ({factures.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Devis
              </CardTitle>
              <Button variant="outline" size="sm" onClick={() => navigate(`/clients/${clientId}/devis/nouveau`)}>
                <Plus className="h-4 w-4 mr-2" />
                Nouveau
              </Button>
            </CardHeader>
            <CardContent>
              <DataTable
                data={devis}
                columns={devisColumns}
                onRowClick={(item) => navigate(`/clients/${clientId}/devis/${item.id}`)}
                emptyMessage="Aucun devis"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Receipt className="h-5 w-5 text-primary" />
                Factures
              </CardTitle>
            </CardHeader>
            <CardContent>
              <DataTable
                data={factures}
                columns={facturesColumns}
                onRowClick={(item) => navigate(`/clients/${clientId}/factures/${item.id}`)}
                emptyMessage="Aucune facture"
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="devis">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Devis ({devis.length})
              </CardTitle>
              <Button variant="outline" size="sm" onClick={() => navigate(`/clients/${clientId}/devis/nouveau`)}>
                <Plus className="h-4 w-4 mr-2" />
                Nouveau devis
              </Button>
            </CardHeader>
            <CardContent>
              <DataTable
                data={devis}
                columns={devisColumns}
                onRowClick={(item) => navigate(`/clients/${clientId}/devis/${item.id}`)}
                emptyMessage="Aucun devis pour ce client"
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="factures">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Receipt className="h-5 w-5 text-primary" />
                Factures ({factures.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <DataTable
                data={factures}
                columns={facturesColumns}
                onRowClick={(item) => navigate(`/clients/${clientId}/factures/${item.id}`)}
                emptyMessage="Aucune facture pour ce client"
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ClientVente;