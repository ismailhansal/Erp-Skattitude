import React, { useState, useEffect } from 'react';
import { Save, Building2, FileText, Palette, Loader2 } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { entrepriseService, EntrepriseData } from '@/services/entrepriseService';
import logo from '@/assets/logo.png';

interface ConfigState {
  id?: number;
  nomEntreprise: string;
  adresse: string;
  ville: string;
  telephone1: string;
  telephone2: string;
  email: string;
  ice: string;
  rc: string;
  numeroTva: string;
  patente: string;
  cnss: string;
  rib: string;
  mentionsLegales: string;
  couleurAccent: string;
}

const Configuration: React.FC = () => {
  const { toast } = useToast();
  const [config, setConfig] = useState<ConfigState>({
    nomEntreprise: '',
    adresse: '',
    ville: '',
    telephone1: '',
    telephone2: '',
    email: '',
    ice: '',
    rc: '',
    numeroTva: '',
    patente: '',
    cnss: '',
    rib: '',
    mentionsLegales: '',
    couleurAccent: '#3b82f6',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Charger les données au montage du composant
  useEffect(() => {
    loadConfiguration();
  }, []);

  const loadConfiguration = async () => {
    try {
      setLoading(true);
      const data = await entrepriseService.getConfiguration();
      
      // Mapper les données du backend vers le state frontend
      setConfig({
        id: data.id,
        nomEntreprise: data.nom || '',
        adresse: data.adresse || '',
        ville: data.ville || '',
        telephone1: data.telephone_1 || '',
        telephone2: data.telephone_2 || '',
        email: data.email || '',
        ice: data.ICE || '',
        rc: data.RC || '',
        numeroTva: data.TVA || '',
        patente: data.patente || '',
        cnss: data.CNSS || '',
        rib: data.RIB || '',
        mentionsLegales: '',
        couleurAccent: data.couleur_accent || '#3b82f6',
      });
    } catch (error) {
      console.error('Erreur lors du chargement de la configuration:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger la configuration de l\'entreprise.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      // Mapper les données du frontend vers le format backend
      const dataToSave: Partial<EntrepriseData> = {
        nom: config.nomEntreprise,
        adresse: config.adresse,
        ville: config.ville,
        telephone_1: config.telephone1,
        telephone_2: config.telephone2,
        email: config.email,
        ICE: config.ice,
        RC: config.rc,
        TVA: config.numeroTva,
        patente: config.patente,
        CNSS: config.cnss,
        RIB: config.rib,
        couleur_accent: config.couleurAccent,
      };

      // Le backend gère automatiquement la création ou mise à jour
      const result = await entrepriseService.saveEntreprise(dataToSave);
      
      // Mettre à jour l'ID si c'était une création
      if (result.id && !config.id) {
        setConfig(prev => ({ ...prev, id: result.id }));
      }

      toast({
        title: 'Configuration enregistrée',
        description: 'Vos paramètres ont été sauvegardés avec succès.',
      });
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de sauvegarder la configuration.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field: keyof ConfigState, value: string) => {
    setConfig((prev) => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <PageHeader
        title="Configuration"
        description="Paramétrez votre entreprise et vos documents"
        actions={
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Enregistrement...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Enregistrer
              </>
            )}
          </Button>
        }
      />

      <Tabs defaultValue="entreprise" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 max-w-lg">
          <TabsTrigger value="entreprise">
            <Building2 className="h-4 w-4 mr-2" />
            Entreprise
          </TabsTrigger>
          <TabsTrigger value="documents">
            <FileText className="h-4 w-4 mr-2" />
            Documents
          </TabsTrigger>
          <TabsTrigger value="apparence">
            <Palette className="h-4 w-4 mr-2" />
            Apparence
          </TabsTrigger>
        </TabsList>

        <TabsContent value="entreprise">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Informations générales</CardTitle>
                <CardDescription>
                  Ces informations apparaîtront sur vos documents
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4 mb-6">
                  <img
                    src={logo}
                    alt="Logo"
                    className="h-16 w-16 rounded-lg object-contain bg-muted p-2"
                  />
                  <div>
                    <Label>Logo de l'entreprise</Label>
                    <p className="text-sm text-muted-foreground">PNG ou JPG, max 2MB</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="nomEntreprise">Nom de l'entreprise</Label>
                  <Input
                    id="nomEntreprise"
                    value={config.nomEntreprise}
                    onChange={(e) => handleChange('nomEntreprise', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="adresse">Adresse</Label>
                  <Input
                    id="adresse"
                    value={config.adresse}
                    onChange={(e) => handleChange('adresse', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ville">Ville</Label>
                  <Input
                    id="ville"
                    value={config.ville}
                    onChange={(e) => handleChange('ville', e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="telephone1">Téléphone 1</Label>
                    <Input
                      id="telephone1"
                      value={config.telephone1}
                      onChange={(e) => handleChange('telephone1', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="telephone2">Téléphone 2</Label>
                    <Input
                      id="telephone2"
                      value={config.telephone2}
                      onChange={(e) => handleChange('telephone2', e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={config.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Informations légales</CardTitle>
                <CardDescription>
                  Données fiscales et juridiques
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="ice">ICE</Label>
                  <Input
                    id="ice"
                    value={config.ice}
                    onChange={(e) => handleChange('ice', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="rc">Registre de Commerce (RC)</Label>
                  <Input
                    id="rc"
                    value={config.rc}
                    onChange={(e) => handleChange('rc', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="numeroTva">Numéro TVA</Label>
                  <Input
                    id="numeroTva"
                    value={config.numeroTva}
                    onChange={(e) => handleChange('numeroTva', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="patente">Patente</Label>
                  <Input
                    id="patente"
                    value={config.patente}
                    onChange={(e) => handleChange('patente', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cnss">CNSS</Label>
                  <Input
                    id="cnss"
                    value={config.cnss}
                    onChange={(e) => handleChange('cnss', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="rib">RIB Bancaire</Label>
                  <Input
                    id="rib"
                    value={config.rib}
                    onChange={(e) => handleChange('rib', e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="documents">
          <Card>
            <CardHeader>
              <CardTitle>Mentions légales</CardTitle>
              <CardDescription>
                Ces mentions apparaîtront en pied de page de vos documents
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="mentionsLegales">Mentions légales</Label>
                <Textarea
                  id="mentionsLegales"
                  value={config.mentionsLegales}
                  onChange={(e) => handleChange('mentionsLegales', e.target.value)}
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="apparence">
          <Card>
            <CardHeader>
              <CardTitle>Personnalisation</CardTitle>
              <CardDescription>
                Personnalisez l'apparence de vos documents
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="couleurAccent">Couleur d'accentuation</Label>
                <div className="flex items-center gap-4">
                  <Input
                    id="couleurAccent"
                    type="color"
                    value={config.couleurAccent}
                    onChange={(e) => handleChange('couleurAccent', e.target.value)}
                    className="w-20 h-10 p-1 cursor-pointer"
                  />
                  <Input
                    value={config.couleurAccent}
                    onChange={(e) => handleChange('couleurAccent', e.target.value)}
                    className="w-32 font-mono"
                  />
                  <div
                    className="w-10 h-10 rounded-lg border"
                    style={{ backgroundColor: config.couleurAccent }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Configuration;