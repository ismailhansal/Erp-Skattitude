import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Plus, Trash2, Save } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { mockClients } from '@/data/mockData';
import { format } from 'date-fns';
import { LigneDocument } from '@/types';
import { useToast } from '@/hooks/use-toast';

const ClientDevisForm: React.FC = () => {
  const { clientId, devisId } = useParams<{ clientId: string; devisId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const isEdit = !!devisId;
  const client = mockClients.find(c => c.id === clientId);
  const [isLoading, setIsLoading] = useState(false);

  const [dateEvenement, setDateEvenement] = useState('');
  const [conditionReglement, setConditionReglement] = useState('30 jours fin de mois');
  const [bonCommande, setBonCommande] = useState('');
  const [lignes, setLignes] = useState<Omit<LigneDocument, 'id'>[]>([
    {
      description: '',
      quantiteHotesses: 1,
      nombreJours: 1,
      prixUnitaire: 0,
      tva: 20,
    },
  ]);

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

  const getBackPath = () => {
    return `/clients/${clientId}/vente`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!dateEvenement) {
      toast({
        title: 'Erreur',
        description: 'Veuillez saisir la date de l\'événement.',
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

    setIsLoading(true);

    try {
      // Pour l'instant, on envoie la première ligne comme devis simple
      // À adapter selon vos besoins exacts
          const devisData = {
            client_id: clientId,
            date_evenement: dateEvenement,
            condition_reglement: conditionReglement,
            bon_commande: bonCommande,
            lignes: lignes.map(l => ({
              description: l.description,
              quantite: l.quantiteHotesses, // ou renommer côté frontend en `quantite`
              nombre_jours: l.nombreJours,
              prix_unitaire: l.prixUnitaire,
              tva: l.tva,
            })),
            // Les totaux peuvent être calculés côté backend si tu veux
            sous_total: sousTotal,
            tva: montantTva,
            total_ttc: totalTTC,
          };


      const response = await fetch(`http://127.0.0.1:8000/api/clients/${clientId}/devis`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(devisData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Erreur lors de la création du devis');
      }

      const newDevis = await response.json();

      toast({
        title: 'Devis créé',
        description: `Le devis ${newDevis.numero_devis} a été créé avec succès.`,
      });

      navigate(`/clients/${clientId}/vente`);
    } catch (error) {
      console.error('Erreur lors de la création du devis:', error);
      toast({
        title: 'Erreur',
        description: error instanceof Error ? error.message : 'Une erreur est survenue lors de la création du devis.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!client) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-muted-foreground">Client non trouvé</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title='Nouveau devis'
        description={`Client: ${client.societe}`}
        showBack
        backPath={getBackPath()}
      />

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Dates */}
            <Card>
              <CardHeader>
                <CardTitle>Informations générales</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Client</Label>
                  <Input value={client.societe} disabled className="bg-muted" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dateEvenement">Date de l'événement *</Label>
                  <Input
                    id="dateEvenement"
                    type="date"
                    value={dateEvenement}
                    onChange={(e) => setDateEvenement(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
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

                <div className="space-y-2">
                  <Label htmlFor="bonCommande">Bon de commande (facultatif)</Label>
                  <Input
                    id="bonCommande"
                    value={bonCommande}
                    onChange={(e) => setBonCommande(e.target.value)}
                    placeholder="N° BC"
                  />
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
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    <Save className="h-4 w-4 mr-2" />
                    {isLoading ? 'Création en cours...' : 'Créer le devis'}
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

export default ClientDevisForm;
