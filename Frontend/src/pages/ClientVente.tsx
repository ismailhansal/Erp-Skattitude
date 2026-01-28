import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FileText, Receipt, Plus, ArrowLeft } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { StatusBadge } from '@/components/ui/status-badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Devis, Facture, Client } from '@/types';
import { format, isBefore } from 'date-fns';
import { fr } from 'date-fns/locale';

const ClientVente: React.FC = () => {
  const { clientId } = useParams<{ clientId: string }>();
  const navigate = useNavigate();
  const today = new Date();

  const [client, setClient] = useState<Client | null>(null);
  const [devis, setDevis] = useState<Devis[]>([]);
  const [factures, setFactures] = useState<Facture[]>([]);
  const [loading, setLoading] = useState(true);

useEffect(() => {
  const fetchClientVentes = async () => {
    try {
      // Récupération du client
      const clientRes = await axios.get<Client>(`http://127.0.0.1:8000/api/clients/${clientId}`);
      setClient({ ...clientRes.data, id: clientRes.data.id.toString() });

      // Récupération des devis
      const devisRes = await axios.get<any[]>(`http://127.0.0.1:8000/api/clients/${clientId}/devis`);
      setDevis(
        devisRes.data.map(d => ({
          ...d,
          id: d.id.toString(),
          numero: d.numero_devis || '', // mapping si champs vide
          totalTTC: parseFloat(d.total_ttc) || 0,
          estFacture: d.statut === 'facturé',
          dateCreation: d.created_at ? new Date(d.created_at) : null,
          dateEvenement: d.date_evenement ? new Date(d.date_evenement) : null,
        }))
      );

      // Récupération des factures
      const facturesRes = await axios.get<any[]>(`http://127.0.0.1:8000/api/clients/${clientId}/factures`);
      setFactures(
        facturesRes.data.map(f => ({
          ...f,
          id: f.id.toString(),
          totalTTC: parseFloat(f.total_ttc) || 0,
          numero: f.numero_facture || '',
          estPayee: f.statut === 'payé',
          dateFacturation: f.created_at ? new Date(f.created_at) : null,
          dateEcheance: f.date_echeance ? new Date(f.date_echeance) : null,
        }))
      );

      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  fetchClientVentes();
}, [clientId]);


  if (loading) return <p className="text-center mt-10"> </p>;

  if (!client)
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <p className="text-muted-foreground">Client non trouvé</p>
        <Button variant="outline" onClick={() => navigate('/clients')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour aux clients
        </Button>
      </div>
    );

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('fr-MA', { style: 'currency', currency: 'MAD' }).format(amount);

  const devisColumns = [
    { key: 'numero', header: 'N° Devis', render: (item: Devis) => <span className="font-mono font-medium">{item.numero}</span> },
    { key: 'totalttc', header: 'Montant', render: (item: Devis) => formatCurrency(item.totalTTC) },
    { key: 'dateCreation', header: 'Création', render: (item: Devis) => format(item.dateCreation, 'dd MMM yyyy', { locale: fr }) },
    { key: 'dateEvenement', header: 'Événement', render: (item: Devis) => {
        const isPast = !item.estFacture && isBefore(item.dateEvenement, today);
        return <span className={isPast ? 'text-destructive font-medium' : ''}>{format(item.dateEvenement, 'dd MMM yyyy', { locale: fr })}</span>;
      } 
    },
    { key: 'status', header: 'Statut', render: (item: Devis) => {
        const isPast = isBefore(item.dateEvenement, today);
        if (item.estFacture) return <StatusBadge variant="invoiced" />;
        if (isPast) return <StatusBadge variant="toInvoice" />;
        return <StatusBadge variant="pending" />;
      } 
    },
  ];

  const facturesColumns = [
    { key: 'numero', header: 'N° Facture', render: (item: Facture) => <span className="font-mono font-medium">{item.numero}</span> },
    { key: 'totalttc', header: 'Montant', render: (item: Facture) => formatCurrency(item.totalTTC) },
    { key: 'dateFacturation', header: 'Date', render: (item: Facture) => format(item.dateFacturation, 'dd MMM yyyy', { locale: fr }) },
    { key: 'dateEcheance', header: 'Échéance', render: (item: Facture) => {
        const isOverdue = !item.estPayee && isBefore(item.dateEcheance, today);
        return <span className={isOverdue ? 'text-destructive font-medium' : ''}>{format(item.dateEcheance, 'dd MMM yyyy', { locale: fr })}</span>;
      } 
    },
    { key: 'status', header: 'Statut', render: (item: Facture) => {
        const isOverdue = !item.estPayee && isBefore(item.dateEcheance, today);
        return <StatusBadge variant={item.estPayee ? 'paid' : isOverdue ? 'overdue' : 'unpaid'} />;
      } 
    },
  ];

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
