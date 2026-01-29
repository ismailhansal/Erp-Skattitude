<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DevisLigne extends Model
{
    use HasFactory;

    protected $fillable = [
        'description', 'quantite', 'nombre_jours', 'prix_unitaire', 'tva'
    ];

    public function devis()
    {
        return $this->belongsTo(Devis::class);
    }
}
