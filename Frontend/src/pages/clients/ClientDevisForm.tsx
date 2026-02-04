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
import { LigneDocument } from '@/types';
import { useToast } from '@/hooks/use-toast';

const ClientDevisForm: React.FC = () => {
  const { clientId, devisId } = useParams<{ clientId: string; devisId?: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const isEdit = !!devisId;
  const [isLoading, setIsLoading] = useState(false);

  const [client, setClient] = useState<{ id: string; nom_societe: string } | null>(null);

  const [dateEvenement, setDateEvenement] = useState('');
  const [conditionReglement, setConditionReglement] = useState('30 jours fin de mois');
  const [bonCommande, setBonCommande] = useState('');

  const [lignes, setLignes] = useState<Omit<LigneDocument, 'id'>[]>([
    { description: '', quantiteHotesses: 1, nombreJours: 1, prixUnitaire: '', tva: 20 },
  ]);

  /* ================= CLIENT ================= */
  useEffect(() => {
    fetch(`http://127.0.0.1:8000/api/clients/${clientId}`)
      .then(res => res.json())
      .then(setClient)
      .catch(() =>
        toast({
          title: 'Erreur',
          description: 'Impossible de récupérer le client',
          variant: 'destructive',
        })
      );
  }, [clientId, toast]);

  /* ================= DEVIS (EDIT) ================= */
  useEffect(() => {
    if (!isEdit) return;

    fetch(`http://127.0.0.1:8000/api/devis/${devisId}`)
      .then(res => res.json())
      .then(data => {
        setDateEvenement(data.date_evenement);
        setConditionReglement(data.condition_reglement);
        setBonCommande(data.bon_commande || '');
      setLignes(
  data.lignes.map((l: any) => ({
    description: l.description,
    quantiteHotesses: l.quantite,
    nombreJours: l.nombre_jours,
    prixUnitaire: parseFloat(l.prix_unitaire),
    tva: parseFloat(l.tva), // <-- conversion en nombre
  }))
);

      })
      .catch(() =>
        toast({
          title: 'Erreur',
          description: 'Impossible de récupérer le devis',
          variant: 'destructive',
        })
      );
  }, [isEdit, devisId, toast]);

  /* ================= TOTAUX ================= */
  const calculateTotals = () => {
    let sousTotal = 0;
    let montantTva = 0;

    lignes.forEach(l => {
const total =
  (Number(l.quantiteHotesses) || 0) *
  (Number(l.nombreJours) || 0) *
  (Number(l.prixUnitaire) || 0);
      sousTotal += total;
      montantTva += (total * l.tva) / 100;
    });

    return { sousTotal, montantTva, totalTTC: sousTotal + montantTva };
  };

  const { sousTotal, montantTva, totalTTC } = calculateTotals();

  /* ================= LIGNES ================= */
  const addLigne = () =>
    setLignes([...lignes, { description: '', quantiteHotesses: 1, nombreJours: 1, prixUnitaire: 0, tva: 20 }]);

  const removeLigne = (index: number) =>
    lignes.length > 1 && setLignes(lignes.filter((_, i) => i !== index));

  const updateLigne = (index: number, field: any, value: any) => {
    const updated = [...lignes];
    updated[index] = { ...updated[index], [field]: value };
    setLignes(updated);
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('fr-MA', { style: 'currency', currency: 'MAD' }).format(amount);

  const getBackPath = () => `/clients/${clientId}/vente`;

  /* ================= SUBMIT ================= */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const payload = {
        client_id: clientId,
        date_evenement: dateEvenement,
        condition_reglement: conditionReglement,
        bon_commande: bonCommande,
        lignes: lignes.map(l => ({
          description: l.description,
          quantite: l.quantiteHotesses,
          nombre_jours: l.nombreJours,
          prix_unitaire: l.prixUnitaire,
          tva: l.tva,
        })),
        sous_total: sousTotal,
        montant_tva: montantTva,
        total_ttc: totalTTC,
      };

      const url = isEdit
        ? `http://127.0.0.1:8000/api/devis/${devisId}`
        : `http://127.0.0.1:8000/api/clients/${clientId}/devis`;

      await fetch(url, {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      toast({
        title: isEdit ? 'Devis modifié' : 'Devis créé',
        description: 'Opération réussie',
      });

      navigate(getBackPath());
    } catch {
      toast({ title: 'Erreur', description: 'Erreur lors de la sauvegarde', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  if (!client) return null;

  return (
    <div className="space-y-6">
      <PageHeader
        title={isEdit ? 'Modifier le devis' : 'Nouveau devis'}
        description={`Client: ${client.nom_societe}`}
        showBack
        backPath={getBackPath()}
      />

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Informations générales */}
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
                  <Label htmlFor="dateEvenement">Date de l'événement *</Label>
                  <Input id="dateEvenement" type="date" value={dateEvenement} onChange={e => setDateEvenement(e.target.value)} />
                </div>

                <div className="space-y-2">
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

                <div className="space-y-2">
                  <Label htmlFor="bonCommande">Bon de commande (facultatif)</Label>
                  <Input id="bonCommande" value={bonCommande} onChange={e => setBonCommande(e.target.value)} placeholder="N° BC" />
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
  (Number(ligne.quantiteHotesses) || 0) *
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

          {/* Sidebar */}
          <div className="space-y-6">
            <Card className="sticky top-6">
              <CardHeader><CardTitle>Récapitulatif</CardTitle></CardHeader>
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
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    <Save className="h-4 w-4 mr-2" />
                    {isLoading ? 'Création en cours...' : 'Créer le devis'}
                  </Button>
                  <Button type="button" variant="outline" className="w-full" onClick={() => navigate(getBackPath())}>
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
