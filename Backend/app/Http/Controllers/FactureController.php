<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Facture;
use App\Models\FactureLigne;
use App\Models\Devis;
use App\Models\Client;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class FactureController extends Controller
{
    /**
     * Liste toutes les factures
     */
    public function index()
    {
        return Facture::with('client', 'devis', 'lignes')->get();
    }

    /**
     * Voir une facture
     */
    public function show($id)
    {
        return Facture::with('client', 'devis', 'lignes')->findOrFail($id);
    }

    /**
     * Récupérer toutes les factures d'un client
     */
    public function getByClient($clientId)
    {
        $factures = Facture::with('lignes')
            ->where('client_id', $clientId)
            ->orderBy('created_at', 'desc')
            ->get();
        
        return response()->json($factures);
    }

    /**
     * Récupérer une facture spécifique d'un client
     */
    public function getFactureByClient($clientId, $factureId)
    {
        $facture = Facture::with('client', 'devis', 'lignes')
            ->where('id', $factureId)
            ->where('client_id', $clientId)
            ->first();

        if (!$facture) {
            return response()->json(['message' => 'Facture non trouvée pour ce client'], 404);
        }

        return response()->json($facture);
    }

    /**
     * 🔥 CRÉER UNE FACTURE DEPUIS UN DEVIS
     * Route: POST /api/clients/{client}/devis/{devis}/facturer
     */
    public function storeFromDevis(Request $request, $clientId, $devisId)
    {
        try {
            // 1. Validation des données
            $validated = $request->validate([
                'date_facture' => 'required|date',
                'date_echeance' => 'nullable|date',
                'condition_reglement' => 'required|string',
                'lignes' => 'required|array|min:1',
                'lignes.*.description' => 'required|string',
                'lignes.*.quantite' => 'required|numeric|min:1',
                'lignes.*.nombre_jours' => 'required|numeric|min:1',
                'lignes.*.prix_unitaire' => 'required|numeric|min:0',
                'lignes.*.tva' => 'required|numeric|min:0',
                'sous_total' => 'required|numeric',
                'total_ttc' => 'required|numeric',
                'montant_tva' => 'required|numeric',

            ]);

            // 2. Vérifier que le devis existe et appartient au client
            $devis = Devis::where('id', $devisId)
                ->where('client_id', $clientId)
                ->firstOrFail();

            // 3. Vérifier que le devis n'est pas déjà facturé
            if ($devis->statut === 'facturé') {
                return response()->json([
                    'message' => 'Ce devis est déjà facturé'
                ], 400);
            }

            DB::beginTransaction();

            try {
                // 4. Générer le numéro de facture
                $numeroFacture = $this->generateNumeroFacture();

                // 5. Créer la facture (SANS description ni prix_unitaire)
                $facture = Facture::create([
                    'client_id' => $clientId,
                    'devis_id' => $devisId,
                    'numero_facture' => $numeroFacture,
                    'date_facture' => $validated['date_facture'],
                    'date_echeance' => $validated['date_echeance'] ?? null,
                    'condition_reglement' => $validated['condition_reglement'],
                    'sous_total' => $validated['sous_total'],
                    'total_ttc' => $validated['total_ttc'],
                    'statut' => 'impayé',
                    'montant_tva' => $validated['montant_tva'],
                ]);

                // 6. Créer les lignes de facture
                foreach ($validated['lignes'] as $ligneData) {
                    FactureLigne::create([
                        'facture_id' => $facture->id,
                        'description' => $ligneData['description'],
                        'quantite' => $ligneData['quantite'],
                        'nombre_jours' => $ligneData['nombre_jours'],
                        'prix_unitaire' => $ligneData['prix_unitaire'],
                        'tva' => $ligneData['tva'],
                    ]);
                }

                // 7. Mettre à jour le statut du devis
                $devis->update(['statut' => 'facturé']);

                DB::commit();

                // 8. Retourner la facture avec ses relations
                return response()->json($facture->load('client', 'lignes', 'devis'), 201);

            } catch (\Exception $e) {
                DB::rollBack();
                Log::error('Erreur création facture depuis devis:', [
                    'error' => $e->getMessage(),
                    'trace' => $e->getTraceAsString()
                ]);
                throw $e;
            }

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'Erreur de validation',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            Log::error('Erreur storeFromDevis:', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'message' => 'Erreur lors de la création de la facture',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * 🔥 CRÉER UNE FACTURE DIRECTE (sans devis)
     * Route: POST /api/clients/{client}/factures
     */
    public function store(Request $request, $clientId)
    {
        try {
            $validated = $request->validate([
                'date_facture' => 'required|date',
                'date_echeance' => 'nullable|date',
                'condition_reglement' => 'required|string',
                'lignes' => 'required|array|min:1',
                'lignes.*.description' => 'required|string',
                'lignes.*.quantite' => 'required|numeric|min:1',
                'lignes.*.nombre_jours' => 'required|numeric|min:1',
                'lignes.*.prix_unitaire' => 'required|numeric|min:0',
                'lignes.*.tva' => 'required|numeric|min:0',
                'sous_total' => 'required|numeric',
                'montant_tva' => 'required|numeric',
                'total_ttc' => 'required|numeric',
            ]);

            DB::beginTransaction();

            try {
                $numeroFacture = $this->generateNumeroFacture();

                $facture = Facture::create([
                    'client_id' => $clientId,
                    'numero_facture' => $numeroFacture,
                    'date_facture' => $validated['date_facture'],
                    'date_echeance' => $validated['date_echeance'] ?? null,
                    'condition_reglement' => $validated['condition_reglement'],
                    'sous_total' => $validated['sous_total'],
                    'montant_tva' => $validated['montant_tva'],
                    'total_ttc' => $validated['total_ttc'],
                    'statut' => 'impayee',
                ]);

                foreach ($validated['lignes'] as $ligneData) {
                    FactureLigne::create([
                        'facture_id' => $facture->id,
                        'description' => $ligneData['description'],
                        'quantite' => $ligneData['quantite'],
                        'nombre_jours' => $ligneData['nombre_jours'],
                        'prix_unitaire' => $ligneData['prix_unitaire'],
                        'tva' => $ligneData['tva'],
                    ]);
                }

                DB::commit();

                return response()->json($facture->load('client', 'lignes'), 201);

            } catch (\Exception $e) {
                DB::rollBack();
                throw $e;
            }

        } catch (\Exception $e) {
            Log::error('Erreur store facture:', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'message' => 'Erreur lors de la création de la facture',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * 🔥 MODIFIER UNE FACTURE
     * Route: PUT /api/clients/{client}/factures/{facture}
     */
    public function update(Request $request, $clientId, $factureId)
    {
        try {
            $facture = Facture::where('id', $factureId)
                ->where('client_id', $clientId)
                ->firstOrFail();

            $validated = $request->validate([
                'date_facture' => 'required|date',
                'date_echeance' => 'nullable|date',
                'condition_reglement' => 'required|string',
                'lignes' => 'required|array|min:1',
                'lignes.*.description' => 'required|string',
                'lignes.*.quantite' => 'required|numeric|min:1',
                'lignes.*.nombre_jours' => 'required|numeric|min:1',
                'lignes.*.prix_unitaire' => 'required|numeric|min:0',
                'lignes.*.tva' => 'required|numeric|min:0',
                'sous_total' => 'required|numeric',
                'total_ttc' => 'required|numeric',
                'montant_tva' => 'required|numeric',
            ]);

            DB::beginTransaction();

            try {
                // Mettre à jour la facture
                $facture->update([
                    'date_facture' => $validated['date_facture'],
                    'date_echeance' => $validated['date_echeance'] ?? null,
                    'condition_reglement' => $validated['condition_reglement'],
                    'sous_total' => $validated['sous_total'],
                    'total_ttc' => $validated['total_ttc'],
                    'montant_tva' => $validated['montant_tva'],
                ]);

                // Supprimer les anciennes lignes
                $facture->lignes()->delete();

                // Créer les nouvelles lignes
                foreach ($validated['lignes'] as $ligneData) {
                    FactureLigne::create([
                        'facture_id' => $facture->id,
                        'description' => $ligneData['description'],
                        'quantite' => $ligneData['quantite'],
                        'nombre_jours' => $ligneData['nombre_jours'],
                        'prix_unitaire' => $ligneData['prix_unitaire'],
                        'tva' => $ligneData['tva'],
                    ]);
                }

                DB::commit();

                return response()->json($facture->load('client', 'lignes'));

            } catch (\Exception $e) {
                DB::rollBack();
                throw $e;
            }

        } catch (\Exception $e) {
            Log::error('Erreur update facture:', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'message' => 'Erreur lors de la modification de la facture',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Supprimer une facture
     */
     public function destroy($clientId, $factureId)
    {
        try {
            // Vérifier que le client existe
            $client = Client::findOrFail($clientId);
            
            // Trouver la facture qui appartient à ce client
            $facture = $client->factures()->findOrFail($factureId);
            
            // Log pour debug
            \Log::info("🗑️ Suppression de la facture ID: {$factureId} du client ID: {$clientId}");
            
            // Supprimer la facture (les lignes liées seront supprimées en cascade si configuré)
            $facture->delete();
            
            \Log::info("✅ Facture supprimée avec succès");
            
            return response()->json([
                'message' => 'Facture supprimée avec succès',
                'facture_id' => $factureId,
                'client_id' => $clientId
            ], 200);
            
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            \Log::error("❌ Facture ou client non trouvé: " . $e->getMessage());
            return response()->json([
                'message' => 'Facture ou client non trouvé',
                'error' => $e->getMessage()
            ], 404);
        } catch (\Exception $e) {
            \Log::error("❌ Erreur lors de la suppression: " . $e->getMessage());
            return response()->json([
                'message' => 'Erreur lors de la suppression de la facture',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Générer un numéro de facture unique
     */
    private function generateNumeroFacture(): string
    {
        $year = date('Y');
        $lastFacture = Facture::whereYear('created_at', $year)
            ->orderBy('id', 'desc')
            ->first();

        $number = $lastFacture ? intval(substr($lastFacture->numero_facture, -4)) + 1 : 1;
        
        return sprintf('FAC/%s/%04d', $year, $number);
    }



    /**
 * Marquer une facture comme payée
 * Route: PUT /api/clients/{client}/factures/{facture}/mark-paid
 */
public function markAsPaid($clientId, $factureId)
{
    try {
        $facture = Facture::where('id', $factureId)
            ->where('client_id', $clientId)
            ->firstOrFail();

        // Vérifier que la facture n'est pas déjà payée
        if ($facture->statut === 'payé') {
            return response()->json([
                'message' => 'Cette facture est déjà marquée comme payée'
            ], 400);
        }

        $facture->update(['statut' => 'payé']);

        return response()->json([
            'message' => 'Facture marquée comme payée',
            'facture' => $facture->load('client', 'lignes', 'devis')
        ]);

    } catch (\Exception $e) {
        Log::error('Erreur markAsPaid:', [
            'error' => $e->getMessage()
        ]);
        
        return response()->json([
            'message' => 'Erreur lors de la mise à jour',
            'error' => $e->getMessage()
        ], 500);
    }
}
}