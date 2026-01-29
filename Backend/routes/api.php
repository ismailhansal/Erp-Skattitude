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
// Tous les devis d'un client spécifique
Route::get('clients/{client}/devis', [App\Http\Controllers\DevisController::class, 'getByClient']);

// Tous les factures d'un client spécifique
Route::get('clients/{client}/factures', [App\Http\Controllers\FactureController::class, 'getByClient']);


// Obtenir un devis précis pour un client précis
Route::get('clients/{client}/devis/{devis}', [App\Http\Controllers\DevisController::class, 'getClientDevis']);

//Obtenir les devis lies aux factures d'un client précis
Route::get('/clients/{client}/devis/{devis}/factures', [DevisController::class, 'factures']);

//R écupérer une facture précise pour un client précis
Route::get('/clients/{client}/factures/{facture}', [FactureController::class, 'getFactureByClient']);


// Créer un devis pour un client spécifique
Route::post('/clients/{client}/devis', [DevisController::class, 'store']);

// Créer une facture à partir d'un devis pour un client spécifique
Route::post('clients/{clientId}/devis/{devisId}/facturer', [FactureController::class, 'storeFromDevis']);
