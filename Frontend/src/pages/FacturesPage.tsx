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
import axios from 'axios';
import { format, isBefore } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Facture, Client } from '@/types';
import { useToast } from '@/hooks/use-toast';

const FacturesPage: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [factures, setFactures] = useState<Facture[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const today = new Date();

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('fr-MA', { style: 'currency', currency: 'MAD' }).format(amount);

  useEffect(() => {
    const fetchFactures = async () => {
      try {
        // Récupération de toutes les factures
        const facturesRes = await axios.get<Facture[]>('http://127.0.0.1:8000/api/factures');
        // Récupération de tous les clients
        const clientsRes = await axios.get<Client[]>('http://127.0.0.1:8000/api/clients');

        setFactures(
          facturesRes.data.map(f => ({
            ...f,
            id: f.id.toString(),
            totalTTC: Number(f.total_ttc),
            estPayee: f.statut === 'payé',
            dateFacturation: f.created_at ? new Date(f.created_at) : null,
            dateEcheance: f.date_echeance ? new Date(f.date_echeance) : null,
          }))
        );

        setClients(clientsRes.data.map(c => ({ ...c, id: c.id.toString() })));
        setLoading(false);
      } catch (err) {
        console.error(err);
        setLoading(false);
      }
    };

    fetchFactures();
  }, []);

  const getClientById = (id: number | string) => clients.find(c => c.id === String(id));

  const facturesWithClient = factures.map(f => ({
    ...f,
    client: getClientById(f.client_id)!,
  }));

  const filteredFactures = facturesWithClient.filter(
    f =>
      f.numero_facture.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.client.nom_societe.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDelete = (facture: Facture) => {
    setFactures(prev => prev.filter(f => f.id !== facture.id));
    toast({
      title: 'Facture supprimée',
      description: `La facture ${facture.numero_facture} a été supprimée.`,
      variant: 'destructive',
    });
  };

  const handleRelancer = (facture: Facture & { client: Client }) => {
    toast({
      title: 'Relance envoyée',
      description: `Une relance a été envoyée à ${facture.client.email}`,
    });
  };

  const columns = [
    {
      key: 'numero',
      header: 'N° Facture',
      render: (item: Facture & { client: Client }) => (
        <span className="font-mono font-medium text-foreground">{item.numero_facture}</span>
      ),
    },
    {
      key: 'client',
      header: 'Client',
      render: (item: Facture & { client: Client }) => (
        <button
          onClick={e => {
            e.stopPropagation();
            navigate(`/clients/${item.client_id}`);
          }}
          className="text-primary hover:underline font-medium"
        >
          {item.client.nom_societe}
        </button>
      ),
    },
    {
      key: 'totalTTC',
      header: 'Montant',
      render: (item: Facture) => <span className="font-semibold">{formatCurrency(item.totalTTC)}</span>,
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
    {
      key: 'actions',
      header: '',
      className: 'w-12',
      render: (item: Facture & { client: Client }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" onClick={e => e.stopPropagation()}>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => navigate(`/factures/${item.id}`)}>
              <Eye className="h-4 w-4 mr-2" />
              Voir
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate(`/factures/${item.id}/edit`)}>
              <Edit className="h-4 w-4 mr-2" />
              Modifier
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => {}}>
              <Printer className="h-4 w-4 mr-2" />
              Imprimer
            </DropdownMenuItem>
            {!item.estPayee && (
              <DropdownMenuItem onClick={() => handleRelancer(item)}>
                <Send className="h-4 w-4 mr-2" />
                Relancer
              </DropdownMenuItem>
            )}
            <DropdownMenuItem
              onClick={() => handleDelete(item)}
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

  if (loading) return <div className="flex justify-center items-center h-96">Chargement...</div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Factures" description="Gérez toutes les factures clients" />

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher par numéro ou client..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <DataTable
        data={filteredFactures}
        columns={columns}
        onRowClick={item => navigate(`/factures/${item.id}`)}
        emptyMessage="Aucune facture trouvée"
      />
    </div>
  );
};

export default FacturesPage;
