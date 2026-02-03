<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Entreprise;
use Illuminate\Http\Request;

class EntrepriseController extends Controller
{
    // GET /api/entreprise - Récupérer la config (un seul enregistrement)
    public function index()
    {
        $entreprise = Entreprise::first();
        
        // Si aucune entreprise n'existe, retourner un objet vide avec structure
        if (!$entreprise) {
            return response()->json([
                'id' => null,
                'nom' => '',
                'logo' => null,
                'adresse' => '',
                'ville' => '',
                'telephone_1' => '',
                'telephone_2' => '',
                'email' => '',
                'ICE' => '',
                'RC' => '',
                'TVA' => '',
                'patente' => '',
                'CNSS' => '',
                'RIB' => '',
                'couleur_accent' => '#3b82f6',
            ]);
        }
        
        return response()->json($entreprise);
    }

    // POST /api/entreprise - Créer ou mettre à jour l'entreprise (un seul enregistrement)
    public function store(Request $request)
    {
        // Validation
        $data = $request->validate([
            'nom' => 'required|string',
            'logo' => 'nullable|string',
            'adresse' => 'nullable|string',
            'ville' => 'nullable|string',
            'telephone_1' => 'nullable|string',
            'telephone_2' => 'nullable|string',
            'email' => 'nullable|email',
            'ICE' => 'nullable|string',
            'RC' => 'nullable|string',
            'TVA' => 'nullable|string',
            'patente' => 'nullable|string',
            'CNSS' => 'nullable|string',
            'RIB' => 'nullable|string',
            'couleur_accent' => 'nullable|string',
        ]);

        // Vérifier si une entreprise existe déjà
        $entreprise = Entreprise::first();
        
        if ($entreprise) {
            // Si elle existe, la mettre à jour
            $entreprise->update($data);
            return response()->json($entreprise, 200);
        } else {
            // Sinon, créer une nouvelle entreprise
            $entreprise = Entreprise::create($data);
            return response()->json($entreprise, 201);
        }
    }

    // PUT /api/entreprise/{id} - Mettre à jour l'entreprise
    public function update(Request $request, $id)
    {
        $entreprise = Entreprise::findOrFail($id);

        $data = $request->validate([
            'nom' => 'sometimes|required|string',
            'logo' => 'nullable|string',
            'adresse' => 'nullable|string',
            'ville' => 'nullable|string',
            'telephone_1' => 'nullable|string',
            'telephone_2' => 'nullable|string',
            'email' => 'nullable|email',
            'ICE' => 'nullable|string',
            'RC' => 'nullable|string',
            'TVA' => 'nullable|string',
            'patente' => 'nullable|string',
            'CNSS' => 'nullable|string',
            'RIB' => 'nullable|string',
            'couleur_accent' => 'nullable|string',
        ]);

        $entreprise->update($data);
        return response()->json($entreprise);
    }

    // DELETE /api/entreprise/{id} - Supprimer l'entreprise
    public function destroy($id)
    {
        $entreprise = Entreprise::findOrFail($id);
        $entreprise->delete();
        return response()->json(['message' => 'Entreprise supprimée avec succès']);
    }
}