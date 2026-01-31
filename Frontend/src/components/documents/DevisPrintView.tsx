import React, { useRef } from 'react';
import { Devis, Client } from '@/types';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Printer } from 'lucide-react';
import { useEntreprise } from '@/contexts/EntrepriseContext'; // <- récupération de la config globale

interface DevisPrintViewProps {
  devis: Devis;
  client: Client;
}

export const DevisPrintView: React.FC<DevisPrintViewProps> = ({ devis, client }) => {
  const printRef = useRef<HTMLDivElement>(null);
  const config = useEntreprise(); // récupère automatiquement la config entreprise

  if (!config) return <p>Chargement de la configuration...</p>;

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('fr-MA', { style: 'currency', currency: 'MAD' }).format(amount);

  const handlePrint = () => {
    if (printRef.current) {
      window.print();
    }
  };

  return (
    <div className="space-y-4">
      {/* Bouton Imprimer (caché à l'impression) */}
      <div className="flex justify-end print:hidden">
        <Button onClick={handlePrint}>
          <Printer className="h-4 w-4 mr-2" />Imprimer
        </Button>
      </div>

      {/* Contenu à imprimer */}
      <div ref={printRef} className="bg-background p-8 border rounded-lg text-sm print:border-none">
        {/* Header entreprise et info devis */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: config.couleurAccent }}>
              {config.nomEntreprise}
            </h1>
            <p>{config.adresse}</p>
            <p>{config.ville}</p>
            <p>
              {config.telephone1}
              {config.telephone2 && ` / ${config.telephone2}`}
            </p>
          </div>
          <div className="text-right">
            <h2 className="text-xl font-bold">DEVIS</h2>
            <p className="font-mono">{devis.numero}</p>
            <p>Date: {format(devis.dateCreation, 'dd/MM/yyyy', { locale: fr })}</p>
          </div>
        </div>

        {/* Infos client */}
        <div className="mb-6 p-4 bg-muted/30 rounded">
          <p className="font-semibold">{client.nom_societe}</p>
          <p>{client.adresse}</p>
          <p>
           {client.ville}
          </p>
        </div>

        <p className="mb-4">
          <strong>Date événement:</strong> {format(devis.dateEvenement, 'dd/MM/yyyy', { locale: fr })}
        </p>

        {/* Lignes du devis */}
        <table className="w-full border-collapse mb-6">
          <thead>
            <tr className="border-b-2">
              <th className="text-left p-2">Description</th>
              <th className="text-center p-2">Qté</th>
              <th className="text-center p-2">Jours</th>
              <th className="text-right p-2">P.U.</th>
              <th className="text-right p-2">TVA</th>
              <th className="text-right p-2">Total HT</th>
            </tr>
          </thead>
          <tbody>
            {devis.lignes.map((l) => {
              const totalLigne = l.quantiteHotesses * l.nombreJours * l.prixUnitaire;
              return (
                <tr key={l.id} className="border-b">
                  <td className="p-2">{l.description}</td>
                  <td className="text-center p-2">{l.quantiteHotesses}</td>
                  <td className="text-center p-2">{l.nombreJours}</td>
                  <td className="text-right p-2">{formatCurrency(l.prixUnitaire)}</td>
                  <td className="text-right p-2">{l.tva}%</td>
                  <td className="text-right p-2">{formatCurrency(totalLigne)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Totaux */}
        <div className="flex justify-end mb-6">
          <div className="w-64 space-y-1">
            <div className="flex justify-between">
              <span>Sous-total HT</span>
              <span>{formatCurrency(devis.sousTotal)}</span>
            </div>
            <div className="flex justify-between">
              <span>TVA</span>
              <span>{formatCurrency(devis.montantTva)}</span>
            </div>
            <div className="flex justify-between font-bold text-lg border-t pt-2">
              <span>Total TTC</span>
              <span>{formatCurrency(devis.totalTTC)}</span>
            </div>
          </div>
        </div>

        {/* Conditions de règlement */}
        <p className="mb-4">
          <strong>Condition de règlement:</strong> {devis.conditionReglement}
        </p>

        {/* Mentions légales */}
        <div className="text-xs text-muted-foreground border-t pt-4 mt-8">
          <p>{config.mentionsLegales || "SARL au capital de 100 000 MAD - RC Casablanca 456789 - IF 123456789 - Patente 789654123 - CNSS 1234567"}</p>
        </div>
      </div>
    </div>
  );
};
