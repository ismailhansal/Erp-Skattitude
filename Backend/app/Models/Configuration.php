<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Configuration extends Model
{
    use HasFactory;

    protected $fillable = [
        'logo', 'nom_entreprise', 'adresse', 'ville', 'ice',
        'rib', 'rc', 'tva', 'cnss', 'numero_tva',
        'patente', 'telephone1', 'telephone2', 'email'
    ];
}
