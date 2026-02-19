import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Receipt, 
  FileText, 
  AlertTriangle, 
  TrendingUp,
  Send,
  ChevronRight,
  Loader2
} from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { StatCard } from '@/components/ui/stat-card';
import { DataTable } from '@/components/ui/data-table';
import { StatusBadge } from '@/components/ui/status-badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format, isBefore, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { fr } from 'date-fns/locale';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useDashboard } from '@/hooks/useDashboard';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const today = new Date();

  // ✅ Hook React Query
  const { factures, devis, clients, isLoading, getClient } = useDashboard();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-MA', {
      style: 'currency',
      currency: 'MAD',
    }).format(amount);
  };

  // Calculer les KPIs
  const facturesImpayees = factures.filter((f: any) => f.statut !== 'payé');
  const facturesEnRetard = facturesImpayees.filter((f: any) => 
    isBefore(new Date(f.date_echeance), today)
  );
  
  const devisAFacturer = devis.filter((d: any) => d.statut !== 'facturé');
  const devisEnRetard = devisAFacturer.filter((d: any) => 
    d.date_evenement && isBefore(new Date(d.date_evenement), today)
  );
  
  const chiffreAffaires = factures
    .filter((f: any) => f.statut === 'payé')
    .reduce((acc: number, f: any) => acc + Number(f.total_ttc), 0);

  // 📊 CALCUL DU CA PAR MOIS (6 derniers mois)
  const getLast6MonthsCA = () => {
    const months = [];
    
    for (let i = 5; i >= 0; i--) {
      const monthDate = subMonths(today, i);
      const monthStart = startOfMonth(monthDate);
      const monthEnd = endOfMonth(monthDate);
      
      const monthCA = factures
        .filter((f: any) => {
          if (f.statut !== 'payé') return false;
          const factureDate = new Date(f.date_facture);
          return factureDate >= monthStart && factureDate <= monthEnd;
        })
        .reduce((acc: number, f: any) => acc + Number(f.total_ttc), 0);
      
      months.push({
        mois: format(monthDate, 'MMM yyyy', { locale: fr }),
        ca: monthCA,
        isCurrentMonth: i === 0,
      });
    }
    
    return months;
  };

  const caData = getLast6MonthsCA();

  // Factures et devis du mois en cours
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  
  const facturesDuMois = factures.filter((f: any) => {
    const factureDate = new Date(f.date_echeance);
    return factureDate.getMonth() === currentMonth && factureDate.getFullYear() === currentYear;
  }).slice(0, 20);

  const devisDuMois = devis.filter((d: any) => {
    const devisDate = new Date(d.created_at);
    return devisDate.getMonth() === currentMonth && devisDate.getFullYear() === currentYear;
  }).slice(0, 20);

  // Custom Tooltip pour le graphique
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border rounded-lg shadow-lg p-3">
          <p className="text-sm font-medium text-foreground">{payload[0].payload.mois}</p>
          <p className="text-lg font-bold text-primary">{formatCurrency(payload[0].value)}</p>
        </div>
      );
    }
    return null;
  };

  // Colonnes Factures
  const facturesColumns = [
    {
      key: 'numero_facture',
      header: 'N° Facture',
      render: (item: any) => (
        <span className="font-mono font-medium text-foreground">
          {item.numero_facture}
        </span>
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
      key: 'total_ttc',
      header: 'Montant',
      render: (item: any) => (
        <span className="font-semibold">{formatCurrency(Number(item.total_ttc))}</span>
      ),
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
        return (
          <StatusBadge 
            variant={item.statut === 'payé' ? 'paid' : isOverdue ? 'overdue' : 'unpaid'} 
          />
        );
      },
    },
    {
      key: 'actions',
      header: '',
      render: (item: any) => {
        if (item.statut !== 'payé') {
          return (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                alert(`Relance pour la facture ${item.numero_facture}`);
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

  // Colonnes Devis
  const devisColumns = [
    {
      key: 'numero',
      header: 'N° Devis',
      render: (item: any) => (
        <span className="font-mono font-medium text-foreground">
          {item.numero_devis}
        </span>
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
      render: (item: any) => (
        <span className="font-semibold">{formatCurrency(Number(item.total_ttc))}</span>
      ),
    },
    {
      key: 'dateCreation',
      header: 'Création',
      render: (item: any) => 
        format(new Date(item.created_at), 'dd MMM yyyy', { locale: fr }),
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="text-sm text-muted-foreground">Chargement du tableau de bord...</p>
        </div>
      </div>
    );
  }

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

      {/* 📊 GRAPHIQUE CA 6 MOIS */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Évolution du CA sur 6 mois
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={caData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="mois" 
                className="text-xs text-muted-foreground"
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
              />
              <YAxis 
                className="text-xs text-muted-foreground"
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
                tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar 
                dataKey="ca" 
                fill="hsl(var(--primary))"
                radius={[8, 8, 0, 0]}
                className="fill-primary"
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Tables */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* Factures du mois */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-semibold">
              Factures du mois ({facturesDuMois.length})
            </CardTitle>
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
              data={facturesDuMois}
              columns={facturesColumns}
              onRowClick={(item: any) =>
                navigate(`/clients/${item.client_id}/factures/${item.id}`, {
                  state: { fromDashboard: true }
                })
              }
              emptyMessage="Aucune facture ce mois"
            />
          </CardContent>
        </Card>

        {/* Devis du mois */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-semibold">
              Devis du mois ({devisDuMois.length})
            </CardTitle>
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
              data={devisDuMois}
              columns={devisColumns}
              onRowClick={(item: any) =>
                navigate(`/clients/${item.client_id}/devis/${item.id}`, {
                  state: { fromDashboard: true }
                })
              }
              emptyMessage="Aucun devis ce mois"
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;