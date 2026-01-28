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
        return Devis::with(['client'])->findOrFail($id);
    }

    public function getByClient($clientId)
{
    // Récupère tous les devis pour ce client
    $devis = Devis::where('client_id', $clientId)->get();
    return response()->json($devis);
}

public function getClientDevis($clientId, $devisId)
{
    // Vérifie que le devis appartient bien au client
    $devis = Devis::where('id', $devisId)
                  ->where('client_id', $clientId)
                  ->firstOrFail();

    return response()->json($devis);
}


public function factures($clientId, $devisId)
{
    // Vérifier que le devis appartient bien au client
    $devis = Devis::where('id', $devisId)
                  ->where('client_id', $clientId)
                  ->first();

    if (!$devis) {
        return response()->json(['message' => 'Devis non trouvé'], 404);
    }

    // Récupérer les factures associées
    $factures = $devis->factures; // si tu as la relation "factures" définie dans le modèle Devis

    return response()->json($factures);
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
            'numero_devis' => $numero,
            'sous_total' => $sous_total,
            'tva' => $tva,
            'total_ttc' => $total_ttc,
            'statut' => 'en_attente',
            'date_devis' => now(),
        ]));

      

        return response()->json($devis->load('client'), 201);
    }

// Créer un devis - version simple

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
