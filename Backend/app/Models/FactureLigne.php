<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class FactureLigne extends Model
{
    use HasFactory;

    protected $table = 'facture_lignes';

    protected $fillable = [
        'facture_id',
        'description',
        'quantite',
        'nombre_jours',
        'prix_unitaire',
        'tva',
    ];

    // Relation vers la facture
    public function facture()
    {
        return $this->belongsTo(Facture::class);
    }

    // Total HT pour cette ligne
    public function getTotalHtAttribute()
    {
        return $this->quantite * $this->nombre_jours * $this->prix_unitaire;
    }

    // Total TVA pour cette ligne
    public function getTotalTvaAttribute()
    {
        return ($this->total_ht * $this->tva) / 100;
    }

    // Total TTC pour cette ligne
    public function getTotalTtcAttribute()
    {
        return $this->total_ht + $this->total_tva;
    }
}
