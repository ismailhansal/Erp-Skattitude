<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Hash;
use App\Http\Controllers\ClientController;
use App\Http\Controllers\DevisController;
use App\Http\Controllers\FactureController;
use App\Http\Controllers\BonLivraisonController;
use App\Http\Controllers\EntrepriseController;
use App\Http\Controllers\Pdf\DevisPdfController;
use App\Http\Controllers\Pdf\FacturePdfController;




Route::middleware(['web', 'auth'])->get('/user', function (Request $request) {
    return $request->user();
});

Route::middleware(['web', 'auth'])->group(function () {


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
Route::post('clients/{clientId}/devis/{devisId}/factures', [FactureController::class, 'storeFromDevis']);

// Mettre à jour un devis pour un client spécifique
Route::put('/clients/{client}/devis', [DevisController::class, 'update']);


//R écupérer une facture précise pour un client précis
Route::put('/clients/{client}/factures/{facture}', [FactureController::class, 'update']);



// Routes pour l'entreprise (config)
Route::get('/entreprise', [EntrepriseController::class, 'index']); // Récupérer
Route::post('/entreprise', [EntrepriseController::class, 'store']); // Créer
Route::put('/entreprise/{id}', [EntrepriseController::class, 'update']); // Mettre à jour
Route::delete('/entreprise/{id}', [EntrepriseController::class, 'destroy']);

// Générer et télécharger le PDF d'un devis
Route::get('/devis/{devis}/pdf', [DevisPdfController::class, 'download']);

// Générer et télécharger le PDF d'une facture
Route::get('/factures/{facture}/pdf', [FacturePdfController::class, 'download']);


// Marquer une facture comme payée
Route::put('/clients/{client}/factures/{facture}/mark-paid', [FactureController::class, 'markAsPaid']);

Route::delete('/clients/{client}/devis/{devisId}', [DevisController::class, 'destroy']);

// Supprimer une facture spécifique d'un client
Route::delete('/clients/{client}/factures/{factureId}', [FactureController::class, 'destroy']);

});