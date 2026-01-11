<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Devis extends Model
{
    use HasFactory;

    protected $fillable = [
        'client_id', 'numero', 'description', 'quantite', 'nombre_jours',
        'prix_unitaire', 'taxe', 'sous_total', 'tva', 'total_ttc',
        'condition_reglement', 'date_evenement'
    ];

    public function client() {
        return $this->belongsTo(Client::class);
    }

    public function factures() {
        return $this->hasMany(Facture::class);
    }

    public function bonLivraison() {
        return $this->hasOne(BonLivraison::class);
    }
}

