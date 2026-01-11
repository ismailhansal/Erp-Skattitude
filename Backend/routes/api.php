<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\ClientController;
use App\Http\Controllers\DevisController;
use App\Http\Controllers\FactureController;
use App\Http\Controllers\BonLivraisonController;

// Exemple utilisateur authentifié (resté par défaut)
Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

// --- Routes API pour Skattitude ---

// CRUD Clients
Route::apiResource('clients', ClientController::class);

// CRUD Devis
Route::apiResource('devis', DevisController::class);

// CRUD Factures
Route::apiResource('factures', FactureController::class);

// CRUD Bon de livraison
Route::apiResource('bon-livraisons', BonLivraisonController::class);

// Création facture depuis un devis
Route::post('devis/{devis}/facture', [FactureController::class, 'store']);
