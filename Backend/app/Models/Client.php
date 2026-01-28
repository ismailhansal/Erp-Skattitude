<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Client extends Model
{
    protected $fillable = [
        'nom_societe',
        'adresse',
        'ville',
        'pays',
        'ice',
        'telephone',
        'email'
    ];


    public function devis()
    {
        return $this->hasMany(Devis::class);
    }

    public function factures()
    {
        return $this->hasMany(Facture::class);
    }

    public function bonsLivraison()
    {
        return $this->hasMany(BonLivraison::class);
    }

    
}

