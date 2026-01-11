import React, { useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { 
  FileText, 
  Calendar, 
  Building2, 
  Printer, 
  Edit, 
  Receipt,
  Truck,
  ArrowLeft,
  Download
} from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { StatusBadge } from '@/components/ui/status-badge';
import { mockDevis, getClientById, mockConfiguration, mockFactures } from '@/data/mockData';
import { format, isBefore } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DevisPrintView } from '@/components/documents/DevisPrintView';
import { BonLivraisonPrintView } from '@/components/documents/BonLivraisonPrintView';

const DevisDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const today = new Date();
  const [showDevisPrint, setShowDevisPrint] = useState(false);
  const [showBLPrint, setShowBLPrint] = useState(false);

  // Determine back path based on where user came from
  const getBackPath = () => {
    const referrer = location.state?.from;
    if (referrer === 'dashboard') return '/dashboard';
    if (referrer === 'comptabilite') return '/comptabilite';
    if (referrer?.startsWith('/clients/')) return referrer;
    return '/devis';
  };

  const devis = mockDevis.find((d) => d.id === id);
  const client = devis ? getClientById(devis.clientId) : null;
  const facturesAssociees = mockFactures.filter((f) => f.devisId === id);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-MA', {
      style: 'currency',
      currency: 'MAD',
    }).format(amount);
  };

  if (!devis || !client) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <p className="text-muted-foreground">Devis non trouvé</p>
        <Button variant="outline" onClick={() => navigate('/devis')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour aux devis
        </Button>
      </div>
    );
  }

  const isPast = isBefore(devis.dateEvenement, today);
  const getStatus = () => {
    if (devis.estFacture) return 'invoiced';
    if (isPast) return 'toInvoice';
    return 'pending';
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title={`Devis ${devis.numero}`}
        description={`Créé le ${format(devis.dateCreation, 'dd MMMM yyyy', { locale: fr })}`}
        showBack
        backPath={getBackPath()}
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
                <BonLivraisonPrintView 
                  devis={devis} 
                  client={client} 
                  config={mockConfiguration} 
                />
              </DialogContent>
            </Dialog>
            
            <Dialog open={showDevisPrint} onOpenChange={setShowDevisPrint}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Printer className="h-4 w-4 mr-2" />
                  Imprimer
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto bg-card">
                <DialogHeader>
                  <DialogTitle>Aperçu du devis</DialogTitle>
                </DialogHeader>
                <DevisPrintView 
                  devis={devis} 
                  client={client} 
                  config={mockConfiguration} 
                />
              </DialogContent>
            </Dialog>

            <Button 
              variant="outline" 
              onClick={() => navigate(`/devis/${id}/edit`, { state: { from: location.pathname } })}
            >
              <Edit className="h-4 w-4 mr-2" />
              Modifier
            </Button>
            
            {!devis.estFacture && (
              <Button onClick={() => navigate(`/devis/${id}/facturer`, { state: { from: location.pathname } })}>
                <Receipt className="h-4 w-4 mr-2" />
                Créer facture
              </Button>
            )}
          </div>
        }
      />

      {/* Status Alert */}
      {isPast && !devis.estFacture && (
        <Card className="border-destructive bg-destructive/5">
          <CardContent className="py-4">
            <p className="text-destructive font-medium flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              L'événement est passé. Veuillez facturer ce devis.
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
                <FileText className="h-5 w-5 text-primary" />
                Détails du devis
              </CardTitle>
              <StatusBadge variant={getStatus()} />
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Numéro</p>
                <p className="font-mono font-medium text-foreground">{devis.numero}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Date de création</p>
                <p className="font-medium text-foreground">{format(devis.dateCreation, 'dd MMMM yyyy', { locale: fr })}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Date de l'événement</p>
                <p className={`font-medium ${isPast && !devis.estFacture ? 'text-destructive' : 'text-foreground'}`}>
                  {format(devis.dateEvenement, 'dd MMMM yyyy', { locale: fr })}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Condition de règlement</p>
                <p className="font-medium text-foreground">{devis.conditionReglement}</p>
              </div>
              {devis.bonCommande && (
                <div>
                  <p className="text-sm text-muted-foreground">Bon de commande</p>
                  <p className="font-medium text-foreground">{devis.bonCommande}</p>
                </div>
              )}
            </div>

            <Separator />

            {/* Lignes */}
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
                    {devis.lignes.map((ligne) => (
                      <tr key={ligne.id} className="border-t border-border">
                        <td className="p-3 text-foreground">{ligne.description}</td>
                        <td className="p-3 text-center text-foreground">{ligne.quantiteHotesses}</td>
                        <td className="p-3 text-center text-foreground">{ligne.nombreJours}</td>
                        <td className="p-3 text-right text-foreground">{formatCurrency(ligne.prixUnitaire)}</td>
                        <td className="p-3 text-right text-foreground">{ligne.tva}%</td>
                        <td className="p-3 text-right font-medium text-foreground">
                          {formatCurrency(ligne.quantiteHotesses * ligne.nombreJours * ligne.prixUnitaire)}
                        </td>
                      </tr>
                    ))}
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
                  <span className="text-foreground">{formatCurrency(devis.sousTotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">TVA (20%)</span>
                  <span className="text-foreground">{formatCurrency(devis.montantTva)}</span>
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

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Client Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Building2 className="h-4 w-4 text-primary" />
                Client
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <button
                onClick={() => navigate(`/clients/${client.id}`)}
                className="text-lg font-semibold text-primary hover:underline"
              >
                {client.societe}
              </button>
              <div className="text-sm text-muted-foreground space-y-1">
                <p>{client.adresse}</p>
                <p>{client.codePostal} {client.ville}</p>
                <p>{client.pays}</p>
              </div>
              <Separator />
              <div className="text-sm space-y-1 text-foreground">
                <p>{client.telephone}</p>
                <p>{client.email}</p>
              </div>
            </CardContent>
          </Card>

          {/* Factures associées */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Receipt className="h-4 w-4 text-primary" />
                Factures associées
              </CardTitle>
            </CardHeader>
            <CardContent>
              {facturesAssociees.length === 0 ? (
                <p className="text-sm text-muted-foreground">Aucune facture</p>
              ) : (
                <div className="space-y-2">
                  {facturesAssociees.map((facture) => (
                    <button
                      key={facture.id}
                      onClick={() => navigate(`/factures/${facture.id}`, { state: { from: location.pathname } })}
                      className="w-full text-left p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                    >
                      <p className="font-mono font-medium text-foreground">{facture.numero}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatCurrency(facture.totalTTC)}
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

export default DevisDetail;