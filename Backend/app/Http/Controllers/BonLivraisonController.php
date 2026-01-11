<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\BonLivraison;

class BonLivraisonController extends Controller
{
  public function index()
    {
        return BonLivraison::with('devis', 'client')->get();
    }

    public function show($id)
    {
        return BonLivraison::with('devis', 'client')->findOrFail($id);
    }

    public function destroy($id)
    {
        $bl = BonLivraison::findOrFail($id);
        $bl->delete();
        return response()->json(['message' => 'Bon de livraison supprimé']);
    }
}
