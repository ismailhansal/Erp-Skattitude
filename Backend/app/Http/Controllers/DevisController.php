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
  public function store(Request $request, $clientId)
{
    // Vérifier que le client existe
    $client = Client::findOrFail($clientId);

    // Validation
    $validated = $request->validate([
        'date_evenement' => 'required|date',
        'condition_reglement' => 'required|string',
        'bon_commande' => 'nullable|string',
        'lignes' => 'required|array|min:1',
        'lignes.*.description' => 'required|string',
        'lignes.*.quantiteHotesses' => 'required|integer|min:1',
        'lignes.*.nombreJours' => 'required|integer|min:1',
        'lignes.*.prixUnitaire' => 'required|numeric|min:0',
        'lignes.*.tva' => 'required|numeric|min:0',
    ]);

    // Générer le numéro du devis
    $year = date('Y');
    $lastDevis = Devis::whereYear('created_at', $year)->latest()->first();
    $nextNumber = $lastDevis ? ($lastDevis->id + 1) : 1;
    $numero_devis = "DEV/{$year}/" . str_pad($nextNumber, 4, '0', STR_PAD_LEFT);

    // Commencer la transaction
    \DB::beginTransaction();
    try {
        // Créer le devis
        $devis = Devis::create([
            'client_id' => $client->id,
            'numero_devis' => $numero_devis,
            'date_evenement' => $validated['date_evenement'],
            'condition_reglement' => $validated['condition_reglement'],
            'bon_commande' => $validated['bon_commande'] ?? null,
            'statut' => 'en_attente',
            'date_devis' => now(),
        ]);

        $sous_total = 0;
        $tva_total = 0;

        // Créer les lignes
        foreach ($validated['lignes'] as $ligne) {
            $ligne_total = $ligne['quantiteHotesses'] * $ligne['nombreJours'] * $ligne['prixUnitaire'];
            $ligne_tva = ($ligne_total * $ligne['tva']) / 100;
            $sous_total += $ligne_total;
            $tva_total += $ligne_tva;

            $devis->lignes()->create([
                'description' => $ligne['description'],
                'quantiteHotesses' => $ligne['quantiteHotesses'],
                'nombreJours' => $ligne['nombreJours'],
                'prixUnitaire' => $ligne['prixUnitaire'],
                'tva' => $ligne['tva'],
            ]);
        }

        // Mettre à jour le total
        $devis->update([
            'sous_total' => $sous_total,
            'tva' => $tva_total,
            'total_ttc' => $sous_total + $tva_total,
        ]);

        \DB::commit();

        return response()->json($devis->load('client', 'lignes'), 201);
    } catch (\Exception $e) {
        \DB::rollBack();
        return response()->json([
            'message' => 'Erreur lors de la création du devis',
            'error' => $e->getMessage()
        ], 500);
    }
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
