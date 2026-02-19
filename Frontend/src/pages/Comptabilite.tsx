import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Receipt, 
  FileText, 
  TrendingUp,
  Users,
  Download,
  ChevronRight,
  Loader2
} from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { StatCard } from '@/components/ui/stat-card';
import { DataTable } from '@/components/ui/data-table';
import { StatusBadge } from '@/components/ui/status-badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format, isBefore } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { exportFacturesToCSV, exportDevisToCSV, exportClientsToCSV, generatePrintableTable, quickPDFExport } from '@/lib/exportUtils';
import { useComptabilite } from '@/hooks/useComptabilite';

interface ClientStats {
  id: number;
  nom_societe: string;
  adresse?: string;
  ville?: string;
  telephone?: string;
  email?: string;
  chiffreAffaires: number;
  facturesEnRetard: number;
  devisAFacturer: number;
  potentiel: number;
}

const Comptabilite: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const today = new Date();

  // ✅ Hook React Query
  const { factures, devis, clients, isLoading, getClient } = useComptabilite();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-MA', {
      style: 'currency',
      currency: 'MAD',
    }).format(amount);
  };

  // Calculate statistics
  const totalCA = factures
    .filter((f: any) => f.statut === 'payé')
    .reduce((acc: number, f: any) => acc + Number(f.total_ttc), 0);

  const totalImpaye = factures
    .filter((f: any) => f.statut !== 'payé')
    .reduce((acc: number, f: any) => acc + Number(f.total_ttc), 0);

  const totalDevisPotentiel = devis
    .filter((d: any) => d.statut !== 'facturé')
    .reduce((acc: number, d: any) => acc + Number(d.total_ttc), 0);

  // Client analysis
  const clientStats: ClientStats[] = clients.map((client: any) => {
    const clientFactures = factures.filter((f: any) => f.client_id === client.id);
    const clientDevis = devis.filter((d: any) => d.client_id === client.id);
    
    return {
      ...client,
      chiffreAffaires: clientFactures
        .filter((f: any) => f.statut === 'payé')
        .reduce((acc: number, f: any) => acc + Number(f.total_ttc), 0),
      facturesEnRetard: clientFactures.filter(
        (f: any) => f.statut !== 'payé' && isBefore(new Date(f.date_echeance), today)
      ).length,
      devisAFacturer: clientDevis.filter((d: any) => d.statut !== 'facturé').length,
      potentiel: clientDevis
        .filter((d: any) => d.statut !== 'facturé')
        .reduce((acc: number, d: any) => acc + Number(d.total_ttc), 0),
    };
  }).sort((a, b) => b.chiffreAffaires - a.chiffreAffaires);

  const handleExportCSV = (type: 'factures' | 'devis' | 'clients') => {
    try {
      if (type === 'factures') {
        const facturesForExport = factures.map((f: any) => ({
          ...f,
          client: getClient(f.client_id)
        }));
        exportFacturesToCSV(facturesForExport as any, getClient as any);
      } else if (type === 'devis') {
        const devisForExport = devis.map((d: any) => ({
          ...d,
          client: getClient(d.client_id)
        }));
        exportDevisToCSV(devisForExport as any, getClient as any);
      } else {
        exportClientsToCSV(clients as any);
      }
      
      toast({
        title: 'Export CSV réussi',
        description: `Le fichier ${type} a été téléchargé.`,
      });
    } catch (error) {
      console.error('Erreur export CSV:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible d\'exporter les données',
        variant: 'destructive',
      });
    }
  };

  const handleExportPDF = (type: 'factures' | 'devis') => {
    try {
      const data = type === 'factures' 
        ? factures.map((f: any) => ({
            numero: f.numero_facture,
            client: getClient(f.client_id).nom_societe,
            montant: formatCurrency(Number(f.total_ttc)),
            echeance: format(new Date(f.date_echeance), 'dd/MM/yyyy'),
            statut: f.statut === 'payé' ? 'Payée' : 'Impayée'
          }))
        : devis.map((d: any) => ({
            numero: d.numero_devis,
            client: getClient(d.client_id).nom_societe,
            montant: formatCurrency(Number(d.total_ttc)),
            evenement: d.date_evenement ? format(new Date(d.date_evenement), 'dd/MM/yyyy') : '-',
            statut: d.statut === 'facturé' ? 'Facturé' : 'En attente'
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
      
      toast({
        title: 'Export PDF réussi',
        description: `Le fichier a été généré.`,
      });
    } catch (error) {
      console.error('Erreur export PDF:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible d\'exporter en PDF',
        variant: 'destructive',
      });
    }
  };

  // Colonnes Factures
  const facturesColumns = [
    {
      key: 'numero',
      header: 'N° Facture',
      render: (item: any) => (
        <span className="font-mono font-medium">{item.numero_facture}</span>
      ),
    },
    {
      key: 'client',
      header: 'Client',
      render: (item: any) => {
        const client = getClient(item.client_id);
        return (
          <button
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/clients/${item.client_id}`);
            }}
            className="text-primary hover:underline font-medium"
          >
            {client.nom_societe}
          </button>
        );
      },
    },
    {
      key: 'totalTTC',
      header: 'Montant',
      render: (item: any) => formatCurrency(Number(item.total_ttc)),
    },
    {
      key: 'dateEcheance',
      header: 'Échéance',
      render: (item: any) => {
        const dateEcheance = new Date(item.date_echeance);
        const isOverdue = item.statut !== 'payé' && isBefore(dateEcheance, today);
        return (
          <span className={isOverdue ? 'text-destructive font-medium' : ''}>
            {format(dateEcheance, 'dd MMM yyyy', { locale: fr })}
          </span>
        );
      },
    },
    {
      key: 'status',
      header: 'Statut',
      render: (item: any) => {
        const dateEcheance = new Date(item.date_echeance);
        const isOverdue = item.statut !== 'payé' && isBefore(dateEcheance, today);
        return <StatusBadge variant={item.statut === 'payé' ? 'paid' : isOverdue ? 'overdue' : 'unpaid'} />;
      },
    },
  ];

  // Colonnes Devis
  const devisColumns = [
    {
      key: 'numero',
      header: 'N° Devis',
      render: (item: any) => (
        <span className="font-mono font-medium">{item.numero_devis}</span>
      ),
    },
    {
      key: 'client',
      header: 'Client',
      render: (item: any) => {
        const client = getClient(item.client_id);
        return (
          <button
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/clients/${item.client_id}`);
            }}
            className="text-primary hover:underline font-medium"
          >
            {client.nom_societe}
          </button>
        );
      },
    },
    {
      key: 'totalTTC',
      header: 'Montant',
      render: (item: any) => formatCurrency(Number(item.total_ttc)),
    },
    {
      key: 'dateEvenement',
      header: 'Événement',
      render: (item: any) => {
        if (!item.date_evenement) return '-';
        const dateEvenement = new Date(item.date_evenement);
        const isPast = item.statut !== 'facturé' && isBefore(dateEvenement, today);
        return (
          <span className={isPast ? 'text-destructive font-medium' : ''}>
            {format(dateEvenement, 'dd MMM yyyy', { locale: fr })}
          </span>
        );
      },
    },
    {
      key: 'status',
      header: 'Statut',
      render: (item: any) => {
        if (!item.date_evenement) return <StatusBadge variant="pending" />;
        const dateEvenement = new Date(item.date_evenement);
        const isPast = isBefore(dateEvenement, today);
        if (item.statut === 'facturé') return <StatusBadge variant="invoiced" />;
        if (isPast) return <StatusBadge variant="toInvoice" />;
        return <StatusBadge variant="pending" />;
      },
    },
  ];

  // Colonnes Clients
  const clientColumns = [
    {
      key: 'societe',
      header: 'Client',
      render: (item: ClientStats) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/clients/${item.id}`);
          }}
          className="text-primary hover:underline font-semibold"
        >
          {item.nom_societe}
        </button>
      ),
    },
    {
      key: 'chiffreAffaires',
      header: 'CA Réalisé',
      render: (item: ClientStats) => (
        <span className="font-semibold">{formatCurrency(item.chiffreAffaires)}</span>
      ),
    },
    {
      key: 'potentiel',
      header: 'CA Potentiel',
      render: (item: ClientStats) => formatCurrency(item.potentiel),
    },
    {
      key: 'facturesEnRetard',
      header: 'Factures en retard',
      render: (item: ClientStats) => (
        <span className={item.facturesEnRetard > 0 ? 'text-destructive font-medium' : ''}>
          {item.facturesEnRetard}
        </span>
      ),
    },
    {
      key: 'devisAFacturer',
      header: 'Devis à facturer',
      render: (item: ClientStats) => (
        <span className={item.devisAFacturer > 0 ? 'text-primary font-medium' : ''}>
          {item.devisAFacturer}
        </span>
      ),
    },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="text-sm text-muted-foreground">Chargement des données...</p>
        </div>
      </div>
    );
  }

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
          value={clients.length}
          icon={Users}
        />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="factures" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 max-w-md">
          <TabsTrigger value="factures">
            Factures ({factures.length})
          </TabsTrigger>
          <TabsTrigger value="devis">
            Devis ({devis.length})
          </TabsTrigger>
          <TabsTrigger value="clients">
            Par client ({clients.length})
          </TabsTrigger>
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
                data={factures}
                columns={facturesColumns}
                onRowClick={(item: any) => navigate(`/clients/${item.client_id}/factures/${item.id}`)}
                emptyMessage="Aucune facture"
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
                data={devis}
                columns={devisColumns}
                onRowClick={(item: any) => navigate(`/clients/${item.client_id}/devis/${item.id}`)}
                emptyMessage="Aucun devis"
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
                onRowClick={(item: any) => navigate(`/clients/${item.id}`)}
                emptyMessage="Aucun client"
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Comptabilite;