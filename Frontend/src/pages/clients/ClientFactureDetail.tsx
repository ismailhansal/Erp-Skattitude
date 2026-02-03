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
import { useToast } from '@/hooks/use-toast';

interface LigneFacture {
  id: number;
  description: string;
  quantite: number;
  nombre_jours: number;
  prix_unitaire: number;
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
  date_facture: string;
  date_echeance: string;
  condition_reglement: string;
  statut: string;
  sous_total: number;
  total_ttc: number;
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
        console.log('FACTURE:', res.data);
        console.log('LIGNES:', res.data.lignes);
      } catch (err) {
        console.error(err);
        setError('Impossible de charger la facture.');
      } finally {
        setLoading(false);
      }
    };
    fetchFacture();
  }, [clientId, factureId]);

  const downloadFacturePDF = () => {
    window.open(
      `http://127.0.0.1:8000/api/factures/${factureId}/pdf`,
      '_blank'
    );
  };

  const handleRelancer = () => {
    if (!facture) return;
    toast({
      title: 'Relance envoyée',
      description: `Une relance a été envoyée à ${facture.client.email}`,
    });
  };

  const handleMarquerPayee = async () => {
    if (!facture) return;
    
    try {
      await axios.put(
        `http://127.0.0.1:8000/api/clients/${clientId}/factures/${factureId}/mark-paid`
      );
      
      toast({
        title: 'Facture marquée comme payée',
        description: `La facture ${facture.numero_facture} a été marquée comme payée.`,
      });
      
      // Recharger la facture pour mettre à jour le statut
      const res = await axios.get<Facture>(
        `http://127.0.0.1:8000/api/clients/${clientId}/factures/${factureId}`
      );
      setFacture(res.data);
      
    } catch (error) {
      console.error('Erreur lors du marquage de la facture:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de marquer la facture comme payée.',
        variant: 'destructive',
      });
    }
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

  const isOverdue = facture.statut !== 'payé' && parseDateSafe(facture.date_echeance) && isBefore(parseDateSafe(facture.date_echeance)!, today);
  const getStatus = () => {
    if (facture.statut === 'payé') return 'paid';
    if (isOverdue) return 'overdue';
    return 'unpaid';
  };

  // Calcul de la TVA
  const tva_calcul = facture.lignes.reduce((acc, ligne) => {
    const totalHT = ligne.quantite * ligne.nombre_jours * ligne.prix_unitaire;
    const tvaMontant = totalHT * (ligne.tva / 100);
    return acc + tvaMontant;
  }, 0);

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title={`Facture ${facture.numero_facture}`}
        description={`Client: ${facture.client.nom_societe} • Émise le ${formatDate(facture.date_facture)}`}
        showBack
        backPath={`/clients/${clientId}/vente`}
        actions={
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" onClick={downloadFacturePDF}>
              <Printer className="h-4 w-4 mr-2" />
              Imprimer Facture
            </Button>

            <Button variant="outline" onClick={() => navigate(`/clients/${clientId}/factures/${factureId}/edit`)}>
              <Edit className="h-4 w-4 mr-2" />
              Modifier
            </Button>

            {facture.statut !== 'payé' && (
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
                    {facture.lignes.length === 0 && (
                      <tr>
                        <td colSpan={6} className="p-4 text-center text-muted-foreground">
                          Aucune ligne de facture
                        </td>
                      </tr>
                    )}

                    {facture.lignes.map((ligne) => {
                      const totalHT = ligne.quantite * ligne.nombre_jours * ligne.prix_unitaire;

                      return (
                        <tr key={ligne.id} className="border-t border-border">
                          <td className="p-3 text-foreground">
                            {ligne.description}
                          </td>
                          <td className="p-3 text-center text-foreground">
                            {ligne.quantite}
                          </td>
                          <td className="p-3 text-center text-foreground">
                            {ligne.nombre_jours}
                          </td>
                          <td className="p-3 text-right text-foreground">
                            {formatCurrency(ligne.prix_unitaire)}
                          </td>
                          <td className="p-3 text-right text-foreground">
                            {ligne.tva}%
                          </td>
                          <td className="p-3 text-right font-medium text-foreground">
                            {formatCurrency(totalHT)}
                          </td>
                        </tr>
                      );
                    })}
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
                  <span className="text-foreground">{formatCurrency(tva_calcul)}</span>
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
        {facture.devis && (
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
                  onClick={() => navigate(`/clients/${clientId}/devis/${facture.devis?.id}`)}
                  className="w-full text-left p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                >
                  <p className="font-mono font-medium text-foreground">{facture.devis.numero_devis}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(facture.devis.created_at)}
                  </p>
                </button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClientFactureDetail;