<?php

namespace App\Models;
use Illuminate\Database\Eloquent\Factories\HasFactory; // ✅ correct

use Illuminate\Database\Eloquent\Model;

class BonLivraison extends Model
{
    use HasFactory;

    protected $fillable = ['devis_id', 'numero', 'date_creation', 'client_id'];

    public function devis() {
        return $this->belongsTo(Devis::class);
    }

        protected $casts = [
        'date_creation' => 'date',
    ];

    public function client()
    {
        return $this->belongsTo(Client::class);
    }



    protected static function booted()
{
    static::creating(function ($bl) {
        $last = BonLivraison::orderBy('id', 'desc')->first();
        $bl->numero_bl = $last ? $last->numero_bl + 1 : 1;
        $bl->date_creation = now();
    });
}


   
}
