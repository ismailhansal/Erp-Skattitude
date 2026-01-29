<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory; // ✅ correct

use Illuminate\Database\Eloquent\Model;

class Devis extends Model
{
       use HasFactory;


    protected $fillable = [
        'client_id', 'numero_devis', 'description', 'quantite', 'nombre_jours',
        'prix_unitaire', 'taxe', 'sous_total', 'tva', 'total_ttc',
        'condition_reglement', 'date_evenement', 'statut'
    ];

    public function client() {
        return $this->belongsTo(Client::class);
    }

    public function factures() {
        return $this->hasOne(Facture::class);
    }

    public function lignes()
{
    return $this->hasMany(DevisLigne::class);
}

    public function bonLivraison() {
        return $this->hasOne(BonLivraison::class);
    }


// Numéro automatique et date par défaut
    protected static function booted()
{
    static::creating(function ($devis) {
        $year = now()->year;

        $last = Devis::whereYear('created_at', $year)
            ->orderBy('id', 'desc')
            ->first();

        $number = $last
            ? intval(substr($last->numero_devis, -4)) + 1
            : 1;

        $devis->numero_devis = 'DEV/'.$year.'/'.str_pad($number, 4, '0', STR_PAD_LEFT);
        $devis->statut = 'en_attente';
    });
}








}

