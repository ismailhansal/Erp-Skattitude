import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  Receipt, 
  Calendar, 
  Printer, 
  Edit, 
  Send,
  FileText,
  ArrowLeft,
  CheckCircle2
} from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { StatusBadge } from '@/components/ui/status-badge';
import { format, isBefore, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { FacturePrintView } from '@/components/documents/FacturePrintView';
import { useToast } from '@/hooks/use-toast';

interface LigneFacture {
  id: number;
  description: string;
  quantiteHotesses: number;
  nombreJours: number;
  prixUnitaire: number;
  tva: number;
}

interface Client {
  id: number;
  nom_societe: string;
  ice: string;
  email: string;
  adresse: string;
  ville: string;
  pays: string;
  telephone: string;
  created_at: string;
  updated_at: string;
}

interface Devis {
  id: number;
  numero_devis: string;
  date_creation: string;
  date_evenement: string;
  description: string;
  created_at: string;
  bon_commande?: string;
}

interface Facture {
  id: number;
  numero_facture: string;
  client_id: number;
  devis_id?: number;
  date_facture: string;
  date_echeance: string;
  description: string;
  quantite: number;
  nombre_jours: number;
  prix_unitaire: string;
  tva: string;
  sous_total: string;
  total_ttc: string;
  condition_reglement: string;
  statut: string;
  created_at: string;
  updated_at: string;
  client: Client;
  devis?: Devis;
  lignes: LigneFacture[];
}

const ClientFactureDetail: React.FC = () => {
  const { clientId, factureId } = useParams<{ clientId: string; factureId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const today = new Date();

  const [facture, setFacture] = useState<Facture | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFacturePrint, setShowFacturePrint] = useState(false);

  // Helper safe pour parser les dates
  const parseDateSafe = (dateStr?: string) => {
    if (!dateStr) return null;
    try {
      return parseISO(dateStr);
    } catch {
      return null;
    }
  };

  const formatDate = (dateStr?: string) => {
    const date = parseDateSafe(dateStr);
    return date ? format(date, 'dd MMMM yyyy', { locale: fr }) : '—';
  };

  const formatCurrency = (amount: number | string) =>
    new Intl.NumberFormat('fr-MA', { style: 'currency', currency: 'MAD' }).format(Number(amount));

  useEffect(() => {
    const fetchFacture = async () => {
      try {
        setLoading(true);
        const res = await axios.get<Facture>(`http://127.0.0.1:8000/api/clients/${clientId}/factures/${factureId}`);
        setFacture(res.data);
      } catch (err) {
        console.error(err);
        setError('Impossible de charger la facture.');
      } finally {
        setLoading(false);
      }
    };
    fetchFacture();
  }, [clientId, factureId]);

  const handleRelancer = () => {
    if (!facture) return;
    toast({
      title: 'Relance envoyée',
      description: `Une relance a été envoyée à ${facture.client.email}`,
    });
  };

  const handleMarquerPayee = () => {
    if (!facture) return;
    toast({
      title: 'Facture marquée comme payée',
      description: `La facture ${facture.numero_facture} a été marquée comme payée.`,
    });
  };

  if (loading) return <p>Chargement...</p>;
  if (error || !facture) return (
    <div className="flex flex-col items-center justify-center h-96 gap-4">
      <p className="text-muted-foreground">{error || 'Facture non trouvée'}</p>
      <Button variant="outline" onClick={() => navigate(`/clients/${clientId}/vente`)}>
        <ArrowLeft className="h-4 w-4 mr-2" />
        Retour aux ventes
      </Button>
    </div>
  );

  const isOverdue = facture.statut !== 'payee' && parseDateSafe(facture.date_echeance) && isBefore(parseDateSafe(facture.date_echeance)!, today);
  const getStatus = () => {
    if (facture.statut === 'payee') return 'paid';
    if (isOverdue) return 'overdue';
    return 'unpaid';
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title={`Facture ${facture.numero_facture}`}
        description={`Client: ${facture.client.nom_societe} • Émise le ${formatDate(facture.date_facture)}`}
        showBack
        backPath={`/clients/${clientId}/vente`}
        actions={
          <div className="flex gap-2 flex-wrap">
            <Dialog open={showFacturePrint} onOpenChange={setShowFacturePrint}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Printer className="h-4 w-4 mr-2" />
                  Imprimer
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto bg-card">
                <DialogHeader>
                  <DialogTitle>Aperçu de la facture</DialogTitle>
                </DialogHeader>
                <FacturePrintView 
                  facture={facture} 
                  client={facture.client} 
                  config={{}} 
                  devisOrigine={facture.devis}
                />
              </DialogContent>
            </Dialog>

            <Button variant="outline" onClick={() => navigate(`/clients/${clientId}/factures/${factureId}/edit`)}>
              <Edit className="h-4 w-4 mr-2" />
              Modifier
            </Button>

            {facture.statut !== 'payee' && (
              <>
                <Button variant="outline" onClick={handleRelancer}>
                  <Send className="h-4 w-4 mr-2" />
                  Relancer
                </Button>
                <Button onClick={handleMarquerPayee}>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Marquer payée
                </Button>
              </>
            )}
          </div>
        }
      />

      {isOverdue && (
        <Card className="border-destructive bg-destructive/5">
          <CardContent className="py-4">
            <p className="text-destructive font-medium flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Cette facture est en retard de paiement. Échéance: {formatDate(facture.date_echeance)}
            </p>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Receipt className="h-5 w-5 text-primary" />
                Détails de la facture
              </CardTitle>
              <StatusBadge variant={getStatus()} />
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Numéro</p>
                <p className="font-mono font-medium text-foreground">{facture.numero_facture}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Date de facturation</p>
                <p className="font-medium text-foreground">{formatDate(facture.date_facture)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Date d'échéance</p>
                <p className={`font-medium ${isOverdue ? 'text-destructive' : 'text-foreground'}`}>
                  {formatDate(facture.date_echeance)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Condition de règlement</p>
                <p className="font-medium text-foreground">{facture.condition_reglement}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">ICE Client</p>
                <p className="font-mono text-sm text-foreground">{facture.client.ice}</p>
              </div>
            </div>

            {/* Devis d'origine */}
            {facture.devis && (
              <>
                <Separator />
                <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                  <h4 className="font-medium mb-3 text-foreground flex items-center gap-2">
                    <FileText className="h-4 w-4 text-primary" />
                    Origine de la facture
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Devis d'origine</p>
                      <button 
                        onClick={() => navigate(`/clients/${clientId}/devis/${facture.devis?.id}`)}
                        className="font-mono font-medium text-primary hover:underline"
                      >
                        {facture.devis.numero_devis}
                      </button>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Date du devis</p>
                      <p className="font-medium text-foreground">{formatDate(facture.devis.created_at)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Date de l'événement</p>
                      <p className="font-medium text-foreground">{formatDate(facture.devis.date_evenement)}</p>
                    </div>
                    {facture.devis.bon_commande && (
                      <div>
                        <p className="text-sm text-muted-foreground">Bon de commande</p>
                        <p className="font-medium text-foreground">{facture.devis.bon_commande}</p>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            <Separator />

            {/* Lignes de facture */}
            <div>
              <h4 className="font-medium mb-4 text-foreground">Prestations</h4>
              <div className="border border-border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left p-3 font-medium text-foreground">Description</th>
                      <th className="text-center p-3 font-medium text-foreground">Qté</th>
                      <th className="text-center p-3 font-medium text-foreground">Jours</th>
                      <th className="text-right p-3 font-medium text-foreground">Prix unit.</th>
                      <th className="text-right p-3 font-medium text-foreground">TVA</th>
                      <th className="text-right p-3 font-medium text-foreground">Total HT</th>
                    </tr>
                  </thead>
                 
 <tbody>
  <tr className="border-t border-border">
    <td className="p-3 text-foreground">{facture.description}</td>
    <td className="p-3 text-center text-foreground">{facture.quantite}</td>
    <td className="p-3 text-center text-foreground">{facture.nombre_jours}</td>
    <td className="p-3 text-right text-foreground">{formatCurrency(facture.prix_unitaire)}</td>
    <td className="p-3 text-right text-foreground">{facture.tva}%</td>
    <td className="p-3 text-right font-medium text-foreground">
      {formatCurrency(Number(facture.quantite) * Number(facture.nombre_jours) * Number(facture.prix_unitaire))}
    </td>
  </tr>
</tbody>


                 
                </table>
              </div>
            </div>

            <Separator />

            {/* Totaux */}
            <div className="flex justify-end">
              <div className="w-72 space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Sous-total HT</span>
                  <span className="text-foreground">{formatCurrency(facture.sous_total)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">TVA</span>
                  <span className="text-foreground">{formatCurrency(facture.tva)}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-lg font-bold">
                  <span className="text-foreground">Total TTC</span>
                  <span className="text-primary">{formatCurrency(facture.total_ttc)}</span>
                </div>
              </div>
            </div>

          </CardContent>
        </Card>




        {/* Sidebar - Devis d'origine */}

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <FileText className="h-4 w-4 text-primary" />
                  Devis d'origine
                </CardTitle>
              </CardHeader>
              <CardContent>
                <button
                  onClick={() => navigate(`/clients/${clientId}/devis/${facture.devis.id}`)}
                  className="w-full text-left p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                >
                  <p className="font-mono font-medium text-foreground">{facture.devis.numero_devis}</p>
                  <p className="text-sm text-muted-foreground">
                    {format(facture.devis.created_at, 'dd MMM yyyy', { locale: fr })}
                  </p>
                </button>
              </CardContent>
            </Card>
          </div>
      











      </div>
    </div>
  );
};

export default ClientFactureDetail;
