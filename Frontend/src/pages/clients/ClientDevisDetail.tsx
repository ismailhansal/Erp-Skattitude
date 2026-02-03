import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  FileText, Calendar, Printer, Edit, Receipt,
  Truck, ArrowLeft
} from 'lucide-react';
import { format, isBefore, isValid, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import axios from 'axios';

import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { StatusBadge } from '@/components/ui/status-badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DevisPrintView } from '@/components/documents/DevisPrintView';
import { BonLivraisonPrintView } from '@/components/documents/BonLivraisonPrintView';







// Fonction utilitaire pour parser les dates en toute sécurité
const parseSafeDate = (dateString: any): Date | null => {
  if (!dateString) return null;
  
  try {
    // Si c'est déjà une Date valide
    if (dateString instanceof Date && isValid(dateString)) {
      return dateString;
    }
    
    // Si c'est une chaîne, essayer de la parser
    if (typeof dateString === 'string') {
      const parsed = parseISO(dateString);
      if (isValid(parsed)) {
        return parsed;
      }
      
      // Fallback : new Date()
      const fallback = new Date(dateString);
      if (isValid(fallback)) {
        return fallback;
      }
    }
    
    return null;
  } catch {
    return null;
  }
};

// Fonction pour formater une date ou retourner un texte par défaut
const formatSafeDate = (date: Date | null, formatStr: string = 'dd MMMM yyyy'): string => {
  if (!date || !isValid(date)) return 'Date non disponible';
  return format(date, formatStr, { locale: fr });
};

const ClientDevisDetail: React.FC = () => {
  const { clientId, devisId } = useParams<{ clientId: string; devisId: string }>();
  const navigate = useNavigate();
  const today = new Date();

  const [devis, setDevis] = useState<any>(null);
  const [client, setClient] = useState<any>(null);
  const [facturesAssociees, setFacturesAssociees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [showDevisPrint, setShowDevisPrint] = useState(false);
  const [showBLPrint, setShowBLPrint] = useState(false);

  const formatCurrency = (amount: number) => {
    const safeAmount = Number(amount) || 0;
    return new Intl.NumberFormat('fr-MA', { style: 'currency', currency: 'MAD' }).format(safeAmount);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const devisRes = await axios.get(`http://127.0.0.1:8000/api/clients/${clientId}/devis/${devisId}`);
        const clientRes = await axios.get(`http://127.0.0.1:8000/api/clients/${clientId}`);
        const facturesRes = await axios.get(`http://127.0.0.1:8000/api/clients/${clientId}/devis/${devisId}/factures`);
        
        console.log('Devis reçu:', devisRes.data);
        console.log('Factures reçues:', facturesRes.data);

        const d = devisRes.data;
        
        // Parser les dates en toute sécurité
        const dateCreation = parseSafeDate(d.created_at) || new Date();
        const dateEvenement = parseSafeDate(d.date_evenement) || new Date();
        
        // Convertir les lignes avec protection complète
        let lignesConverties = [];
        if (d.lignes && Array.isArray(d.lignes) && d.lignes.length > 0) {
          lignesConverties = d.lignes.map((ligne: any) => ({
            id: ligne.id || Math.random(),
            description: String(ligne.description || ''),
            quantiteHotesses: Number(ligne.quantite) || Number(ligne.quantite_hotesses) || 1,
            nombreJours: Number(ligne.nombre_jours) || 1,
            prixUnitaire: Number(ligne.prix_unitaire) || 0,
            tva: Number(ligne.tva) || 20,
          }));
        }

        setDevis({
          ...d,
          dateCreation,
          dateEvenement,
          estFacture: d.statut === 'facturé',
          lignes: lignesConverties,
          sousTotal: Number(d.sous_total) || 0,
          montantTva: Number(d.tva) || 0,
          totalTTC: Number(d.total_ttc) || 0,
        });

        setClient(clientRes.data);

        // Gérer les factures (peut être un objet ou un tableau)
        let facturesData = [];
        if (facturesRes.data) {
          if (Array.isArray(facturesRes.data)) {
            facturesData = facturesRes.data;
          } else if (typeof facturesRes.data === 'object' && facturesRes.data.id) {
            // Si c'est un objet unique avec un id, le transformer en tableau
            facturesData = [facturesRes.data];
          }
        }

        setFacturesAssociees(
          facturesData.map(f => ({
            ...f,
            id: String(f.id || ''),
            date_facture: parseSafeDate(f.date_facture),
            date_echeance: parseSafeDate(f.date_echeance),
            total_ttc: Number(f.total_ttc) || 0,
          }))
        );

        setLoading(false);
      } catch (err) {
        console.error('Erreur chargement devis:', err);
        setLoading(false);
      }
    };

    if (clientId && devisId) {
      fetchData();
    }
  }, [clientId, devisId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <p className="text-muted-foreground">Chargement...</p>
      </div>
    );
  }

  if (!devis || !client) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <p className="text-muted-foreground">Devis non trouvé</p>
        <Button variant="outline" onClick={() => navigate(`/clients/${clientId}/vente`)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour aux ventes
        </Button>
      </div>
    );
  }

  // Vérifier si l'événement est passé (avec protection date valide)
  const isPast = devis.dateEvenement && isValid(devis.dateEvenement) 
    ? isBefore(devis.dateEvenement, today) && !devis.estFacture
    : false;

  const getStatus = () => {
    if (devis.estFacture) return 'invoiced';
    if (isPast) return 'toInvoice';
    return 'pending';
  };

