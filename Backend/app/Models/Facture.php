<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Facture extends Model
{
    /**
     * Les attributs qui peuvent être assignés en masse.
     * 
     * 🔥 IMPORTANT: NE PAS inclure 'description' ni 'prix_unitaire'
     * Ces champs sont dans la table 'facture_lignes', pas 'factures'
     */
    protected $fillable = [
        'client_id',
        'devis_id',
        'numero_facture',
        'date_facture',
        'date_echeance',
        'condition_reglement',
        'sous_total',
        'total_ttc',
        'statut',
   
    ];

    /**
     * Les attributs qui doivent être castés.
     */
    protected $casts = [
        'date_facture' => 'date',
        'date_echeance' => 'date',
        'date_evenement' => 'date',
        'sous_total' => 'decimal:2',
        'total_ttc' => 'decimal:2',
    ];

    /**
     * Relation avec le client
     */
    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class);
    }

    /**
     * Relation avec le devis (optionnel)
     */
    public function devis(): BelongsTo
    {
        return $this->belongsTo(Devis::class);
    }

    /**
     * Relation avec les lignes de facture
     */
    public function lignes(): HasMany
    {
        return $this->hasMany(FactureLigne::class);
    }
}