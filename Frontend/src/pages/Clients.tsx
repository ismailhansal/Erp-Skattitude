import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, MoreHorizontal, Eye, Edit, Trash2 } from 'lucide-react';
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
import { mockClients } from '@/data/mockData';
import { Client } from '@/types';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';





const Clients: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');

  //api laravel
const [clients, setClients] = useState<Client[]>([]);
const [loading, setLoading] = useState<boolean>(true);

useEffect(() => {
  axios
    .get<Client[]>("http://127.0.0.1:8000/api/clients")
    .then((res) => {
      // Transformer id en string pour DataTable
      const mapped = res.data.map((c) => ({
        ...c,
        id: c.id.toString(), // <-- ici
      }));
      setClients(mapped);
      setLoading(false);
    })
    .catch((err) => {
      console.error(err);
      setLoading(false);
    });
}, []);


//api laravel

const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [formData, setFormData] = useState({
    nom_societe: '',
    adresse: '',
    ville: '',
    codePostal: '',
    pays: 'Maroc',
    ice: '',
    telephone: '',
    email: '',
  });

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
        codePostal: client.codePostal,
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
        codePostal: '',
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
    // PUT vers Laravel
    try {
      const res = await axios.put<Client>(
        `http://127.0.0.1:8000/api/clients/${editingClient.id}`,
        formData
      );
      setClients(prev =>
        prev.map(c => (c.id === editingClient.id ? res.data : c))
      );
      toast({
        title: 'Client modifié',
        description: `${res.data.nom_societe} a été mis à jour.`,
      });
    } catch (err) {
      console.error(err);
    }
  } else {
    // POST vers Laravel
    try {
      const res = await axios.post<Client>(
        "http://127.0.0.1:8000/api/clients",
        formData
      );
      setClients(prev => [...prev, res.data]);
      toast({
        title: 'Client créé',
        description: `${res.data.nom_societe} a été ajouté.`,
      });
    } catch (err) {
      console.error(err);
    }
  }

  setIsDialogOpen(false);
};

  const handleDelete = async (client: Client) => {
  try {
    await axios.delete(`http://127.0.0.1:8000/api/clients/${client.id}`);
    setClients(prev => prev.filter(c => c.id !== client.id));
    toast({
      title: 'Client supprimé',
      description: `${client.nom_societe} a été supprimé.`,
      variant: 'destructive',
    });
    navigate('/clients');
  } catch (err) {
    console.error(err);
  }
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
      render: (item: Client) => format(item.created_at, 'dd MMM yyyy', { locale: fr }),
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
            <DropdownMenuItem onClick={() => navigate(`/clients/${item.id}`)}>
              <Eye className="h-4 w-4 mr-2" />
              Voir
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleOpenDialog(item)}>
              <Edit className="h-4 w-4 mr-2" />
              Modifier
            </DropdownMenuItem>
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

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Clients"
        description="Gérez votre portefeuille clients"
        actions={
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="h-4 w-4 mr-2" />
            Nouveau client
          </Button>
        }
      />

      {/* Search */}
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

      {/* Table */}
      <DataTable
        data={filteredClients}
        columns={columns}
        onRowClick={(item) => navigate(`/clients/${item.id}`)}
        emptyMessage="Aucun client trouvé"
      />

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingClient ? 'Modifier le client' : 'Nouveau client'}
            </DialogTitle>
            <DialogDescription>
              {editingClient
                ? 'Modifiez les informations du client'
                : 'Renseignez les informations du nouveau client'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-2 gap-4 py-4">
              <div className="col-span-2 space-y-2">
                <Label htmlFor="societe">Nom de la société *</Label>
                <Input
                  id="societe"
                  value={formData.nom_societe}
                  onChange={(e) => setFormData({ ...formData, nom_societe: e.target.value })}
                  required
                />
              </div>
              <div className="col-span-2 space-y-2">
                <Label htmlFor="adresse">Adresse</Label>
                <Input
                  id="adresse"
                  value={formData.adresse}
                  onChange={(e) => setFormData({ ...formData, adresse: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ville">Ville</Label>
                <Input
                  id="ville"
                  value={formData.ville}
                  onChange={(e) => setFormData({ ...formData, ville: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="codePostal">Code postal</Label>
                <Input
                  id="codePostal"
                  value={formData.codePostal}
                  onChange={(e) => setFormData({ ...formData, codePostal: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pays">Pays</Label>
                <Input
                  id="pays"
                  value={formData.pays}
                  onChange={(e) => setFormData({ ...formData, pays: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ice">ICE</Label>
                <Input
                  id="ice"
                  value={formData.ice}
                  onChange={(e) => setFormData({ ...formData, ice: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="telephone">Téléphone *</Label>
                <Input
                  id="telephone"
                  value={formData.telephone}
                  onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Annuler
              </Button>
              <Button type="submit">
                {editingClient ? 'Enregistrer' : 'Créer le client'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Clients;
