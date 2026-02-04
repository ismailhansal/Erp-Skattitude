import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  Building2, MapPin, Phone, Mail, FileText, Receipt, Plus, ExternalLink 
} from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { StatusBadge } from '@/components/ui/status-badge';
import { Client, Devis, Facture } from '@/types';
import { format, isBefore } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Eye, Edit, Trash2 } from 'lucide-react';

const ClientDetail: React.FC = () => {
  const { clientId } = useParams<{ clientId: string }>();
  const navigate = useNavigate();
  const today = new Date();

  const [client, setClient] = useState<Client | null>(null);
  const [devis, setDevis] = useState<Devis[]>([]);
  const [factures, setFactures] = useState<Facture[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchClientData = async () => {
      try {
        // 1️⃣ Client
        const clientRes = await axios.get<Client>(
          `http://127.0.0.1:8000/api/clients/${clientId}`
        );

        setClient({
          ...clientRes.data,
          id: clientRes.data.id.toString(),
        });

        // 2️⃣ Devis
        const devisRes = await axios.get<any[]>(
          `http://127.0.0.1:8000/api/clients/${clientId}/devis`
        );

        setDevis(
          devisRes.data.map(d => {
            // Construire une description depuis les lignes
            let description = 'Aucune prestation';
            if (d.lignes && d.lignes.length > 0) {
              // Prendre la première ligne
              description = d.lignes[0].description;
              
              // Si plusieurs lignes, ajouter un compteur
              if (d.lignes.length > 1) {
                description += ` (+${d.lignes.length - 1} autre${d.lignes.length > 2 ? 's' : ''})`;
              }
            }

            return {
              ...d,
              id: d.id.toString(),
              numero: d.numero_devis || '',
              totalTTC: Number(d.total_ttc) || 0,
              description, // Description construite depuis les lignes
              dateCreation: d.created_at ? new Date(d.created_at) : null,
              dateEvenement: d.date_evenement ? new Date(d.date_evenement) : null,
              estFacture: d.statut === 'facturé',
              statut: d.statut,
            };
          })
        );

        // 3️⃣ Factures
        const facturesRes = await axios.get<any[]>(
          `http://127.0.0.1:8000/api/clients/${clientId}/factures`
        );

        setFactures(
          facturesRes.data.map(f => {
            // Construire une description depuis les lignes
            let description = 'Aucune prestation';
            if (f.lignes && f.lignes.length > 0) {
              // Prendre la première ligne
              description = f.lignes[0].description;
              
              // Si plusieurs lignes, ajouter un compteur
              if (f.lignes.length > 1) {
                description += ` (+${f.lignes.length - 1} autre${f.lignes.length > 2 ? 's' : ''})`;
              }
            }

            return {
              ...f,
              id: f.id.toString(),
              numero: f.numero_facture || '',
              totalTTC: Number(f.total_ttc) || 0,
              description, // Description construite depuis les lignes
              dateFacturation: f.created_at ? new Date(f.created_at) : null,
              dateEcheance: f.date_echeance ? new Date(f.date_echeance) : null,
              estPayee: f.statut === 'payé',
              statut: f.statut,
            };
          })
        );

        setLoading(false);
      } catch (err) {
        console.error(err);
        setLoading(false);
      }
    };

    fetchClientData();
  }, [clientId]);

  // Fonction pour supprimer un devis
  const handleDeleteDevis = async (devisId: string) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce devis ?')) {
      return;
    }

    try {
      console.log(`🗑️ Suppression du devis ${devisId} pour le client ${clientId}`);
      
      await axios.delete(`http://127.0.0.1:8000/api/clients/${clientId}/devis/${devisId}`);
      
      // Mettre à jour la liste locale
      setDevis(prev => prev.filter(d => d.id !== devisId));
      
      console.log('✅ Devis supprimé avec succès');
      alert('Devis supprimé avec succès');
    } catch (err: any) {
      console.error('❌ Erreur lors de la suppression:', err);
      console.error('Réponse serveur:', err.response?.data);
      alert('Erreur lors de la suppression du devis');
    }
  };

  // Fonction pour supprimer une facture (si besoin)
  const handleDeleteFacture = async (factureId: string) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette facture ?')) {
      return;
    }

    try {
      console.log(`🗑️ Suppression de la facture ${factureId} pour le client ${clientId}`);
      
      await axios.delete(`http://127.0.0.1:8000/api/clients/${clientId}/factures/${factureId}`);
      
      // Mettre à jour la liste locale
      setFactures(prev => prev.filter(f => f.id !== factureId));
      
      console.log('✅ Facture supprimée avec succès');
      alert('Facture supprimée avec succès');
    } catch (err: any) {
      console.error('❌ Erreur lors de la suppression:', err);
      console.error('Réponse serveur:', err.response?.data);
      alert('Erreur lors de la suppression de la facture');
    }
  };

  if (loading) return <p className="text-center mt-10">Chargement...</p>;
  if (!client)
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-muted-foreground">Client non trouvé</p>
      </div>
    );

  const totalCA = factures
    .filter(f => f.estPayee)
    .reduce((acc, f) => acc + f.totalTTC, 0);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('fr-MA', { style: 'currency', currency: 'MAD' }).format(amount);

  // Colonnes Devis
  const devisColumns = [
    { 
      key: 'numero_devis', 
      header: 'N° Devis', 
      render: (item: Devis) => <span className="font-mono font-medium">{item.numero}</span> 
    },
    { 
      key: 'description', 
      header: 'Description', 
      render: (item: Devis) => (
        <span className="font-medium text-sm max-w-xs truncate block" title={item.description}>
          {item.description}
        </span>
      )
    },
    { 
      key: 'totalttc', 
      header: 'Montant', 
      render: (item: Devis) => formatCurrency(item.totalTTC) 
    },
    { 
      key: 'dateCreation', 
      header: 'Création', 
      render: (item: Devis) => item.dateCreation ? format(item.dateCreation, 'dd MMM yyyy', { locale: fr }) : '-' 
    },
    { 
      key: 'dateEvenement', 
      header: 'Événement', 
      render: (item: Devis) => {
        if (!item.dateEvenement) return '-';
        const isPast = !item.estFacture && isBefore(item.dateEvenement, today);
        return (
          <span className={isPast ? 'text-destructive font-medium' : ''}>
            {format(item.dateEvenement, 'dd MMM yyyy', { locale: fr })}
          </span>
        );
      }
    },
    { 
      key: 'statut', 
      header: 'Statut', 
      render: (item: Devis) => {
        if (!item.dateEvenement) return <StatusBadge variant="pending" />;
        const isPast = !item.estFacture && isBefore(item.dateEvenement, today);
        if (item.estFacture) return <StatusBadge variant="invoiced" />;
        if (isPast) return <StatusBadge variant="toInvoice" />;
        return <StatusBadge variant="pending" />;
      }
    },
    {
      key: 'actions',
      header: '',
      className: 'w-12',
      render: (item: Devis) => (
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
                navigate(`/clients/${clientId}/devis/${item.id}`);
              }}
            >
              <Eye className="h-4 w-4 mr-2" />
              Voir
            </DropdownMenuItem>

            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/clients/${clientId}/devis/${item.id}/edit`);
              }}
            >
              <Edit className="h-4 w-4 mr-2" />
              Modifier
            </DropdownMenuItem>

            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteDevis(item.id);
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

  // Colonnes Factures
  const facturesColumns = [
    { 
      key: 'numero', 
      header: 'N° Facture', 
      render: (item: Facture) => <span className="font-mono font-medium">{item.numero}</span> 
    },
    { 
      key: 'description', 
      header: 'Description', 
      render: (item: Facture) => (
        <span className="font-medium text-sm max-w-xs truncate block" title={item.description}>
          {item.description}
        </span>
      )
    },
    { 
      key: 'totalttc', 
      header: 'Montant', 
      render: (item: Facture) => formatCurrency(item.totalTTC) 
    },
    { 
      key: 'dateFacturation', 
      header: 'Date', 
      render: (item: Facture) => item.dateFacturation ? format(item.dateFacturation, 'dd MMM yyyy', { locale: fr }) : '-' 
    },
    { 
      key: 'status', 
      header: 'Statut', 
      render: (item: Facture) => {
        if (!item.dateEcheance) return <StatusBadge variant={item.estPayee ? 'paid' : 'unpaid'} />;
        const isOverdue = !item.estPayee && isBefore(item.dateEcheance, today);
        return <StatusBadge variant={item.estPayee ? 'paid' : isOverdue ? 'overdue' : 'unpaid'} />;
      }
    },
    {
      key: 'actions',
      header: '',
      className: 'w-12',
      render: (item: Facture) => (
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
                navigate(`/clients/${clientId}/factures/${item.id}`);
              }}
            >
              <Eye className="h-4 w-4 mr-2" />
              Voir
            </DropdownMenuItem>

            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/clients/${clientId}/factures/${item.id}/edit`);
              }}
            >
              <Edit className="h-4 w-4 mr-2" />
              Modifier
            </DropdownMenuItem>

            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteFacture(item.id);
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

  return (
    <div className="space-y-8 animate-fade-in">
      <PageHeader
        title={client.nom_societe}
        description="Détails du client"
        showBack
        backPath="/clients"
        actions={
          <Button variant="outline" onClick={() => navigate(`/clients/${clientId}/vente`)}>
            <Plus className="h-4 w-4 mr-2" />
            Créer une vente
          </Button>
        }
      />

      {/* Info client */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              Informations
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Société</p>
                <p className="font-medium">{client.nom_societe}</p>
              </div>
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground mt-1" />
                <div>
                  <p className="font-medium">{client.adresse}</p>
                  <p className="text-muted-foreground"> {client.ville}, {client.pays}</p>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>{client.telephone}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span>{client.email}</span>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">ICE</p>
                <p className="font-mono">{client.ice}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Résumé */}
        <Card>
          <CardHeader>
            <CardTitle>Résumé</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-primary/5 rounded-lg">
              <span className="text-sm text-muted-foreground">Chiffre d'affaires</span>
              <span className="font-bold text-lg">{formatCurrency(totalCA)}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
              <span className="text-sm text-muted-foreground">Devis</span>
              <span className="font-semibold">{devis.length}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
              <span className="text-sm text-muted-foreground">Factures</span>
              <span className="font-semibold">{factures.length}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Devis */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Devis ({devis.length})
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={() => navigate('/devis')}>
            <ExternalLink className="h-4 w-4 mr-1" />
            Voir tous
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

      {/* Factures */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5 text-primary" />
            Factures ({factures.length})
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={() => navigate('/factures')}>
            <ExternalLink className="h-4 w-4 mr-1" />
            Voir toutes
          </Button>
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
    </div>
  );
};

export default ClientDetail;