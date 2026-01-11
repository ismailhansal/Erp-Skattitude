<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class BonLivraison extends Model
{
    use HasFactory;

    protected $fillable = ['devis_id', 'numero', 'date_creation'];

    public function devis() {
        return $this->belongsTo(Devis::class);
    }
}
