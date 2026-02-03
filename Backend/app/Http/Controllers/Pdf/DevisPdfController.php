<?php

namespace App\Http\Controllers\Pdf;

use App\Http\Controllers\Controller;
use App\Models\Devis;
use App\Models\Entreprise;
use PDF; // ou use Barryvdh\DomPDF\Facade\Pdf;

class DevisPdfController extends Controller
{
    public function download(Devis $devis)
    {
        // Charger les relations du devis
        $devis->load(['client', 'lignes']);

        // Récupérer la configuration de l'entreprise depuis la table
        $config = Entreprise::first(); // si tu as qu’une entreprise

        // Générer le PDF
        $pdf = PDF::loadView('pdf.devis', [
            'devis' => $devis,
            'config' => $config,
            'client' => $devis->client,
        ]);

        // Nettoyer le numéro pour éviter les caractères interdits
        $numeroClean = preg_replace('/[\/\\\\]/', '-', $devis->numero_devis);

        // Télécharger le PDF
        return $pdf->download("devis-{$numeroClean}.pdf");
    }
}
