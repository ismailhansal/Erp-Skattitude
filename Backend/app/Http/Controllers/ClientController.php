<?php

namespace App\Http\Controllers;
use App\Models\Client;
use Illuminate\Http\Request;

class ClientController extends Controller
{
 // Liste tous les clients
    public function index()
    {
        return Client::all();
    }

    // Voir un client
   public function show($id)
{
    try {
        $client = Client::findOrFail($id);
        return response()->json($client); // pas de relations encore
    } catch (\Exception $e) {
        return response()->json(['error' => $e->getMessage()], 500);
    }
}


    // Créer un client
   public function store(Request $request)
{
    $request->validate([
        'nom_societe' => 'required|string',
        'adresse' => 'required|string',
        'ville' => 'required|string',
        'pays' => 'required|string',
        'ice' => 'nullable|string',
        'telephone' => 'required|string',
        'email' => 'required|email',
    ]);

    $client = Client::create($request->only([
        'nom_societe',
        'adresse',
        'ville',
        'pays',
        'ice',
        'telephone',
        'email'
    ]));

    return response()->json($client, 201);
}


    // Modifier un client
    public function update(Request $request, $id)
    {
        $client = Client::findOrFail($id);
        $client->update($request->all());
        return response()->json($client);
    }

    // Supprimer un client
    public function destroy($id)
    {
        $client = Client::findOrFail($id);
        $client->delete();
        return response()->json(['message' => 'Client supprimé']);
    }
}
