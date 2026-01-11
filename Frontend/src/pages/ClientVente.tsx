import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FileText, Receipt, Plus, ArrowLeft } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { StatusBadge } from '@/components/ui/status-badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { mockClients, mockDevis, mockFactures } from '@/data/mockData';
import { format, isBefore } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Devis, Facture } from '@/types';

const ClientVente: React.FC = () => {
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
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <p className="text-muted-foreground">Client non trouvé</p>
        <Button variant="outline" onClick={() => navigate('/clients')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour aux clients
        </Button>
      </div>
    );
  }

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
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title={`Ventes - ${client.societe}`}
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
          <TabsTrigger value="devis">Devis ({clientDevis.length})</TabsTrigger>
          <TabsTrigger value="factures">Factures ({clientFactures.length})</TabsTrigger>
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
                data={clientDevis}
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
                data={clientFactures}
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
                Devis ({clientDevis.length})
              </CardTitle>
              <Button variant="outline" size="sm" onClick={() => navigate(`/clients/${clientId}/devis/nouveau`)}>
                <Plus className="h-4 w-4 mr-2" />
                Nouveau devis
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
        </TabsContent>

        <TabsContent value="factures">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Receipt className="h-5 w-5 text-primary" />
                Factures ({clientFactures.length})
              </CardTitle>
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
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ClientVente;
