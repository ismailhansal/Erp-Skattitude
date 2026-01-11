import React from 'react';
import { Facture, Client, ConfigurationEntreprise, Devis } from '@/types';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Printer } from 'lucide-react';

interface FacturePrintViewProps {
  facture: Facture;
  client: Client;
  config: ConfigurationEntreprise;
  devisOrigine?: Devis | null;
}

export const FacturePrintView: React.FC<FacturePrintViewProps> = ({ facture, client, config, devisOrigine }) => {
  const formatCurrency = (amount: number) => new Intl.NumberFormat('fr-MA', { style: 'currency', currency: 'MAD' }).format(amount);
  const handlePrint = () => window.print();

  return (
    <div className="space-y-4">
      <div className="flex justify-end print:hidden"><Button onClick={handlePrint}><Printer className="h-4 w-4 mr-2" />Imprimer</Button></div>
      <div className="bg-background p-8 border rounded-lg text-sm print:border-none">
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: config.couleurAccent }}>{config.nomEntreprise}</h1>
            <p>{config.adresse}</p><p>{config.ville}</p><p>{config.telephone1} {config.telephone2 && `/ ${config.telephone2}`}</p>
          </div>
          <div className="text-right">
            <h2 className="text-xl font-bold">FACTURE</h2>
            <p className="font-mono">{facture.numero}</p>
            <p>Date: {format(facture.dateFacturation, 'dd/MM/yyyy', { locale: fr })}</p>
            <p>Échéance: {format(facture.dateEcheance, 'dd/MM/yyyy', { locale: fr })}</p>
          </div>
        </div>
        
        {/* Section Origine - Devis d'origine */}
        {devisOrigine && (
          <div className="mb-6 p-3 border-l-4 bg-muted/20" style={{ borderLeftColor: config.couleurAccent }}>
            <p className="text-sm">
              <span className="font-semibold">Origine:</span> Devis n° <span className="font-mono">{devisOrigine.numero}</span> du {format(devisOrigine.dateCreation, 'dd/MM/yyyy', { locale: fr })}
              {devisOrigine.bonCommande && <> • BC: <span className="font-mono">{devisOrigine.bonCommande}</span></>}
            </p>
          </div>
        )}

        <div className="mb-6 p-4 bg-muted/30 rounded">
          <p className="font-semibold">{client.societe}</p><p>{client.adresse}</p><p>{client.codePostal} {client.ville}</p>
          <p className="font-mono mt-2">ICE: {client.ice}</p>
        </div>
        <table className="w-full border-collapse mb-6">
          <thead><tr className="border-b-2"><th className="text-left p-2">Description</th><th className="text-center p-2">Qté</th><th className="text-center p-2">Jours</th><th className="text-right p-2">P.U.</th><th className="text-right p-2">TVA</th><th className="text-right p-2">Total HT</th></tr></thead>
          <tbody>
            {facture.lignes.map((l) => (
              <tr key={l.id} className="border-b"><td className="p-2">{l.description}</td><td className="text-center p-2">{l.quantiteHotesses}</td><td className="text-center p-2">{l.nombreJours}</td><td className="text-right p-2">{formatCurrency(l.prixUnitaire)}</td><td className="text-right p-2">{l.tva}%</td><td className="text-right p-2">{formatCurrency(l.quantiteHotesses * l.nombreJours * l.prixUnitaire)}</td></tr>
            ))}
          </tbody>
        </table>
        <div className="flex justify-end mb-6">
          <div className="w-64 space-y-1">
            <div className="flex justify-between"><span>Sous-total HT</span><span>{formatCurrency(facture.sousTotal)}</span></div>
            <div className="flex justify-between"><span>TVA</span><span>{formatCurrency(facture.montantTva)}</span></div>
            <div className="flex justify-between font-bold text-lg border-t pt-2"><span>Total TTC</span><span>{formatCurrency(facture.totalTTC)}</span></div>
          </div>
        </div>
        <p className="mb-4"><strong>Condition de règlement:</strong> {facture.conditionReglement}</p>
        <p className="mb-4"><strong>RIB:</strong> {config.rib}</p>
        <div className="text-xs text-muted-foreground border-t pt-4 mt-8"><p>{config.mentionsLegales}</p></div>
      </div>
    </div>
  );
};
