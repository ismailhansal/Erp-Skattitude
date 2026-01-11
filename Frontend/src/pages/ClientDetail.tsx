import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Building2, 
  MapPin, 
  Phone, 
  Mail, 
  FileText, 
  Receipt,
  Plus,
  ExternalLink 
} from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { StatusBadge } from '@/components/ui/status-badge';
import { mockClients, mockDevis, mockFactures, getClientById } from '@/data/mockData';
import { format, isBefore } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Devis, Facture, Client } from '@/types';

const ClientDetail: React.FC = () => {
  const { clientId } = useParams<{ clientId: string }>();
  const navigate = useNavigate();
  const today = new Date();

  const client = mockClients.find((c) => c.id === clientId);
  const clientDevis = mockDevis.filter((d) => d.clientId === clientId);
  const clientFactures = mockFactures.filter((f) => f.clientId === clientId);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-MA', {
      style: 'currency',
      currency: 'MAD',
    }).format(amount);
  };

  if (!client) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-muted-foreground">Client non trouvé</p>
      </div>
    );
  }

  const totalCA = clientFactures
    .filter((f) => f.estPayee)
    .reduce((acc, f) => acc + f.totalTTC, 0);

  const devisColumns = [
    {
      key: 'numero',
      header: 'N° Devis',
      render: (item: Devis) => (
        <span className="font-mono font-medium">{item.numero}</span>
      ),
    },
    {
      key: 'totalTTC',
      header: 'Montant',
      render: (item: Devis) => formatCurrency(item.totalTTC),
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
  ];

  const facturesColumns = [
    {
      key: 'numero',
      header: 'N° Facture',
      render: (item: Facture) => (
        <span className="font-mono font-medium">{item.numero}</span>
      ),
    },
    {
      key: 'totalTTC',
      header: 'Montant',
      render: (item: Facture) => formatCurrency(item.totalTTC),
    },
    {
      key: 'dateFacturation',
      header: 'Date',
      render: (item: Facture) => format(item.dateFacturation, 'dd MMM yyyy', { locale: fr }),
    },
    {
      key: 'dateEcheance',
      header: 'Échéance',
      render: (item: Facture) => {
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
        const isOverdue = !item.estPayee && isBefore(item.dateEcheance, today);
        return <StatusBadge variant={item.estPayee ? 'paid' : isOverdue ? 'overdue' : 'unpaid'} />;
      },
    },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      <PageHeader
        title={client.societe}
        description="Détails du client"
        showBack
        backPath="/clients"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate(`/clients/${clientId}/vente`)}>
              <Plus className="h-4 w-4 mr-2" />
              Créer une vente
            </Button>
          </div>
        }
      />

      {/* Client Info */}
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
                <p className="font-medium">{client.societe}</p>
              </div>
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground mt-1" />
                <div>
                  <p className="font-medium">{client.adresse}</p>
                  <p className="text-muted-foreground">
                    {client.codePostal} {client.ville}, {client.pays}
                  </p>
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
              <span className="font-semibold">{clientDevis.length}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
              <span className="text-sm text-muted-foreground">Factures</span>
              <span className="font-semibold">{clientFactures.length}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Devis */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Devis ({clientDevis.length})
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={() => navigate('/devis')}>
            <ExternalLink className="h-4 w-4 mr-1" />
            Voir tous
          </Button>
        </CardHeader>
        <CardContent>
          <DataTable
            data={clientDevis}
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
            Factures ({clientFactures.length})
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={() => navigate('/factures')}>
            <ExternalLink className="h-4 w-4 mr-1" />
            Voir toutes
          </Button>
        </CardHeader>
        <CardContent>
          <DataTable
            data={clientFactures}
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
