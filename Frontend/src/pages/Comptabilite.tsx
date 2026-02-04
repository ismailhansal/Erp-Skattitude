import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
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

interface Client {
  id: number;
  nom_societe: string;
  adresse?: string;
  ville?: string;
  telephone?: string;
  email?: string;
}

interface Facture {
  id: number;
  client_id: number;
  numero_facture: string;
  date_echeance: string;
  total_ttc: number;
  statut: string;
}

interface Devis {
  id: number;
  client_id: number;
  numero_devis: string;
  date_evenement: string;
  created_at: string;
  total_ttc: number;
  statut: string;
}

interface ClientStats extends Client {
  chiffreAffaires: number;
  facturesEnRetard: number;
  devisAFacturer: number;
  potentiel: number;
}

const Comptabilite: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const today = new Date();

  const [factures, setFactures] = useState<Facture[]>([]);
  const [devis, setDevis] = useState<Devis[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchComptabiliteData();
  }, []);

  const fetchComptabiliteData = async () => {
    try {
      setLoading(true);
      
      console.log('📊 Chargement des données comptabilité...');
      
      // Récupérer les données en parallèle
      const [facturesRes, devisRes, clientsRes] = await Promise.all([
        axios.get('http://127.0.0.1:8000/api/factures'),
        axios.get('http://127.0.0.1:8000/api/devis'),
        axios.get('http://127.0.0.1:8000/api/clients'),
      ]);

      console.log('✅ Données chargées:', {
        factures: facturesRes.data.length,
        devis: devisRes.data.length,
        clients: clientsRes.data.length,
      });

      setFactures(facturesRes.data);
      setDevis(devisRes.data);
      setClients(clientsRes.data);
    } catch (error) {
      console.error('❌ Erreur chargement comptabilité:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les données de comptabilité',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-MA', {
      style: 'currency',
      currency: 'MAD',
    }).format(amount);
  };

  // Fonction pour récupérer le client
  const getClient = (clientId: number): Client => {
    return clients.find(c => c.id === clientId) || { 
      id: clientId, 
      nom_societe: 'Client inconnu' 
    };
  };

  // Calculate statistics
  const totalCA = factures
    .filter((f) => f.statut === 'payé')
    .reduce((acc, f) => acc + Number(f.total_ttc), 0);

  const totalImpaye = factures
    .filter((f) => f.statut !== 'payé')
    .reduce((acc, f) => acc + Number(f.total_ttc), 0);

  const totalDevisPotentiel = devis
    .filter((d) => d.statut !== 'facturé')
    .reduce((acc, d) => acc + Number(d.total_ttc), 0);

  // Client analysis
  const clientStats: ClientStats[] = clients.map((client) => {
    const clientFactures = factures.filter((f) => f.client_id === client.id);
    const clientDevis = devis.filter((d) => d.client_id === client.id);
    
    return {
      ...client,
      chiffreAffaires: clientFactures
        .filter((f) => f.statut === 'payé')
        .reduce((acc, f) => acc + Number(f.total_ttc), 0),
      facturesEnRetard: clientFactures.filter(
        (f) => f.statut !== 'payé' && isBefore(new Date(f.date_echeance), today)
      ).length,
      devisAFacturer: clientDevis.filter((d) => d.statut !== 'facturé').length,
      potentiel: clientDevis
        .filter((d) => d.statut !== 'facturé')
        .reduce((acc, d) => acc + Number(d.total_ttc), 0),
    };
  }).sort((a, b) => b.chiffreAffaires - a.chiffreAffaires); // Tri par CA décroissant

  const handleExportCSV = (type: 'factures' | 'devis' | 'clients') => {
    try {
      if (type === 'factures') {
        const facturesForExport = factures.map(f => ({
          ...f,
          client: getClient(f.client_id)
        }));
        exportFacturesToCSV(facturesForExport as any, getClient as any);
      } else if (type === 'devis') {
        const devisForExport = devis.map(d => ({
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
        ? factures.map(f => ({
            numero: f.numero_facture,
            client: getClient(f.client_id).nom_societe,
            montant: formatCurrency(Number(f.total_ttc)),
            echeance: format(new Date(f.date_echeance), 'dd/MM/yyyy'),
            statut: f.statut === 'payé' ? 'Payée' : 'Impayée'
          }))
        : devis.map(d => ({
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
      render: (item: Facture) => (
        <span className="font-mono font-medium">{item.numero_facture}</span>
      ),
    },
    {
      key: 'client',
      header: 'Client',
      render: (item: Facture) => {
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
      render: (item: Facture) => formatCurrency(Number(item.total_ttc)),
    },
    {
      key: 'dateEcheance',
      header: 'Échéance',
      render: (item: Facture) => {
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
      render: (item: Facture) => {
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
      render: (item: Devis) => (
        <span className="font-mono font-medium">{item.numero_devis}</span>
      ),
    },
    {
      key: 'client',
      header: 'Client',
      render: (item: Devis) => {
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
      render: (item: Devis) => formatCurrency(Number(item.total_ttc)),
    },
    {
      key: 'dateEvenement',
      header: 'Événement',
      render: (item: Devis) => {
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
      render: (item: Devis) => {
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
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
                onRowClick={(item) => navigate(`/factures/${item.id}`)}
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
                onRowClick={(item) => navigate(`/devis/${item.id}`)}
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
                onRowClick={(item) => navigate(`/clients/${item.id}`)}
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