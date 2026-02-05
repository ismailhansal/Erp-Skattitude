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
import { useEntrepriseContext } from '@/contexts/EntrepriseContext';
import api from '@/lib/axios';
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
  const { config: entrepriseConfig, loading: loadingContext, reloadConfig } = useEntrepriseContext();
  
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
    couleurAccent: '#a06464',
  });
  const [saving, setSaving] = useState(false);

  // Charger les données depuis le contexte
  useEffect(() => {
    if (entrepriseConfig) {
      setConfig({
        id: entrepriseConfig.id,
        nomEntreprise: entrepriseConfig.nom || '',
        adresse: entrepriseConfig.adresse || '',
        ville: entrepriseConfig.ville || '',
        telephone1: entrepriseConfig.telephone_1 || '',
        telephone2: entrepriseConfig.telephone_2 || '',
        email: entrepriseConfig.email || '',
        ice: entrepriseConfig.ICE || '',
        rc: entrepriseConfig.RC || '',
        numeroTva: entrepriseConfig.TVA || '',
        patente: entrepriseConfig.patente || '',
        cnss: entrepriseConfig.CNSS || '',
        rib: entrepriseConfig.RIB || '',
        mentionsLegales: entrepriseConfig.mentions_legales || '',
        couleurAccent: entrepriseConfig.couleur_accent || '#a06464',
      });
    }
  }, [entrepriseConfig]);

  const handleSave = async () => {
    try {
      setSaving(true);

      // Mapper les données frontend → backend
      const dataToSave = {
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
        mentions_legales: config.mentionsLegales,
        couleur_accent: config.couleurAccent,
      };

      if (config.id) {
        // Mise à jour
        await api.put(`/api/entreprise/${config.id}`, dataToSave);
      } else {
        // Création
        const response = await api.post('/api/entreprise', dataToSave);
        setConfig(prev => ({ ...prev, id: response.data.id }));
      }

      // Recharger la config dans le contexte (va appliquer la couleur automatiquement)
      await reloadConfig();

      toast({
        title: 'Configuration enregistrée',
        description: 'Vos paramètres ont été sauvegardés avec succès.',
      });
    } catch (error: any) {
      console.error('Erreur lors de la sauvegarde:', error);
      toast({
        title: 'Erreur',
        description: error.response?.data?.message || 'Impossible de sauvegarder la configuration.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field: keyof ConfigState, value: string) => {
    setConfig((prev) => ({ ...prev, [field]: value }));

    // Aperçu en temps réel de la couleur (sans sauvegarder)
    if (field === 'couleurAccent') {
      // Conversion HEX → HSL pour Tailwind
      const hexToHSL = (hex: string): string => {
        hex = hex.replace('#', '');
        const r = parseInt(hex.substring(0, 2), 16) / 255;
        const g = parseInt(hex.substring(2, 4), 16) / 255;
        const b = parseInt(hex.substring(4, 6), 16) / 255;
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        let h = 0, s = 0, l = (max + min) / 2;
        if (max !== min) {
          const d = max - min;
          s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
          switch (max) {
            case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
            case g: h = ((b - r) / d + 2) / 6; break;
            case b: h = ((r - g) / d + 4) / 6; break;
          }
        }
        h = Math.round(h * 360);
        s = Math.round(s * 100);
        l = Math.round(l * 100);
        return `${h} ${s}% ${l}%`;
      };

      try {
        const hsl = hexToHSL(value);
        document.documentElement.style.setProperty('--primary', hsl);
      } catch (error) {
        console.error('Erreur conversion couleur:', error);
      }
    }
  };

  if (loadingContext) {
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
                Personnalisez l'apparence de votre application et de vos documents
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="couleurAccent">Couleur principale</Label>
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
                    placeholder="#a06464"
                  />
                  <div
                    className="w-10 h-10 rounded-lg border"
                    style={{ backgroundColor: config.couleurAccent }}
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  Cette couleur sera appliquée aux boutons, liens et éléments interactifs
                </p>
              </div>

              {/* Aperçu */}
              <div className="p-4 border rounded-lg space-y-4 bg-muted/30">
                <p className="font-semibold">Aperçu :</p>
                <div className="space-x-2">
                  <Button>Bouton principal</Button>
                  <Button variant="outline">Bouton secondaire</Button>
                  <Button variant="ghost">Bouton tertiaire</Button>
                </div>
                <p>
                  Exemple de <span className="text-primary font-semibold">texte coloré</span> avec la couleur principale.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Configuration;