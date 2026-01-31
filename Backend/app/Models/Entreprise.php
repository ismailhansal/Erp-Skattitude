<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Entreprise extends Model
{
    protected $fillable = [
        'nom', 'logo', 'adresse', 'ville', 'telephone_1', 'telephone_2',
        'email', 'ICE', 'RC', 'TVA', 'patente', 'CNSS', 'RIB'
    ];
}
