import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Building2, MapPin, Phone, Mail, FileText, Receipt, Plus, ExternalLink, Loader2 
} from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { StatusBadge } from '@/components/ui/status-badge';
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

const ClientDetail: React.FC = () => {
  const { clientId } = useParams<{ clientId: string }>();
  const navigate = useNavigate();
  const today = new Date();

  // ✅ Utiliser le hook React Query
  const { client, devis, factures, isLoading, deleteDevis, deleteFacture } = useClientDetail(clientId!);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('fr-MA', { style: 'currency', currency: 'MAD' }).format(amount);

  // Fonction pour supprimer un devis
  const handleDeleteDevis = async (devisId: string) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce devis ?')) {
      return;
    }
    deleteDevis(devisId);
  };

  // Fonction pour supprimer une facture
  const handleDeleteFacture = async (factureId: string) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette facture ?')) {
      return;
    }
    deleteFacture(factureId);
  };

  // Colonnes Devis
  const devisColumns = [
    { 
      key: 'numero_devis', 
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
      key: 'statut', 
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

  // Colonnes Factures
  const facturesColumns = [
    { 
      key: 'numero', 
      header: 'N° Facture', 
      render: (item: Facture) => <span className="font-mono font-medium">{item.numero}</span> 
    },
    { 
      key: 'description', 
      header: 'Description', 
      render: (item: Facture) => (
        <span className="font-medium text-sm max-w-xs truncate block" title={item.description}>
          {item.description}
        </span>
      )
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

  // ✅ Afficher un loader pendant le chargement
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="text-sm text-muted-foreground">Chargement des données client...</p>
        </div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-muted-foreground">Client non trouvé</p>
      </div>
    );
  }

  const totalCA = factures
    .filter(f => f.estPayee)
    .reduce((acc, f) => acc + f.totalTTC, 0);

  return (
    <div className="space-y-8 animate-fade-in">
      <PageHeader
        title={client.nom_societe}
        description="Détails du client"
        showBack
        backPath="/clients"
        actions={
          <Button variant="outline" onClick={() => navigate(`/clients/${clientId}/vente`)}>
            <Plus className="h-4 w-4 mr-2" />
            Créer une vente
          </Button>
        }
      />

      {/* Info client */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              Informations
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Société</p>
                <p className="font-medium">{client.nom_societe}</p>
              </div>
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground mt-1" />
                <div>
                  <p className="font-medium">{client.adresse}</p>
                  <p className="text-muted-foreground">{client.ville}, {client.pays}</p>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>{client.telephone}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span>{client.email}</span>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">ICE</p>
                <p className="font-mono">{client.ice}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Résumé */}
        <Card>
          <CardHeader>
            <CardTitle>Résumé</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-primary/5 rounded-lg">
              <span className="text-sm text-muted-foreground">Chiffre d'affaires</span>
              <span className="font-bold text-lg">{formatCurrency(totalCA)}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
              <span className="text-sm text-muted-foreground">Devis</span>
              <span className="font-semibold">{devis.length}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
              <span className="text-sm text-muted-foreground">Factures</span>
              <span className="font-semibold">{factures.length}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Devis */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Devis ({devis.length})
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={() => navigate('/devis')}>
            <ExternalLink className="h-4 w-4 mr-1" />
            Voir tous
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

      {/* Factures */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5 text-primary" />
            Factures ({factures.length})
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={() => navigate('/factures')}>
            <ExternalLink className="h-4 w-4 mr-1" />
            Voir toutes
          </Button>
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
    </div>
  );
};

export default ClientDetail;