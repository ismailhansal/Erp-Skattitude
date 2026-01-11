<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Facture extends Model
{
    use HasFactory;

    protected $fillable = [
        'client_id', 'devis_id', 'numero', 'date_facture',
        'date_echeance', 'total_ttc', 'statut'
    ];

    public function client() {
        return $this->belongsTo(Client::class);
    }

    public function devis() {
        return $this->belongsTo(Devis::class);
    }
}
