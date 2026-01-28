<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('factures', function (Blueprint $table) {
            $table->id();
            $table->string('numero')->unique(); // FAC/2026/0001
            $table->foreignId('client_id')->constrained()->onDelete('cascade');
            $table->foreignId('devis_id')->nullable()->constrained()->onDelete('set null');
            $table->date('date_facture'); // date création
            $table->date('date_echeance');
            $table->text('description');
            $table->integer('quantite')->default(1);
            $table->integer('nombre_jours')->default(1);
            $table->decimal('prix_unitaire', 10, 2);
            $table->decimal('tva', 10, 2)->default(0);
            $table->decimal('sous_total', 10, 2)->default(0);
            $table->decimal('total_ttc', 10, 2)->default(0);
            $table->string('condition_reglement')->default('30 jours');
            $table->string('statut')->default('impayé'); // payé, impayé, en retard
            $table->timestamps();


            $table->foreign('client_id')->references('id')->on('clients')->onDelete('cascade');
                        
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('factures');
    }
};
