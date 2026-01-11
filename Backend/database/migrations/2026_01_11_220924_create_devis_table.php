<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
   Schema::create('devis', function (Blueprint $table) {
    $table->id();
    $table->unsignedBigInteger('client_id');
    $table->string('numero')->unique(); // DEV/2026/0001
    $table->text('description');
    $table->integer('quantite');
    $table->integer('nombre_jours');
    $table->decimal('prix_unitaire', 10, 2);
    $table->decimal('taxe', 5, 2)->nullable();
    $table->decimal('sous_total', 10, 2);
    $table->decimal('tva', 10, 2);
    $table->decimal('total_ttc', 10, 2);
    $table->string('condition_reglement')->nullable();
    $table->date('date_devis'); // Date de création du devis
    $table->date('date_evenement'); // Date de l'événement
    $table->string('status')->default('en_attente'); // en_attente, a_facturer, facturé
    $table->unsignedBigInteger('origine_devis_id')->nullable(); // référence à un devis original
    $table->timestamps();

    $table->foreign('client_id')->references('id')->on('clients')->onDelete('cascade');
    $table->foreign('origine_devis_id')->references('id')->on('devis')->onDelete('set null');
});


    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('devis');
    }
};
