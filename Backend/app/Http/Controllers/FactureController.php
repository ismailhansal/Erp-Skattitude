<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Facture;
use App\Models\Devis;

class FactureController extends Controller
{
     // Liste toutes les factures
    public function index()
    {
        return Facture::with('client', 'devis')->get();
    }

    // Voir une facture
    public function show($id)
    {
        return Facture::with('client', 'devis')->findOrFail($id);
    }

    // Créer une facture directement
    public function store(Request $request)
    {
        $validated = $request->validate([
            'client_id' => 'required|exists:clients,id',
            'devis_id' => 'nullable|exists:devis,id',
            'description' => 'required|string',
            'quantite' => 'required|numeric',
            'nombre_jours' => 'required|numeric',
            'prix_unitaire' => 'required|numeric',
            'taxe' => 'nullable|numeric',
            'condition_reglement' => 'required|string',
            'date_echeance' => 'required|date',
        ]);

        // Calcul des totaux
        $sous_total = $validated['quantite'] * $validated['nombre_jours'] * $validated['prix_unitaire'];
        $tva = isset($validated['taxe']) ? ($sous_total * $validated['taxe'] / 100) : 0;
        $total_ttc = $sous_total + $tva;

        // Numéro auto
        $lastFacture = Facture::latest()->first();
        $numero = $lastFacture ? 'FAC/2026/' . str_pad($lastFacture->id + 1, 4, '0', STR_PAD_LEFT) : 'FAC/2026/0001';

        $facture = Facture::create(array_merge($validated, [
            'numero' => $numero,
            'sous_total' => $sous_total,
            'tva' => $tva,
            'total_ttc' => $total_ttc,
            'status' => 'impayé',
        ]));

        // Si création depuis un devis, mettre à jour statut devis
        if ($request->devis_id) {
            $devis = Devis::find($request->devis_id);
            $devis->status = 'facturé';
            $devis->save();
        }

        return response()->json($facture->load('client', 'devis'), 201);
    }

    // Modifier facture
    public function update(Request $request, $id)
    {
        $facture = Facture::findOrFail($id);
        $facture->update($request->all());
        return response()->json($facture);
    }

    // Supprimer facture
    public function destroy($id)
    {
        $facture = Facture::findOrFail($id);
        $facture->delete();
        return response()->json(['message' => 'Facture supprimée']);
    }
}
