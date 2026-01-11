import React, { useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Plus, Trash2, Save } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { mockFactures, mockClients, mockDevis, getClientById } from '@/data/mockData';
import { format, addDays } from 'date-fns';
import { LigneDocument } from '@/types';
import { useToast } from '@/hooks/use-toast';

const generateFactureNumber = () => {
  const year = new Date().getFullYear();
  const nextNumber = mockFactures.length + 1;
  return `FAC/${year}/${String(nextNumber).padStart(4, '0')}`;
};

const FactureForm: React.FC = () => {
  const { id, devisId } = useParams<{ id: string; devisId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  
  const isEdit = id && id !== 'nouveau';
  const isFromDevis = !!devisId;
  
  const existingFacture = isEdit ? mockFactures.find((f) => f.id === id) : null;
  const sourceDevis = isFromDevis ? mockDevis.find((d) => d.id === devisId) : null;
  const sourceClient = sourceDevis ? getClientById(sourceDevis.clientId) : null;

  // Determine back path
  const getBackPath = () => {
    const referrer = location.state?.from;
    // If editing, go back to the detail page
    if (isEdit && referrer) {
      return referrer;
    }
    if (isEdit) {
      return `/factures/${id}`;
    }
    // If creating from devis
    if (isFromDevis) {
      return `/devis/${devisId}`;
    }
    return '/factures';
  };

  const [clientId, setClientId] = useState(
    existingFacture?.clientId || sourceDevis?.clientId || ''
  );
  const [dateFacturation, setDateFacturation] = useState(
    existingFacture 
      ? format(existingFacture.dateFacturation, 'yyyy-MM-dd') 
      : format(new Date(), 'yyyy-MM-dd')
  );
  const [dateEcheance, setDateEcheance] = useState(
    existingFacture 
      ? format(existingFacture.dateEcheance, 'yyyy-MM-dd') 
      : format(addDays(new Date(), 30), 'yyyy-MM-dd')
  );
  const [conditionReglement, setConditionReglement] = useState(
    existingFacture?.conditionReglement || sourceDevis?.conditionReglement || '30 jours fin de mois'
  );
  const [lignes, setLignes] = useState<Omit<LigneDocument, 'id'>[]>(
    existingFacture?.lignes.map(l => ({
      description: l.description,
      quantiteHotesses: l.quantiteHotesses,
      nombreJours: l.nombreJours,
      prixUnitaire: l.prixUnitaire,
      tva: l.tva,
    })) || 
    sourceDevis?.lignes.map(l => ({
      description: l.description,
      quantiteHotesses: l.quantiteHotesses,
      nombreJours: l.nombreJours,
      prixUnitaire: l.prixUnitaire,
      tva: l.tva,
    })) || [
      {
        description: '',
        quantiteHotesses: 1,
        nombreJours: 1,
        prixUnitaire: 0,
        tva: 20,
      },
    ]
  );

  const selectedClient = mockClients.find(c => c.id === clientId);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-MA', {
      style: 'currency',
      currency: 'MAD',
    }).format(amount);
  };

  const addLigne = () => {
    setLignes([
      ...lignes,
      {
        description: '',
        quantiteHotesses: 1,
        nombreJours: 1,
        prixUnitaire: 0,
        tva: 20,
      },
    ]);
  };

  const removeLigne = (index: number) => {
    if (lignes.length > 1) {
      setLignes(lignes.filter((_, i) => i !== index));
    }
  };

  const updateLigne = (index: number, field: keyof Omit<LigneDocument, 'id'>, value: string | number) => {
    const newLignes = [...lignes];
    newLignes[index] = {
      ...newLignes[index],
      [field]: value,
    };
    setLignes(newLignes);
  };

  const calculateTotals = () => {
    let sousTotal = 0;
    let montantTva = 0;

    lignes.forEach((ligne) => {
      const ligneTotal = ligne.quantiteHotesses * ligne.nombreJours * ligne.prixUnitaire;
      sousTotal += ligneTotal;
      montantTva += (ligneTotal * ligne.tva) / 100;
    });

    return {
      sousTotal,
      montantTva,
      totalTTC: sousTotal + montantTva,
    };
  };

  const { sousTotal, montantTva, totalTTC } = calculateTotals();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!clientId) {
      toast({
        title: 'Erreur',
        description: 'Veuillez sélectionner un client.',
        variant: 'destructive',
      });
      return;
    }

    if (!dateFacturation || !dateEcheance) {
      toast({
        title: 'Erreur',
        description: 'Veuillez saisir les dates de facturation et d\'échéance.',
        variant: 'destructive',
      });
      return;
    }

    const invalidLigne = lignes.find(l => !l.description || l.prixUnitaire <= 0);
    if (invalidLigne) {
      toast({
        title: 'Erreur',
        description: 'Veuillez remplir correctement toutes les lignes.',
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: isEdit ? 'Facture modifiée' : 'Facture créée',
      description: isEdit 
        ? `La facture ${existingFacture?.numero} a été modifiée.`
        : `La facture ${generateFactureNumber()} a été créée.`,
    });

    // Navigate back to detail page if editing, otherwise to factures list
    if (isEdit) {
      navigate(`/factures/${id}`);
    } else {
      navigate('/factures');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title={
          isEdit 
            ? `Modifier ${existingFacture?.numero}` 
            : isFromDevis 
              ? `Facturer ${sourceDevis?.numero}`
              : 'Nouvelle facture'
        }
        description={
          isEdit 
            ? 'Modifier les informations de la facture' 
            : isFromDevis
              ? 'Créer une facture à partir du devis'
              : 'Créer une nouvelle facture'
        }
        showBack
        backPath={getBackPath()}
      />

      {/* Devis source info */}
      {sourceDevis && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="py-4">
            <p className="text-sm text-foreground">
              <span className="text-muted-foreground">Facture basée sur le devis: </span>
              <span className="font-mono font-medium">{sourceDevis.numero}</span>
              <span className="text-muted-foreground"> du </span>
              <span className="font-medium">{format(sourceDevis.dateCreation, 'dd/MM/yyyy')}</span>
            </p>
          </CardContent>
        </Card>
      )}

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Client & Dates */}
            <Card>
              <CardHeader>
                <CardTitle>Informations générales</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="client">Client *</Label>
                  <Select value={clientId} onValueChange={setClientId} disabled={isFromDevis}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un client" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-border">
                      {mockClients.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.societe}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedClient && (
                  <div className="space-y-2">
                    <Label>ICE Client</Label>
                    <Input value={selectedClient.ice} disabled className="font-mono bg-muted" />
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="dateFacturation">Date de facturation *</Label>
                  <Input
                    id="dateFacturation"
                    type="date"
                    value={dateFacturation}
                    onChange={(e) => setDateFacturation(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dateEcheance">Date d'échéance *</Label>
                  <Input
                    id="dateEcheance"
                    type="date"
                    value={dateEcheance}
                    onChange={(e) => setDateEcheance(e.target.value)}
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="conditionReglement">Condition de règlement</Label>
                  <Select value={conditionReglement} onValueChange={setConditionReglement}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-border">
                      <SelectItem value="À réception">À réception</SelectItem>
                      <SelectItem value="15 jours">15 jours</SelectItem>
                      <SelectItem value="30 jours">30 jours</SelectItem>
                      <SelectItem value="30 jours fin de mois">30 jours fin de mois</SelectItem>
                      <SelectItem value="60 jours">60 jours</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Lignes */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Prestations</CardTitle>
                <Button type="button" variant="outline" size="sm" onClick={addLigne}>
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter une ligne
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {lignes.map((ligne, index) => (
                  <div key={index} className="p-4 border border-border rounded-lg space-y-4 bg-muted/30">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm text-muted-foreground">Ligne {index + 1}</span>
                      {lignes.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeLigne(index)}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label>Description *</Label>
                      <Textarea
                        value={ligne.description}
                        onChange={(e) => updateLigne(index, 'description', e.target.value)}
                        placeholder="Description de la prestation"
                        rows={2}
                      />
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="space-y-2">
                        <Label>Quantité hôtes/hôtesses</Label>
                        <Input
                          type="number"
                          min="1"
                          value={ligne.quantiteHotesses}
                          onChange={(e) => updateLigne(index, 'quantiteHotesses', parseInt(e.target.value) || 1)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Nombre de jours</Label>
                        <Input
                          type="number"
                          min="1"
                          value={ligne.nombreJours}
                          onChange={(e) => updateLigne(index, 'nombreJours', parseInt(e.target.value) || 1)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Prix unitaire (MAD)</Label>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={ligne.prixUnitaire}
                          onChange={(e) => updateLigne(index, 'prixUnitaire', parseFloat(e.target.value) || 0)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>TVA</Label>
                        <Select 
                          value={String(ligne.tva)} 
                          onValueChange={(v) => updateLigne(index, 'tva', parseInt(v))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-popover border-border">
                            <SelectItem value="0">0%</SelectItem>
                            <SelectItem value="20">20%</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-sm text-muted-foreground">Total ligne: </span>
                      <span className="font-semibold text-foreground">
                        {formatCurrency(ligne.quantiteHotesses * ligne.nombreJours * ligne.prixUnitaire)}
                      </span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar - Totaux */}
          <div className="space-y-6">
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle>Récapitulatif</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Sous-total HT</span>
                    <span className="text-foreground">{formatCurrency(sousTotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">TVA</span>
                    <span className="text-foreground">{formatCurrency(montantTva)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-bold text-lg">
                    <span className="text-foreground">Total TTC</span>
                    <span className="text-primary">{formatCurrency(totalTTC)}</span>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Button type="submit" className="w-full">
                    <Save className="h-4 w-4 mr-2" />
                    {isEdit ? 'Enregistrer' : 'Créer la facture'}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="w-full"
                    onClick={() => navigate(getBackPath())}
                  >
                    Annuler
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
};

export default FactureForm;