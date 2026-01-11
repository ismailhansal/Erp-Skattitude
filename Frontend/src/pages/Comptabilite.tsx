import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Receipt, 
  FileText, 
  TrendingUp,
  Users,
  Download,
  ChevronRight 
} from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { StatCard } from '@/components/ui/stat-card';
import { DataTable } from '@/components/ui/data-table';
import { StatusBadge } from '@/components/ui/status-badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { mockFactures, mockDevis, mockClients, getClientById } from '@/data/mockData';
import { format, isBefore } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Facture, Devis, Client } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { exportFacturesToCSV, exportDevisToCSV, exportClientsToCSV, generatePrintableTable, quickPDFExport } from '@/lib/exportUtils';

const Comptabilite: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const today = new Date();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-MA', {
      style: 'currency',
      currency: 'MAD',
    }).format(amount);
  };

  // Calculate statistics
  const totalCA = mockFactures
    .filter((f) => f.estPayee)
    .reduce((acc, f) => acc + f.totalTTC, 0);

  const totalImpaye = mockFactures
    .filter((f) => !f.estPayee)
    .reduce((acc, f) => acc + f.totalTTC, 0);

  const totalDevisPotentiel = mockDevis
    .filter((d) => !d.estFacture)
    .reduce((acc, d) => acc + d.totalTTC, 0);

  // Client analysis
  const clientStats = mockClients.map((client) => {
    const clientFactures = mockFactures.filter((f) => f.clientId === client.id);
    const clientDevis = mockDevis.filter((d) => d.clientId === client.id);
    return {
      ...client,
      chiffreAffaires: clientFactures
        .filter((f) => f.estPayee)
        .reduce((acc, f) => acc + f.totalTTC, 0),
      facturesEnRetard: clientFactures.filter(
        (f) => !f.estPayee && isBefore(f.dateEcheance, today)
      ).length,
      devisAFacturer: clientDevis.filter((d) => !d.estFacture).length,
      potentiel: clientDevis
        .filter((d) => !d.estFacture)
        .reduce((acc, d) => acc + d.totalTTC, 0),
    };
  });

  const handleExportCSV = (type: 'factures' | 'devis' | 'clients') => {
    if (type === 'factures') {
      exportFacturesToCSV(mockFactures, getClientById);
    } else if (type === 'devis') {
      exportDevisToCSV(mockDevis, getClientById);
    } else {
      exportClientsToCSV(mockClients);
    }
    toast({
      title: 'Export CSV réussi',
      description: `Le fichier ${type} a été téléchargé.`,
    });
  };

  const handleExportPDF = (type: 'factures' | 'devis') => {
    const data = type === 'factures' 
      ? mockFactures.map(f => ({
          numero: f.numero,
          client: getClientById(f.clientId)?.societe || '',
          montant: formatCurrency(f.totalTTC),
          echeance: format(f.dateEcheance, 'dd/MM/yyyy'),
          statut: f.estPayee ? 'Payée' : 'Impayée'
        }))
      : mockDevis.map(d => ({
          numero: d.numero,
          client: getClientById(d.clientId)?.societe || '',
          montant: formatCurrency(d.totalTTC),
          evenement: format(d.dateEvenement, 'dd/MM/yyyy'),
          statut: d.estFacture ? 'Facturé' : 'En attente'
        }));

    const columns = type === 'factures'
      ? [
          { key: 'numero', header: 'N° Facture' },
          { key: 'client', header: 'Client' },
          { key: 'montant', header: 'Montant' },
          { key: 'echeance', header: 'Échéance' },
          { key: 'statut', header: 'Statut' }
        ]
      : [
          { key: 'numero', header: 'N° Devis' },
          { key: 'client', header: 'Client' },
          { key: 'montant', header: 'Montant' },
          { key: 'evenement', header: 'Événement' },
          { key: 'statut', header: 'Statut' }
        ];

    const tableHTML = generatePrintableTable(data as Record<string, unknown>[], columns);
    quickPDFExport(type === 'factures' ? 'Liste des factures' : 'Liste des devis', tableHTML);
  };

  const facturesWithClient = mockFactures.map((f) => ({
    ...f,
    client: getClientById(f.clientId)!,
  }));

  const devisWithClient = mockDevis.map((d) => ({
    ...d,
    client: getClientById(d.clientId)!,
  }));

  const facturesColumns = [
    {
      key: 'numero',
      header: 'N° Facture',
      render: (item: Facture & { client: Client }) => (
        <span className="font-mono font-medium">{item.numero}</span>
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
          {item.client.societe}
        </button>
      ),
    },
    {
      key: 'totalTTC',
      header: 'Montant',
      render: (item: Facture) => formatCurrency(item.totalTTC),
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

  const devisColumns = [
    {
      key: 'numero',
      header: 'N° Devis',
      render: (item: Devis & { client: Client }) => (
        <span className="font-mono font-medium">{item.numero}</span>
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
      render: (item: Devis) => formatCurrency(item.totalTTC),
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

  const clientColumns = [
    {
      key: 'societe',
      header: 'Client',
      render: (item: typeof clientStats[0]) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/clients/${item.id}`);
          }}
          className="text-primary hover:underline font-semibold"
        >
          {item.societe}
        </button>
      ),
    },
    {
      key: 'chiffreAffaires',
      header: 'CA Réalisé',
      render: (item: typeof clientStats[0]) => (
        <span className="font-semibold">{formatCurrency(item.chiffreAffaires)}</span>
      ),
    },
    {
      key: 'potentiel',
      header: 'CA Potentiel',
      render: (item: typeof clientStats[0]) => formatCurrency(item.potentiel),
    },
    {
      key: 'facturesEnRetard',
      header: 'Factures en retard',
      render: (item: typeof clientStats[0]) => (
        <span className={item.facturesEnRetard > 0 ? 'text-destructive font-medium' : ''}>
          {item.facturesEnRetard}
        </span>
      ),
    },
    {
      key: 'devisAFacturer',
      header: 'Devis à facturer',
      render: (item: typeof clientStats[0]) => (
        <span className={item.devisAFacturer > 0 ? 'text-primary font-medium' : ''}>
          {item.devisAFacturer}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      <PageHeader
        title="Comptabilité"
        description="Analyse détaillée de votre activité financière"
        actions={
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" onClick={() => handleExportCSV('factures')}>
              <Download className="h-4 w-4 mr-2" />
              Factures CSV
            </Button>
            <Button variant="outline" onClick={() => handleExportCSV('devis')}>
              <Download className="h-4 w-4 mr-2" />
              Devis CSV
            </Button>
            <Button variant="outline" onClick={() => handleExportPDF('factures')}>
              <Download className="h-4 w-4 mr-2" />
              PDF
            </Button>
          </div>
        }
      />

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Chiffre d'affaires"
          value={formatCurrency(totalCA)}
          icon={TrendingUp}
          variant="primary"
        />
        <StatCard
          title="Montant impayé"
          value={formatCurrency(totalImpaye)}
          icon={Receipt}
          variant="destructive"
        />
        <StatCard
          title="CA potentiel (devis)"
          value={formatCurrency(totalDevisPotentiel)}
          icon={FileText}
          variant="warning"
        />
        <StatCard
          title="Clients actifs"
          value={mockClients.length}
          icon={Users}
        />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="factures" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 max-w-md">
          <TabsTrigger value="factures">Factures</TabsTrigger>
          <TabsTrigger value="devis">Devis</TabsTrigger>
          <TabsTrigger value="clients">Par client</TabsTrigger>
        </TabsList>

        <TabsContent value="factures">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Toutes les factures</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => navigate('/factures')}>
                Voir plus
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </CardHeader>
            <CardContent>
              <DataTable
                data={facturesWithClient}
                columns={facturesColumns}
                onRowClick={(item) => navigate(`/factures/${item.id}`)}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="devis">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Tous les devis</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => navigate('/devis')}>
                Voir plus
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </CardHeader>
            <CardContent>
              <DataTable
                data={devisWithClient}
                columns={devisColumns}
                onRowClick={(item) => navigate(`/devis/${item.id}`)}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="clients">
          <Card>
            <CardHeader>
              <CardTitle>Analyse par client</CardTitle>
            </CardHeader>
            <CardContent>
              <DataTable
                data={clientStats}
                columns={clientColumns}
                onRowClick={(item) => navigate(`/clients/${item.id}`)}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Comptabilite;
