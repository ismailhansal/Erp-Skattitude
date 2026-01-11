import React from 'react';
import { Devis, Client, ConfigurationEntreprise } from '@/types';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Printer } from 'lucide-react';

interface BonLivraisonPrintViewProps {
  devis: Devis;
  client: Client;
  config: ConfigurationEntreprise;
}

export const BonLivraisonPrintView: React.FC<BonLivraisonPrintViewProps> = ({ devis, client, config }) => {
  const handlePrint = () => window.print();
  const blNumero = `BL/${devis.numero.split('/').slice(1).join('/')}`;

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
            <h2 className="text-xl font-bold">BON DE LIVRAISON</h2>
            <p className="font-mono">{blNumero}</p>
            <p>Date: {format(new Date(), 'dd/MM/yyyy', { locale: fr })}</p>
          </div>
        </div>
        <div className="mb-6 p-4 bg-muted/30 rounded">
          <p className="font-semibold">{client.societe}</p><p>{client.adresse}</p><p>{client.codePostal} {client.ville}</p>
        </div>
        <table className="w-full border-collapse mb-6">
          <thead><tr className="border-b-2"><th className="text-left p-2">Description</th><th className="text-center p-2">Quantité</th><th className="text-center p-2">Jours</th></tr></thead>
          <tbody>
            {devis.lignes.map((l) => (
              <tr key={l.id} className="border-b"><td className="p-2">{l.description}</td><td className="text-center p-2">{l.quantiteHotesses}</td><td className="text-center p-2">{l.nombreJours}</td></tr>
            ))}
          </tbody>
        </table>
        <div className="grid grid-cols-2 gap-8 mt-12">
          <div className="border-t pt-4"><p className="text-center text-xs text-muted-foreground">Signature client</p></div>
          <div className="border-t pt-4"><p className="text-center text-xs text-muted-foreground">Signature {config.nomEntreprise}</p></div>
        </div>
      </div>
    </div>
  );
};
