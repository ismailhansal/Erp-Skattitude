import React, { useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { 
  Receipt, 
  Calendar, 
  Building2, 
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
import { mockFactures, getClientById, mockConfiguration, mockDevis } from '@/data/mockData';
import { format, isBefore } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { FacturePrintView } from '@/components/documents/FacturePrintView';
import { useToast } from '@/hooks/use-toast';

const FactureDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const today = new Date();
  const [showFacturePrint, setShowFacturePrint] = useState(false);

  // Determine back path based on where user came from
  const getBackPath = () => {
    const referrer = location.state?.from;
    if (referrer === 'dashboard') return '/dashboard';
    if (referrer === 'comptabilite') return '/comptabilite';
    if (referrer?.startsWith('/clients/')) return referrer;
    if (referrer?.startsWith('/devis/')) return referrer;
    return '/factures';
  };

  const facture = mockFactures.find((f) => f.id === id);
  const client = facture ? getClientById(facture.clientId) : null;
  const devisOrigine = facture?.devisId ? mockDevis.find((d) => d.id === facture.devisId) : null;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-MA', {
      style: 'currency',
      currency: 'MAD',
    }).format(amount);
  };

  const handleRelancer = () => {
    toast({
      title: 'Relance envoyée',
      description: `Une relance a été envoyée à ${client?.email}`,
    });
  };

  const handleMarquerPayee = () => {
    toast({
      title: 'Facture marquée comme payée',
      description: `La facture ${facture?.numero} a été marquée comme payée.`,
    });
  };

  if (!facture || !client) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <p className="text-muted-foreground">Facture non trouvée</p>
        <Button variant="outline" onClick={() => navigate('/factures')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour aux factures
        </Button>
      </div>
    );
  }

  const isOverdue = !facture.estPayee && isBefore(facture.dateEcheance, today);
  const getStatus = () => {
    if (facture.estPayee) return 'paid';
    if (isOverdue) return 'overdue';
    return 'unpaid';
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title={`Facture ${facture.numero}`}
        description={`Émise le ${format(facture.dateFacturation, 'dd MMMM yyyy', { locale: fr })}`}
        showBack
        backPath={getBackPath()}
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
                  client={client} 
                  config={mockConfiguration}
                  devisOrigine={devisOrigine}
                />
              </DialogContent>
            </Dialog>

            <Button 
              variant="outline" 
              onClick={() => navigate(`/factures/${id}/edit`, { state: { from: location.pathname } })}
            >
              <Edit className="h-4 w-4 mr-2" />
              Modifier
            </Button>
            
            {!facture.estPayee && (
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

      {/* Status Alert */}
      {isOverdue && (
        <Card className="border-destructive bg-destructive/5">
          <CardContent className="py-4">
            <p className="text-destructive font-medium flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Cette facture est en retard de paiement. Échéance: {format(facture.dateEcheance, 'dd MMMM yyyy', { locale: fr })}
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
                <p className="font-mono font-medium text-foreground">{facture.numero}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Date de facturation</p>
                <p className="font-medium text-foreground">{format(facture.dateFacturation, 'dd MMMM yyyy', { locale: fr })}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Date d'échéance</p>
                <p className={`font-medium ${isOverdue ? 'text-destructive' : 'text-foreground'}`}>
                  {format(facture.dateEcheance, 'dd MMMM yyyy', { locale: fr })}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Condition de règlement</p>
                <p className="font-medium text-foreground">{facture.conditionReglement}</p>
              </div>
            </div>

            {/* Section Origine - visible si créée depuis un devis */}
            {devisOrigine && (
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
                        onClick={() => navigate(`/devis/${devisOrigine.id}`, { state: { from: location.pathname } })}
                        className="font-mono font-medium text-primary hover:underline"
                      >
                        {devisOrigine.numero}
                      </button>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Date du devis</p>
                      <p className="font-medium text-foreground">{format(devisOrigine.dateCreation, 'dd MMMM yyyy', { locale: fr })}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Date de l'événement</p>
                      <p className="font-medium text-foreground">{format(devisOrigine.dateEvenement, 'dd MMMM yyyy', { locale: fr })}</p>
                    </div>
                    {devisOrigine.bonCommande && (
                      <div>
                        <p className="text-sm text-muted-foreground">Bon de commande</p>
                        <p className="font-medium text-foreground">{devisOrigine.bonCommande}</p>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

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
                    {facture.lignes.map((ligne) => (
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
                  <span className="text-foreground">{formatCurrency(facture.sousTotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">TVA (20%)</span>
                  <span className="text-foreground">{formatCurrency(facture.montantTva)}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-lg font-bold">
                  <span className="text-foreground">Total TTC</span>
                  <span className="text-primary">{formatCurrency(facture.totalTTC)}</span>
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
              <div>
                <p className="text-sm text-muted-foreground">ICE</p>
                <p className="font-mono text-sm text-foreground">{client.ice}</p>
              </div>
              <Separator />
              <div className="text-sm space-y-1 text-foreground">
                <p>{client.telephone}</p>
                <p>{client.email}</p>
              </div>
            </CardContent>
          </Card>

          {/* Devis d'origine */}
          {devisOrigine && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <FileText className="h-4 w-4 text-primary" />
                  Devis d'origine
                </CardTitle>
              </CardHeader>
              <CardContent>
                <button
                  onClick={() => navigate(`/devis/${devisOrigine.id}`, { state: { from: location.pathname } })}
                  className="w-full text-left p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                >
                  <p className="font-mono font-medium text-foreground">{devisOrigine.numero}</p>
                  <p className="text-sm text-muted-foreground">
                    {format(devisOrigine.dateCreation, 'dd MMM yyyy', { locale: fr })}
                  </p>
                </button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default FactureDetail;