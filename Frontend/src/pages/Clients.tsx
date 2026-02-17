import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, MoreHorizontal, Eye, Edit, Trash2, Loader2 } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { DataTable } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Client } from '@/types';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useClients } from '@/hooks/useClients';

const Clients: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [formData, setFormData] = useState({
    nom_societe: '',
    adresse: '',
    ville: '',
    pays: 'Maroc',
    ice: '',
    telephone: '',
    email: '',
  });

  // ✅ Hook React Query
  const { clients, isLoading, createClient, updateClient, deleteClient } = useClients();

  const filteredClients = clients.filter(
    (client) =>
      client.nom_societe.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.ville.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleOpenDialog = (client?: Client) => {
    if (client) {
      setEditingClient(client);
      setFormData({
        nom_societe: client.nom_societe,
        adresse: client.adresse,
        ville: client.ville,
        pays: client.pays,
        ice: client.ice,
        telephone: client.telephone,
        email: client.email,
      });
    } else {
      setEditingClient(null);
      setFormData({
        nom_societe: '',
        adresse: '',
        ville: '',
        pays: 'Maroc',
        ice: '',
        telephone: '',
        email: '',
      });
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (editingClient) {
      updateClient({ id: editingClient.id, data: formData });
    } else {
      createClient(formData);
    }

    setIsDialogOpen(false);
    setEditingClient(null);
  };

  const handleDelete = async (client: Client) => {
    if (!window.confirm(`Supprimer ${client.nom_societe} ?`)) return;
    deleteClient(client.id);
  };

  const columns = [
    {
      key: 'societe',
      header: 'Société',
      render: (item: Client) => (
        <span className="font-semibold text-foreground">{item.nom_societe}</span>
      ),
    },
    {
      key: 'ville',
      header: 'Ville',
      render: (item: Client) => item.ville,
    },
    {
      key: 'pays',
      header: 'Pays',
      render: (item: Client) => item.pays,
    },
    {
      key: 'telephone',
      header: 'Téléphone',
      render: (item: Client) => item.telephone,
    },
    {
      key: 'email',
      header: 'Email',
      render: (item: Client) => (
        <span className="text-muted-foreground">{item.email}</span>
      ),
    },
    {
      key: 'createdAt',
      header: 'Créé le',
      render: (item: Client) => format(new Date(item.created_at), 'dd MMM yyyy', { locale: fr }),
    },
    {
      key: 'actions',
      header: '',
      className: 'w-12',
      render: (item: Client) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" onClick={(e) => e.stopPropagation()}>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); navigate(`/clients/${item.id}`); }}>
              <Eye className="h-4 w-4 mr-2" />
              Voir
            </DropdownMenuItem>
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleOpenDialog(item); }}>
              <Edit className="h-4 w-4 mr-2" />
              Modifier
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={(e) => { e.stopPropagation(); handleDelete(item); }}
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

  if (isLoading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <PageHeader title="Clients" description="Gérez votre portefeuille clients" />
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-center h-64">
              <div className="text-center space-y-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
                <p className="text-sm text-muted-foreground">Chargement des clients...</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Clients"
        description="Gérez votre portefeuille clients"
        actions={
          <Button onClick={() => { setEditingClient(null); handleOpenDialog(); }}>
            <Plus className="h-4 w-4 mr-2" />
            Nouveau client
          </Button>
        }
      />

      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher par nom, email ou ville..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      <DataTable
        data={filteredClients}
        columns={columns}
        onRowClick={(item) => navigate(`/clients/${item.id}`)}
        emptyMessage="Aucun client trouvé"
      />

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        {/* ... Votre formulaire dialog existant ... */}
      </Dialog>
    </div>
  );
};

export default Clients;