import React, { useState, useEffect } from 'react';
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
import { useToast } from '@/hooks/use-toast';

// Types
interface LigneDocument {
  id?: number;
  description: string;
  quantite: number;
  nombreJours: number;
  prixUnitaire: number | '';
  tva: number;
}

interface Client {
  id: number;
  nom_societe: string;
}

interface Devis {
  id: number;
  client_id: number;
  numero_devis: string;
  condition_reglement: string;
  lignes: Array<{
    id: number;
    description: string;
    quantite: number;
    nombre_jours: number;
    prix_unitaire: number;
    tva: number;
  }>;
}

interface Facture {
  id: number;
  client_id: number;
  devis_id?: number;
  numero_facture: string;
  date_facture: string;
  date_echeance: string;
  condition_reglement: string;
  lignes: Array<{
    id: number;
    description: string;
    quantite: number;
    nombre_jours: number;
    prix_unitaire: number;
    tva: number;
  }>;
}

// Utilitaires
const formatDateForInput = (dateString?: string | null): string => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return isNaN(date.getTime()) ? '' : date.toISOString().split('T')[0];
};

const getTodayDate = (): string => new Date().toISOString().split('T')[0];

const ClientFactureForm: React.FC = () => {
  const { clientId, devisId, factureId } = useParams<{ clientId: string; devisId?: string; factureId?: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const isEditFacture = !!factureId;
  const isCreateFromDevis = !!devisId && !factureId;

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [client, setClient] = useState<Client | null>(null);
  const [sourceDevis, setSourceDevis] = useState<Devis | null>(null);

  // Formulaire
  const [dateFacture, setDateFacture] = useState(getTodayDate());
  const [dateEcheance, setDateEcheance] = useState('');
  const [conditionReglement, setConditionReglement] = useState('30 jours fin de mois');
  const [lignes, setLignes] = useState<LigneDocument[]>([
    { description: '', quantite: 1, nombreJours: 1, prixUnitaire: '', tva: 20 }
  ]);

  // Calcul date d'échéance
  useEffect(() => {
    if (!dateFacture) return;
    const date = new Date(dateFacture);
    if (isNaN(date.getTime())) return;

    let joursAjout = 0;

    switch (conditionReglement) {
      case 'À réception': joursAjout = 0; break;
      case '15 jours': joursAjout = 15; break;
      case '30 jours': joursAjout = 30; break;
      case '60 jours': joursAjout = 60; break;
      case '30 jours fin de mois':
        date.setMonth(date.getMonth() + 1);
        date.setDate(0);
        setDateEcheance(date.toISOString().split('T')[0]);
        return;
    }

    date.setDate(date.getDate() + joursAjout);
    setDateEcheance(date.toISOString().split('T')[0]);
  }, [dateFacture, conditionReglement]);

  // Chargement données client / devis / facture
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        // Client
        const clientRes = await fetch(`http://127.0.0.1:8000/api/clients/${clientId}`);
        if (!clientRes.ok) throw new Error('Client non trouvé');
        const clientData: Client = await clientRes.json();
        setClient(clientData);

        if (isEditFacture && factureId) {
          // Facture
          const factureRes = await fetch(`http://127.0.0.1:8000/api/clients/${clientId}/factures/${factureId}`);
          if (!factureRes.ok) throw new Error('Facture non trouvée');
          const factureData: Facture = await factureRes.json();

          setDateFacture(formatDateForInput(factureData.date_facture) || getTodayDate());
          setDateEcheance(formatDateForInput(factureData.date_echeance));
          setConditionReglement(factureData.condition_reglement || '30 jours fin de mois');

          const lignesFacture = factureData.lignes.length
            ? factureData.lignes.map(l => ({
                id: l.id,
                description: String(l.description || ''),
                quantite: Number(l.quantite || 1),
                nombreJours: Number(l.nombre_jours || 1),
                prixUnitaire: Number(l.prix_unitaire || 0),
                tva: Number(l.tva || 20),

              }))
            : [{ description: '', quantite: 1, nombreJours: 1, prixUnitaire: 0, tva: 20 }];
          
          setLignes(lignesFacture);

        } else if (isCreateFromDevis && devisId) {
          // Devis
          const devisRes = await fetch(`http://127.0.0.1:8000/api/clients/${clientId}/devis/${devisId}`);
          if (!devisRes.ok) throw new Error('Devis non trouvé');
          const devisData: Devis = await devisRes.json();

          setSourceDevis(devisData);
          setConditionReglement(devisData.condition_reglement || '30 jours fin de mois');

          const lignesDevis = devisData.lignes.length
            ? devisData.lignes.map(l => ({
                description: String(l.description || ''),
                quantite: Number(l.quantite || 1),
                nombreJours: Number(l.nombre_jours || 1),
                prixUnitaire: Number(l.prix_unitaire || 0),
                tva: Number(l.tva || 20),
              }))
            : [{ description: '', quantite: 1, nombreJours: 1, prixUnitaire: 0, tva: 20 }];
          
          setLignes(lignesDevis);
        }

      } catch (error) {
        toast({ title: 'Erreur', description: error instanceof Error ? error.message : 'Erreur de chargement', variant: 'destructive' });
      } finally {
        setIsLoading(false);
      }
    };

    if (clientId) loadData();
  }, [clientId, devisId, factureId]);

  // Calcul totaux
  const calculateTotals = () => {
    let sousTotal = 0;
    let montantTva = 0;
    lignes.forEach(l => {
      const ligneTotal = (l.quantite || 0) * (l.nombreJours || 0) * (l.prixUnitaire || 0);
      sousTotal += ligneTotal;
      montantTva += (ligneTotal * (l.tva || 0)) / 100;
    });
    return { sousTotal, montantTva, totalTTC: sousTotal + montantTva };
  };
  const { sousTotal, montantTva, totalTTC } = calculateTotals();

  // Gestion lignes
  const addLigne = () => setLignes([...lignes, { description: '', quantite: 1, nombreJours: 1, prixUnitaire: 0, tva: 20 }]);
  const removeLigne = (index: number) => lignes.length > 1 && setLignes(lignes.filter((_, i) => i !== index));
  const updateLigne = (index: number, field: keyof LigneDocument, value: string | number) => {
    const newLignes = [...lignes];
    newLignes[index] = { ...newLignes[index], [field]: value };
    setLignes(newLignes);
  };

  const formatCurrency = (amount: number) => new Intl.NumberFormat('fr-MA', { style: 'currency', currency: 'MAD' }).format(amount || 0);

  const getBackPath = () => isEditFacture ? `/clients/${clientId}/factures/${factureId}` :
    isCreateFromDevis ? `/clients/${clientId}/devis/${devisId}` : `/clients/${clientId}/vente`;

  // Soumission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dateFacture) return toast({ title: 'Erreur', description: 'Veuillez saisir la date de facture.', variant: 'destructive' });

    const invalidLigne = lignes.find(l => !l.description.trim() || l.prixUnitaire <= 0);
    if (invalidLigne) return toast({ title: 'Erreur', description: 'Chaque ligne doit avoir une description et un prix > 0.', variant: 'destructive' });

    setIsSaving(true);
    try {
      const factureData = {
        date_facture: dateFacture,
        date_echeance: dateEcheance || null,
        condition_reglement: conditionReglement,
        lignes: lignes.map(l => ({
          description: l.description.trim(),
          quantite: l.quantite,
          nombre_jours: l.nombreJours,
          prix_unitaire: l.prixUnitaire,
          tva: l.tva,})),
        sous_total: Number(sousTotal.toFixed(2)),
        total_ttc: Number(totalTTC.toFixed(2)),
        montant_tva: Number(montantTva.toFixed(2)),
      };

      let response: Response;
      let successMessage = '';

      if (isEditFacture && factureId) {
        response = await fetch(`http://127.0.0.1:8000/api/clients/${clientId}/factures/${factureId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }, body: JSON.stringify(factureData) });
        successMessage = 'Facture modifiée avec succès';
      } else if (isCreateFromDevis && devisId) {
        response = await fetch(`http://127.0.0.1:8000/api/clients/${clientId}/devis/${devisId}/factures`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }, body: JSON.stringify(factureData) });
        successMessage = 'Facture créée depuis le devis';
      } else {
        response = await fetch(`http://127.0.0.1:8000/api/clients/${clientId}/factures`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }, body: JSON.stringify(factureData) });
        successMessage = 'Facture créée avec succès';
      }

      if (!response.ok) {
        const errorText = await response.text();
        let errorData;
        try { errorData = JSON.parse(errorText); } catch { errorData = { message: errorText }; }
        throw new Error(errorData.message || 'Erreur serveur');
      }

      const result = await response.json();
      toast({ title: 'Succès', description: `${successMessage}. N° ${result.numero_facture || ''}` });
      navigate(isEditFacture ? `/clients/${clientId}/factures/${factureId}` : `/clients/${clientId}/vente`);

    } catch (error) {
      toast({ title: 'Erreur', description: error instanceof Error ? error.message : 'Une erreur est survenue', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return <div className="flex items-center justify-center h-96"><p className="text-muted-foreground">Chargement...</p></div>;
  if (!client) return <div className="flex items-center justify-center h-96"><p className="text-muted-foreground">Client non trouvé</p></div>;

  const getTitle = () => isEditFacture ? 'Modifier la facture' :
    isCreateFromDevis ? `Créer une facture depuis le devis ${sourceDevis?.numero_devis || ''}` : 'Nouvelle facture';

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title={getTitle()} description={`Client: ${client.nom_societe}`} showBack backPath={getBackPath()} />
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            
            <Card>
              <CardHeader>
                <CardTitle>Informations générales</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Client</Label>
                  <Input value={client.nom_societe} disabled className="bg-muted" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dateFacture">Date de facture *</Label>
                  <Input 
                    id="dateFacture" 
                    type="date" 
                    value={dateFacture} 
                    onChange={e => setDateFacture(e.target.value)} 
                  />
                </div>

                

                <div className="space-y-2">
                  <Label htmlFor="dateEcheance">Date d'échéance</Label>
                  <Input 
                    id="dateEcheance" 
                    type="date" 
                    value={dateEcheance} 
                    onChange={e => setDateEcheance(e.target.value)} 
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="conditionReglement">Condition de règlement</Label>
                  <Select value={conditionReglement} onValueChange={setConditionReglement}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
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
                      <span className="font-medium text-sm text-muted-foreground">
                        Ligne {index + 1}
                      </span>
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
                          value={ligne.quantite}
                          onChange={(e) => updateLigne(index, 'quantite', parseInt(e.target.value) || 1)}
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
                          value={ligne.prixUnitaire ?? ""}
                          onChange={(e) =>
                            updateLigne(
                              index,
                              'prixUnitaire',
                              e.target.value === "" ? "" : parseFloat(e.target.value)
                            )
                          }
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
                        {formatCurrency(
                          (Number(ligne.quantite) || 0) * 
                          (Number(ligne.nombreJours) || 0) * 
                          (Number(ligne.prixUnitaire) || 0)
                        )}
                      </span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

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
                    <span>Total TTC</span>
                    <span className="text-primary">{formatCurrency(totalTTC)}</span>
                  </div>
                </div>

                <Separator />
                
                <div className="space-y-2">
                  <Button type="submit" className="w-full" disabled={isSaving}>
                    <Save className="h-4 w-4 mr-2" />
                    {isSaving ? 'Enregistrement...' : isEditFacture ? 'Modifier la facture' : 'Créer la facture'}
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

export default ClientFactureForm;