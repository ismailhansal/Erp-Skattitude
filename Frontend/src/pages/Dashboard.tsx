import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Receipt, 
  FileText, 
  AlertTriangle, 
  TrendingUp,
  Send,
  ChevronRight 
} from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { StatCard } from '@/components/ui/stat-card';
import { DataTable } from '@/components/ui/data-table';
import { StatusBadge } from '@/components/ui/status-badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { mockFactures, mockDevis, getClientById } from '@/data/mockData';
import { format, isAfter, isBefore } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Facture, Devis, Client } from '@/types';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const today = new Date();

  // Get current month data
  const currentMonthFactures = mockFactures.filter(
    (f) => f.dateFacturation.getMonth() === today.getMonth()
  );
  const currentMonthDevis = mockDevis.filter(
    (d) => d.dateCreation.getMonth() === today.getMonth()
  );

  // Calculate KPIs
  const facturesImpayees = mockFactures.filter((f) => !f.estPayee);
  const facturesEnRetard = facturesImpayees.filter((f) => isBefore(f.dateEcheance, today));
  const devisAFacturer = mockDevis.filter((d) => !d.estFacture);
  const devisEnRetard = devisAFacturer.filter((d) => isBefore(d.dateEvenement, today));
  
  const chiffreAffaires = mockFactures
    .filter((f) => f.estPayee)
    .reduce((acc, f) => acc + f.totalTTC, 0);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-MA', {
      style: 'currency',
      currency: 'MAD',
    }).format(amount);
  };

  // Factures columns
  const facturesColumns = [
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
          {item.client.societe}
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
    {
      key: 'actions',
      header: '',
      render: (item: Facture) => {
        if (!item.estPayee) {
          return (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                // Handle relancer
              }}
              className="text-primary hover:text-primary"
            >
              <Send className="h-4 w-4 mr-1" />
              Relancer
            </Button>
          );
        }
        return null;
      },
    },
  ];

  // Devis columns
  const devisColumns = [
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
  ];

  const facturesWithClient = mockFactures.slice(0, 5).map((f) => ({
    ...f,
    client: getClientById(f.clientId)!,
  }));

  const devisWithClient = mockDevis.slice(0, 5).map((d) => ({
    ...d,
    client: getClientById(d.clientId)!,
  }));

  return (
    <div className="space-y-8 animate-fade-in">
      <PageHeader
        title="Tableau de bord"
        description="Vue synthétique de votre activité ce mois"
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Chiffre d'affaires"
          value={formatCurrency(chiffreAffaires)}
          icon={TrendingUp}
          variant="primary"
          trend={{ value: 12, positive: true }}
        />
        <StatCard
          title="Factures impayées"
          value={facturesImpayees.length}
          icon={Receipt}
          variant={facturesEnRetard.length > 0 ? 'destructive' : 'warning'}
        />
        <StatCard
          title="Devis à facturer"
          value={devisAFacturer.length}
          icon={FileText}
          variant={devisEnRetard.length > 0 ? 'destructive' : 'warning'}
        />
        <StatCard
          title="En retard"
          value={facturesEnRetard.length + devisEnRetard.length}
          icon={AlertTriangle}
          variant="destructive"
        />
      </div>

      {/* Alerts for overdue items */}
      {devisEnRetard.length > 0 && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="flex items-center gap-4 py-4">
            <AlertTriangle className="h-6 w-6 text-destructive" />
            <div className="flex-1">
              <p className="font-medium text-destructive">
                {devisEnRetard.length} devis dont l'événement est passé nécessite(nt) une facturation
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => navigate('/devis')}
              className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
            >
              Voir les devis
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Tables */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* Factures du mois */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-semibold">Factures du mois</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/factures')}
              className="text-primary"
            >
              Voir tout
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </CardHeader>
          <CardContent>
            <DataTable
              data={facturesWithClient}
              columns={facturesColumns}
              onRowClick={(item) => navigate(`/factures/${item.id}`, { state: { from: 'dashboard' } })}
              emptyMessage="Aucune facture ce mois"
            />
          </CardContent>
        </Card>

        {/* Devis du mois */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-semibold">Devis du mois</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/devis')}
              className="text-primary"
            >
              Voir tout
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </CardHeader>
          <CardContent>
            <DataTable
              data={devisWithClient}
              columns={devisColumns}
              onRowClick={(item) => navigate(`/devis/${item.id}`, { state: { from: 'dashboard' } })}
              emptyMessage="Aucun devis ce mois"
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
