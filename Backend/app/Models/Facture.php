<?php

namespace App\Models;
use Illuminate\Database\Eloquent\Factories\HasFactory; // ✅ correct
use Illuminate\Database\Eloquent\Model;

class Facture extends Model
{
    use HasFactory;

    protected $fillable = [
        'client_id', 'devis_id', 'numero_facture', 'date_facture', 'description',
        'date_echeance', 'statut', 'tva', 'sous_total', 'prix_unitaire', 'total_ttc',
        'condition_reglement', 'date_evenement'
    ];

    protected $casts = [
        'date_echeance' => 'date',
    ];

    public function client() {
        return $this->belongsTo(Client::class);
    }

    public function devis() {
        return $this->belongsTo(Devis::class);
    }




    protected static function booted()
{
    static::creating(function ($facture) {
        $year = now()->year;

        $last = Facture::whereYear('created_at', $year)
            ->orderBy('id', 'desc')
            ->first();

        $number = $last
            ? intval(substr($last->numero_facture, -4)) + 1
            : 1;

        $facture->numero_facture = 'FAC/'.$year.'/'.str_pad($number, 4, '0', STR_PAD_LEFT);
        $facture->statut = 'impayee';
    });
}

}
