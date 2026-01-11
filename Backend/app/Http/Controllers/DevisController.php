<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Devis;
use App\Models\Client;
use App\Models\BonLivraison;

class DevisController extends Controller
{
       // Liste tous les devis
    public function index()
    {
        return Devis::with('client')->get();
    }

    // Voir un devis
    public function show($id)
    {
        return Devis::with(['client', 'factures', 'bonLivraison'])->findOrFail($id);
    }

    // Créer un devis
    public function store(Request $request)
    {
        $validated = $request->validate([
            'client_id' => 'required|exists:clients,id',
            'description' => 'required|string',
            'quantite' => 'required|numeric',
            'nombre_jours' => 'required|numeric',
            'prix_unitaire' => 'required|numeric',
            'taxe' => 'nullable|numeric',
            'condition_reglement' => 'required|string',
            'date_evenement' => 'required|date',
            'bon_de_commande' => 'nullable|boolean',
        ]);

        // Calcul des totaux
        $sous_total = $validated['quantite'] * $validated['nombre_jours'] * $validated['prix_unitaire'];
        $tva = isset($validated['taxe']) ? ($sous_total * $validated['taxe'] / 100) : 0;
        $total_ttc = $sous_total + $tva;

        // Numéro auto
        $lastDevis = Devis::latest()->first();
        $numero = $lastDevis ? 'DEV/2026/' . str_pad($lastDevis->id + 1, 4, '0', STR_PAD_LEFT) : 'DEV/2026/0001';

        $devis = Devis::create(array_merge($validated, [
            'numero' => $numero,
            'sous_total' => $sous_total,
            'tva' => $tva,
            'total_ttc' => $total_ttc,
            'status' => 'en_attente',
            'date_devis' => now(),
        ]));

        // Générer le bon de livraison automatiquement
        $bon = BonLivraison::create([
            'devis_id' => $devis->id,
            'description' => $devis->description,
            'quantite' => $devis->quantite,
            'nombre_jours' => $devis->nombre_jours,
            'date_creation' => now(),
        ]);

        return response()->json($devis->load('client', 'bonLivraison'), 201);
    }

    // Modifier un devis
    public function update(Request $request, $id)
    {
        $devis = Devis::findOrFail($id);
        $devis->update($request->all());
        return response()->json($devis);
    }

    // Supprimer un devis
    public function destroy($id)
    {
        $devis = Devis::findOrFail($id);
        $devis->delete();
        return response()->json(['message' => 'Devis supprimé']);
    }
}
