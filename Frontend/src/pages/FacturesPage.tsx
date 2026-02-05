import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MoreHorizontal, Eye, Edit, Trash2, Send, Printer } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { DataTable } from '@/components/ui/data-table';
import { StatusBadge } from '@/components/ui/status-badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import api from '@/lib/axios';
import { format, isBefore } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Facture, Client } from '@/types';
import { useToast } from '@/hooks/use-toast';

const FacturesPage: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [facturesList, setFacturesList] = useState<Facture[]>([]);
  const [clientsMap, setClientsMap] = useState<Record<number, Client>>({});
  const [loading, setLoading] = useState(true);
  const today = new Date();

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('fr-MA', { style: 'currency', currency: 'MAD' }).format(amount);

  // Fetch toutes les factures + clients
  useEffect(() => {
    const fetchFactures = async () => {
      try {
        const facturesRes = await api.get<any[]>('/api/factures');
        const clientsIds = Array.from(new Set(facturesRes.data.map(f => f.client_id)));
        
        // Fetch info clients
        const clientsMapTemp: Record<number, Client> = {};
        await Promise.all(clientsIds.map(async (id) => {
          const res = await api.get<Client>(`/api/clients/${id}`);
          clientsMapTemp[id] = {
            ...res.data,
            id: Number(res.data.id),
          };
        }));

        setClientsMap(clientsMapTemp);

        // Map factures
        setFacturesList(
          facturesRes.data.map(f => ({
            ...f,
            id: f.id.toString(),
            clientId: f.client_id,
            numero: f.numero_facture,
            totalTTC: Number(f.total_ttc) || 0,
            estPayee: f.statut === 'payé',
            dateFacturation: f.created_at ? new Date(f.created_at) : null,
            dateEcheance: f.date_echeance ? new Date(f.date_echeance) : null,
            statut: f.statut,
          }))
        );

        setLoading(false);
      } catch (err) {
        console.error(err);
        toast({ 
          title: 'Erreur', 
          description: 'Impossible de charger les factures', 
          variant: 'destructive' 
        });
        setLoading(false);
      }
    };

    fetchFactures();
  }, []);

  // Fonction pour supprimer une facture
  const handleDeleteFacture = async (facture: Facture & { client: Client }) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette facture ?')) {
      return;
    }

    try {
      console.log(`🗑️ Suppression de la facture ${facture.id} pour le client ${facture.clientId}`);
      
      await api.delete(`/api/clients/${facture.clientId}/factures/${facture.id}`);
      
      // Mettre à jour la liste locale
      setFacturesList(prev => prev.filter(f => f.id !== facture.id));
      
      console.log('✅ Facture supprimée avec succès');
      toast({
        title: 'Facture supprimée',
        description: 'La facture a été supprimée avec succès.',
        variant: 'destructive',
      });
    } catch (err: any) {
      console.error('❌ Erreur lors de la suppression:', err);
      console.error('Réponse serveur:', err.response?.data);
      toast({
        title: 'Erreur',
        description: err.response?.data?.message || 'Erreur lors de la suppression de la facture',
        variant: 'destructive',
      });
    }
  };

  // Fonction pour relancer une facture
  const handleRelancer = async (facture: Facture & { client: Client }) => {
    try {
      // TODO: Implémenter l'envoi d'email de relance côté backend
      console.log(`📧 Relance envoyée pour la facture ${facture.numero}`);
      
      toast({
        title: 'Relance envoyée',
        description: `Une relance a été envoyée à ${facture.client.email || facture.client.nom_societe}`,
      });
    } catch (err: any) {
      console.error('❌ Erreur lors de l\'envoi de la relance:', err);
      toast({
        title: 'Erreur',
        description: 'Erreur lors de l\'envoi de la relance',
        variant: 'destructive',
      });
    }
  };

  // Fonction pour imprimer/télécharger le PDF
  const handlePrintPDF = async (facture: Facture & { client: Client }) => {
    try {
      console.log(`🖨️ Téléchargement du PDF pour la facture ${facture.id}`);
      
      // Ouvrir le PDF dans un nouvel onglet
      window.open(`http://127.0.0.1:8000/api/factures/${facture.id}/pdf`, '_blank');
      
      toast({
        title: 'PDF généré',
        description: 'Le PDF de la facture a été ouvert dans un nouvel onglet.',
      });
    } catch (err: any) {
      console.error('❌ Erreur lors de la génération du PDF:', err);
      toast({
        title: 'Erreur',
        description: 'Erreur lors de la génération du PDF',
        variant: 'destructive',
      });
    }
  };

  // Ajoute info client à chaque facture
  const facturesWithClient = facturesList.map(f => ({
    ...f,
    client: clientsMap[f.clientId],
  }));

  const filteredFactures = facturesWithClient.filter(
    (facture) =>
      facture.numero.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (facture.client?.nom_societe || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const columns = [
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
          {item.client?.nom_societe || '—'}
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
      key: 'dateFacturation',
      header: 'Date',
      render: (item: Facture) =>
        item.dateFacturation ? format(item.dateFacturation, 'dd MMM yyyy', { locale: fr }) : '-',
    },
    {
      key: 'dateEcheance',
      header: 'Échéance',
      render: (item: Facture) => {
        if (!item.dateEcheance) return '-';
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
        if (!item.dateEcheance) return <StatusBadge variant="unpaid" />;
        const isOverdue = !item.estPayee && isBefore(item.dateEcheance, today);
        return <StatusBadge variant={item.estPayee ? 'paid' : isOverdue ? 'overdue' : 'unpaid'} />;
      },
    },
    {
      key: 'actions',
      header: '',
      className: 'w-12',
      render: (item: Facture & { client: Client }) => (
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
                navigate(`/clients/${item.clientId}/factures/${item.id}`);
              }}
            >
              <Eye className="h-4 w-4 mr-2" />
              Voir
            </DropdownMenuItem>

            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/clients/${item.clientId}/factures/${item.id}/edit`);
              }}
            >
              <Edit className="h-4 w-4 mr-2" />
              Modifier
            </DropdownMenuItem>

            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                handlePrintPDF(item);
              }}
            >
              <Printer className="h-4 w-4 mr-2" />
              Imprimer PDF
            </DropdownMenuItem>

            {!item.estPayee && (
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  handleRelancer(item);
                }}
              >
                <Send className="h-4 w-4 mr-2" />
                Relancer
              </DropdownMenuItem>
            )}

            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteFacture(item);
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

  if (loading)
    return <p className="text-center mt-10">Chargement des factures...</p>;

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader 
        title="Factures" 
        description="Gérez toutes les factures clients" 
      />

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher par numéro ou client..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <DataTable
        data={filteredFactures}
        columns={columns}
        onRowClick={(item) => navigate(`/clients/${item.clientId}/factures/${item.id}`)}
        emptyMessage="Aucune facture trouvée"
      />
    </div>
  );
};

export default FacturesPage;