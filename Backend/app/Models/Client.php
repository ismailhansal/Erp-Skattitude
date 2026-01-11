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

    // user_id sera automatiquement rempli
    
}