const downloadDevisPDF = () => {
  window.open(
    `http://127.0.0.1:8000/api/devis/${devisId}/pdf`,
    '_blank'
  );
};


  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title={`Devis ${devis.numero_devis || 'N/A'}`}
        description={`Client: ${client.nom_societe || 'N/A'} • Créé le ${formatSafeDate(devis.dateCreation)}`}
        showBack
        backPath={`/clients/${clientId}/vente`}
        actions={
          <div className="flex gap-2 flex-wrap">
            <Dialog open={showBLPrint} onOpenChange={setShowBLPrint}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Truck className="h-4 w-4 mr-2" />
                  Bon de livraison
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto bg-card">
                <DialogHeader>
                  <DialogTitle>Bon de livraison</DialogTitle>
                </DialogHeader>
                <BonLivraisonPrintView devis={devis} client={client} />
              </DialogContent>
            </Dialog>

            <Dialog open={showDevisPrint} onOpenChange={setShowDevisPrint}>
              <Button variant="outline" onClick={downloadDevisPDF}>
  <Printer className="h-4 w-4 mr-2" />
  Télécharger le devis (PDF)
</Button>

      <DialogContent className="max-w-full w-full p-0 overflow-auto bg-transparent print:max-w-full print:p-0">
  <DevisPrintView devis={devis} client={client} />
</DialogContent>


            </Dialog>

            <Button 
              variant="outline" 
              onClick={() => navigate(`/clients/${clientId}/devis/${devisId}/edit`)}
            >
              <Edit className="h-4 w-4 mr-2" />
              Modifier
            </Button>

            {!devis.estFacture && (
              <Button onClick={() => navigate(`/clients/${clientId}/devis/${devisId}/facturer`)}>
                <Receipt className="h-4 w-4 mr-2" />
                Créer facture
              </Button>
            )}
          </div>
        }
      />

      {isPast && (
        <Card className="border-destructive bg-destructive/5">
          <CardContent className="py-4 flex gap-2 items-center text-destructive">
            <Calendar className="h-5 w-5" />
            L'événement est passé. Veuillez facturer ce devis.
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Détails du devis
              </CardTitle>
              <StatusBadge variant={getStatus()} />
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Infos générales */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Numéro</p>
                <p className="font-mono font-medium text-foreground">{devis.numero_devis || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Date de création</p>
                <p className="font-medium text-foreground">{formatSafeDate(devis.dateCreation)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Date de l'événement</p>
                <p className={`font-medium ${isPast ? 'text-destructive' : 'text-foreground'}`}>
                  {formatSafeDate(devis.dateEvenement)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Condition de règlement</p>
                <p className="font-medium text-foreground">{devis.condition_reglement || 'N/A'}</p>
              </div>
              {devis.bon_commande && (
                <div>
                  <p className="text-sm text-muted-foreground">Bon de commande</p>
                  <p className="font-medium text-foreground">{devis.bon_commande}</p>
                </div>
              )}
            </div>

            <Separator />

            {/* Lignes du devis */}
            <div>
              <h4 className="font-medium mb-4 text-foreground">Prestations</h4>
              {devis.lignes && devis.lignes.length > 0 ? (
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
                      {devis.lignes.map((ligne: any, index: number) => {
                        const qte = Number(ligne.quantiteHotesses) || 0;
                        const jours = Number(ligne.nombreJours) || 0;
                        const prix = Number(ligne.prixUnitaire) || 0;
                        const total = qte * jours * prix;

                        return (
                          <tr key={ligne.id || index} className="border-t border-border">
                            <td className="p-3 text-foreground">{ligne.description || 'N/A'}</td>
                            <td className="p-3 text-center text-foreground">{qte}</td>
                            <td className="p-3 text-center text-foreground">{jours}</td>
                            <td className="p-3 text-right text-foreground">{formatCurrency(prix)}</td>
                            <td className="p-3 text-right text-foreground">{ligne.tva || 0}%</td>
                            <td className="p-3 text-right font-medium text-foreground">
                              {formatCurrency(total)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Aucune prestation</p>
              )}
            </div>

            <Separator />

            {/* Totaux */}
            <div className="flex justify-end">
              <div className="w-72 space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Sous-total HT</span>
                  <span className="text-foreground">{formatCurrency(devis.sousTotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">TVA</span>
                  <span className="text-foreground">{formatCurrency(devis.tva)}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-lg font-bold">
                  <span className="text-foreground">Total TTC</span>
                  <span className="text-primary">{formatCurrency(devis.totalTTC)}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sidebar - Factures associées */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Receipt className="h-4 w-4 text-primary" />
                Factures associées
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!facturesAssociees || facturesAssociees.length === 0 ? (
                <p className="text-sm text-muted-foreground">Aucune facture</p>
              ) : (
                <div className="space-y-2">
                  {facturesAssociees.map((facture, index) => (
                    <button
                      key={facture.id || index}
                      onClick={() => navigate(`/clients/${clientId}/factures/${facture.id}`)}
                      className="w-full text-left p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                    >
                      <p className="font-mono font-medium text-foreground">
                        {facture.numero_facture || 'N/A'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {formatCurrency(facture.total_ttc)}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ClientDevisDetail;