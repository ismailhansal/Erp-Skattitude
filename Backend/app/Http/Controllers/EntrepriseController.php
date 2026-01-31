<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Entreprise;
use Illuminate\Http\Request;

class EntrepriseController extends Controller
{
    // GET /api/entreprise - Récupérer la config
    public function index()
    {
        $entreprise = Entreprise::first();
        return response()->json($entreprise);
    }

    // POST /api/entreprise - Créer une nouvelle entreprise
    public function store(Request $request)
    {
        // Validation minimale
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
        ]);

        $entreprise = Entreprise::create($data);
        return response()->json($entreprise, 201);
    }

    // PUT /api/entreprise/{id} - Mettre à jour une entreprise
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
        ]);

        $entreprise->update($data);
        return response()->json($entreprise);
    }

    // DELETE /api/entreprise/{id} - Supprimer une entreprise
    public function destroy($id)
    {
        $entreprise = Entreprise::findOrFail($id);
        $entreprise->delete();
        return response()->json(['message' => 'Entreprise supprimée avec succès']);
    }
}
