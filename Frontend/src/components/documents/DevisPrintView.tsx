import React, { useRef } from 'react';
import { Devis, Client } from '@/types';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Printer } from 'lucide-react';
import { useEntreprise } from '@/contexts/EntrepriseContext';

interface DevisPrintViewProps {
  devis: Devis;
  client: Client;
}

export const DevisPrintView: React.FC<DevisPrintViewProps> = ({ devis, client }) => {
  const printRef = useRef<HTMLDivElement>(null);
  const config = useEntreprise();

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
      {/* Bouton Imprimer */}
      <div className="flex justify-end print:hidden">
        <Button onClick={handlePrint}>
          <Printer className="h-4 w-4 mr-2" />Imprimer
        </Button>
      </div>

      {/* Contenu à imprimer */}
      <div 
        ref={printRef} 
        className="
          bg-background p-4 border rounded-lg text-sm 
          print:p-0 print:border-none print:bg-white
          print:w-full print:max-w-none print:text-black
        "
      >
        {/* Header entreprise et info devis */}
        <div className="flex justify-between items-start mb-6 print:mb-4">
          <div className="space-y-1">
            <h1 
              className="text-2xl font-bold" 
              style={{ color: config.couleurAccent }}
            >
              {config.nomEntreprise}
            </h1>
            <div className="text-sm leading-tight">
              <p className="font-medium">{config.adresse || 'Adresse non définie'}</p>
              <p>{config.ville || 'Ville non définie'}</p>
              <p>
                {config.telephone_1 || 'Téléphone non défini'}
                {config.telephone_2 && ` / ${config.telephone_2}`}
              </p>
            </div>
          </div>
          
          <div className="text-right space-y-1">
            <h2 className="text-xl font-bold print:text-2xl">DEVIS</h2>
            <p className="font-mono text-lg print:text-xl">{devis.numero}</p>
            <p className="font-medium">Date: {format(devis.dateCreation, 'dd/MM/yyyy', { locale: fr })}</p>
          </div>
        </div>

        {/* Infos client */}
        <div className="mb-4 p-3 bg-muted/30 rounded print:border print:p-2 print:bg-white print:border-gray-300">
          <p className="font-semibold mb-1">{client.nom_societe}</p>
          <p>{client.adresse}</p>
          <p>{client.ville}</p>
        </div>

        <p className="mb-3 print:mb-2">
          <strong>Date événement:</strong> {format(devis.dateEvenement, 'dd/MM/yyyy', { locale: fr })}
        </p>

        {/* Lignes du devis */}
        <table className="w-full border-collapse mb-4 print:mb-3">
          <thead>
            <tr className="border-b-2 border-black print:border-gray-800">
              <th className="text-left p-2 print:p-1">Description</th>
              <th className="text-center p-2 print:p-1">Qté</th>
              <th className="text-center p-2 print:p-1">Jours</th>
              <th className="text-right p-2 print:p-1">P.U.</th>
              <th className="text-right p-2 print:p-1">TVA</th>
              <th className="text-right p-2 print:p-1">Total HT</th>
            </tr>
          </thead>
          <tbody>
            {devis.lignes.map((l) => {
              const totalLigne = l.quantiteHotesses * l.nombreJours * l.prixUnitaire;
              return (
                <tr key={l.id} className="border-b print:border-gray-400">
                  <td className="p-2 print:p-1">{l.description}</td>
                  <td className="text-center p-2 print:p-1">{l.quantiteHotesses}</td>
                  <td className="text-center p-2 print:p-1">{l.nombreJours}</td>
                  <td className="text-right p-2 print:p-1">{formatCurrency(l.prixUnitaire)}</td>
                  <td className="text-right p-2 print:p-1">{l.tva}%</td>
                  <td className="text-right p-2 print:p-1">{formatCurrency(totalLigne)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Totaux */}
        <div className="flex justify-end mb-4 print:mb-3">
          <div className="w-64 space-y-1 print:w-56">
            <div className="flex justify-between">
              <span>Sous-total HT</span>
              <span>{formatCurrency(devis.sousTotal)}</span>
            </div>
            <div className="flex justify-between">
              <span>TVA</span>
              <span>{formatCurrency(devis.montantTva)}</span>
            </div>
            <div className="flex justify-between font-bold text-lg border-t pt-2 print:pt-1 print:border-gray-800">
              <span>Total TTC</span>
              <span>{formatCurrency(devis.totalTTC)}</span>
            </div>
          </div>
        </div>

        {/* Conditions de règlement */}
        <p className="mb-3 print:mb-2">
          <strong>Condition de règlement:</strong> {devis.conditionReglement}
        </p>

        {/* Mentions légales */}
        <div className="text-xs text-muted-foreground border-t pt-3 mt-6 print:pt-2 print:mt-4 print:border-gray-400 print:text-gray-800">
          <p>{config.mentionsLegales || "SARL au capital de 100 000 MAD - RC Casablanca 456789 - IF 123456789 - Patente 789654123 - CNSS 1234567"}</p>
        </div>
      </div>
    </div>
  );
};