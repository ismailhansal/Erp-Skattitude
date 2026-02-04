import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
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
import { format, isAfter, isBefore, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { fr } from 'date-fns/locale';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface Client {
  id: number;
  nom_societe: string;
}

interface Facture {
  id: number;
  client_id: number;
  numero_facture: string;
  date_echeance: string;
  date_facture: string;
  total_ttc: number;
  statut: string;
  client?: Client;
}

interface Devis {
  id: number;
  client_id: number;
  numero_devis: string;
  date_evenement: string;
  created_at: string;
  total_ttc: number;
  statut: string;
  client?: Client;
}

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const today = new Date();

  const [factures, setFactures] = useState<Facture[]>([]);
  const [devis, setDevis] = useState<Devis[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Récupérer les données en parallèle
      const [facturesRes, devisRes, clientsRes] = await Promise.all([
        axios.get('http://127.0.0.1:8000/api/factures'),
        axios.get('http://127.0.0.1:8000/api/devis'),
        axios.get('http://127.0.0.1:8000/api/clients'),
      ]);

      console.log('📊 Données dashboard chargées:', {
        factures: facturesRes.data.length,
        devis: devisRes.data.length,
        clients: clientsRes.data.length,
      });

      setFactures(facturesRes.data);
      setDevis(devisRes.data);
      setClients(clientsRes.data);
    } catch (error) {
      console.error('❌ Erreur chargement dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour récupérer le client
  const getClient = (clientId: number): Client => {
    return clients.find(c => c.id === clientId) || { id: clientId, nom_societe: 'Client inconnu' };
  };

  // Calculer les KPIs
  const facturesImpayees = factures.filter((f) => f.statut !== 'payé');
  const facturesEnRetard = facturesImpayees.filter((f) => 
    isBefore(new Date(f.date_echeance), today)
  );
  
  const devisAFacturer = devis.filter((d) => d.statut !== 'facturé');
  const devisEnRetard = devisAFacturer.filter((d) => 
    d.date_evenement && isBefore(new Date(d.date_evenement), today)
  );
  
  const chiffreAffaires = factures
    .filter((f) => f.statut === 'payé')
    .reduce((acc, f) => acc + Number(f.total_ttc), 0);

  // 📊 CALCUL DU CA PAR MOIS (6 derniers mois)
  const getLast6MonthsCA = () => {
    const months = [];
    
    for (let i = 5; i >= 0; i--) {
      const monthDate = subMonths(today, i);
      const monthStart = startOfMonth(monthDate);
      const monthEnd = endOfMonth(monthDate);
      
      const monthCA = factures
        .filter((f) => {
          if (f.statut !== 'payé') return false;
          const factureDate = new Date(f.date_facture);
          return factureDate >= monthStart && factureDate <= monthEnd;
        })
        .reduce((acc, f) => acc + Number(f.total_ttc), 0);
      
      months.push({
        mois: format(monthDate, 'MMM yyyy', { locale: fr }),
        ca: monthCA,
        isCurrentMonth: i === 0,
      });
    }
    
    return months;
  };

  const caData = getLast6MonthsCA();

  // Factures du mois en cours
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  
  const facturesDuMois = factures.filter((f) => {
    const factureDate = new Date(f.date_echeance);
    return factureDate.getMonth() === currentMonth && factureDate.getFullYear() === currentYear;
  }).slice(0, 20);

  const devisDuMois = devis.filter((d) => {
    const devisDate = new Date(d.created_at);
    return devisDate.getMonth() === currentMonth && devisDate.getFullYear() === currentYear;
  }).slice(0, 20);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-MA', {
      style: 'currency',
      currency: 'MAD',
    }).format(amount);
  };

  

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
      render: (item: Facture) => (
        <span className="font-mono font-medium text-foreground">
          {item.numero_facture}
        </span>
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
      key: 'total_ttc',
      header: 'Montant',
      render: (item: Facture) => (
        <span className="font-semibold">{formatCurrency(Number(item.total_ttc))}</span>
      ),
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
      render: (item: Facture) => {
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
      render: (item: Devis) => (
        <span className="font-mono font-medium text-foreground">
          {item.numero_devis}
        </span>
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
      render: (item: Devis) => (
        <span className="font-semibold">{formatCurrency(Number(item.total_ttc))}</span>
      ),
    },
    {
      key: 'dateCreation',
      header: 'Création',
      render: (item: Devis) => 
        format(new Date(item.created_at), 'dd MMM yyyy', { locale: fr }),
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
              onRowClick={(item) => navigate(`/factures/${item.id}`)}
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
              onRowClick={(item) => navigate(`/devis/${item.id}`)}
              emptyMessage="Aucun devis ce mois"
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;