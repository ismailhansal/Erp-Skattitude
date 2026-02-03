<?php

namespace App\Http\Controllers\Pdf;

use App\Http\Controllers\Controller;
use App\Models\Facture;
use App\Models\Entreprise;
use PDF;

class FacturePdfController extends Controller
{
    public function download(Facture $facture)
    {
        // Charger les relations de la facture (y compris le devis)
        $facture->load(['client', 'lignes', 'devis']);

        // Récupérer la configuration de l'entreprise depuis la table
        $config = Entreprise::first();

        // Générer le PDF
        $pdf = PDF::loadView('pdf.facture', [
            'facture' => $facture,
            'config' => $config,
            'client' => $facture->client,
            'devis' => $facture->devis, // Passer le devis à la vue
        ]);

        // Nettoyer le numéro pour éviter les caractères interdits
        $numeroClean = preg_replace('/[\/\\\\]/', '-', $facture->numero_facture);

        // Télécharger le PDF
        return $pdf->download("facture-{$numeroClean}.pdf");
    }
}